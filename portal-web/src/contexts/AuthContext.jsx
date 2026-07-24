
// Contexto de Autenticação Enterprise — RBAC, sessão, timeout, refresh automático

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginInstitution, loginAdmin, getMyDashboard } from '../services/api';

const AuthContext = createContext(null);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const WARNING_BEFORE = 5 * 60 * 1000;   // Aviso aos 25min

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState(null); // 'admin' | 'institution'
  const [sessionWarning, setSessionWarning] = useState(false);
  
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const activityRef = useRef(Date.now());

  // ─── Decode Token ────────────────────────────────────────────────────
  const decodeAndSet = useCallback((token) => {
    try {
      const decoded = jwtDecode(token);
      setRole(decoded.role || 'institution');
      setUser(decoded);
      return decoded;
    } catch {
      return null;
    }
  }, []);

  // ─── Session Timer ───────────────────────────────────────────────────
  const resetSessionTimer = useCallback(() => {
    activityRef.current = Date.now();
    setSessionWarning(false);
    
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);
    
    warningRef.current = setTimeout(() => {
      setSessionWarning(true);
    }, SESSION_TIMEOUT - WARNING_BEFORE);
    
    timeoutRef.current = setTimeout(() => {
      logout('Sessão expirada por inatividade.');
    }, SESSION_TIMEOUT);
  }, []);

  // ─── Activity Listeners ──────────────────────────────────────────────
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetSessionTimer();
    
    events.forEach((e) => window.addEventListener(e, handleActivity));
    return () => events.forEach((e) => window.removeEventListener(e, handleActivity));
  }, [resetSessionTimer]);

  // ─── Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('txeka_access_token');
      if (token) {
        const decoded = decodeAndSet(token);
        if (decoded) {
          setIsAuthenticated(true);
          // Carregar dados da instituição se não for admin
          if (decoded.role !== 'admin') {
            try {
              const { data } = await getMyDashboard();
              setInstitution(data.institution);
              localStorage.setItem('txeka_institution', JSON.stringify(data.institution));
            } catch {
              // silent fail
            }
          }
          resetSessionTimer();
        } else {
          logout();
        }
      }
      setIsLoading(false);
    };
    init();
    
    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
    };
  }, [decodeAndSet, resetSessionTimer]);

  // ─── Login Instituição ───────────────────────────────────────────────
  const login = async (institutionId, password) => {
    setIsLoading(true);
    try {
      const { data } = await loginInstitution({ institution_id: institutionId, password });
      const { access_token, token_type, institution: instData } = data;
      
      localStorage.setItem('txeka_access_token', access_token);
      localStorage.setItem('txeka_institution', JSON.stringify(instData));
      
      decodeAndSet(access_token);
      setInstitution(instData);
      setIsAuthenticated(true);
      setRole('institution');
      resetSessionTimer();
      
      return { success: true, institution: instData };
    } catch (error) {
      return { 
        success: false, 
        error: error.userMessage || error.response?.data?.detail?.[0]?.msg || 'Credenciais inválidas.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Login Admin ─────────────────────────────────────────────────────
  const adminLogin = async (email, password) => {
    setIsLoading(true);
    try {
      const { data } = await loginAdmin(email, password);
      const { access_token } = data;
      
      localStorage.setItem('txeka_access_token', access_token);
      decodeAndSet(access_token);
      setIsAuthenticated(true);
      setRole('admin');
      resetSessionTimer();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.userMessage || 'Credenciais de administrador inválidas.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────
  const logout = useCallback((reason = null) => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);
    localStorage.removeItem('txeka_access_token');
    localStorage.removeItem('txeka_refresh_token');
    localStorage.removeItem('txeka_institution');
    setUser(null);
    setInstitution(null);
    setIsAuthenticated(false);
    setRole(null);
    setSessionWarning(false);
    if (reason) {
      window.location.href = `/login?reason=${encodeURIComponent(reason)}`;
    } else {
      window.location.href = '/login';
    }
  }, []);

  // ─── Permissões ──────────────────────────────────────────────────────
  const hasPermission = useCallback((requiredRole) => {
    if (!role) return false;
    if (requiredRole === 'any') return true;
    if (requiredRole === 'admin') return role === 'admin';
    if (requiredRole === 'institution') return role === 'institution' || role === 'admin';
    return false;
  }, [role]);

  // ─── Extend Session ──────────────────────────────────────────────────
  const extendSession = () => {
    resetSessionTimer();
    setSessionWarning(false);
  };

  const value = {
    user,
    institution,
    isAuthenticated,
    isLoading,
    role,
    sessionWarning,
    login,
    adminLogin,
    logout,
    hasPermission,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

