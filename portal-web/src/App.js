import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmitPage from './pages/EmitPage';
import BulkEmitPage from './pages/BulkEmitPage';
import VerifyPage from './pages/VerifyPage';
import DocumentsPage from './pages/DocumentsPage';
import CreditsPage from './pages/CreditsPage';
import AuditPage from './pages/AuditPage';
import InstitutionsPage from './pages/InstitutionsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// ============================================
// GUARDAS DE ROTA
// ============================================

// Rota pública: só acessível se NÃO estiver logado
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-brand-fundo">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
          <p className="text-[0.7rem] text-silver-dark/60 uppercase tracking-widest">A carregar sessão...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    // Já logado? Redireciona conforme o tipo
    if (user._type === 'admin' || user._role === 'admin') {
      return <Navigate to="/audit" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Rota privada genérica: qualquer usuário autenticado
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-brand-fundo">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
          <p className="text-[0.7rem] text-silver-dark/60 uppercase tracking-widest">A carregar sessão...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Rota exclusiva para Admin
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-brand-fundo">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
          <p className="text-[0.7rem] text-silver-dark/60 uppercase tracking-widest">A carregar sessão...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (user._type !== 'admin' && user._role !== 'admin') {
    // Instituição tentando aceder a rota admin? Manda para o painel dela
    return <Navigate to="/" replace />;
  }
  return children;
};

// ============================================
// APP PRINCIPAL
// ============================================

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Login público */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* Área autenticada com layout */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* INSTITUIÇÃO: Dashboard pessoal (index) */}
          <Route index element={<DashboardPage />} />
          
          {/* TODOS (Admin + Instituição): Operações core */}
          <Route path="emit" element={<EmitPage />} />
          <Route path="bulk-emit" element={<BulkEmitPage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="credits" element={<CreditsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* ADMIN ONLY: Gestão do sistema */}
          <Route 
            path="audit" 
            element={
              <AdminRoute>
                <AuditPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="institutions" 
            element={
              <AdminRoute>
                <InstitutionsPage />
              </AdminRoute>
            } 
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
