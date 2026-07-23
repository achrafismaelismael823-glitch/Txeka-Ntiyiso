import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { ShieldAlert, Loader2 } from 'lucide-react';

function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B192C] flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-[#00D2C4] animate-spin mx-auto" />
          <p className="text-xs font-mono tracking-widest text-[#00D2C4] uppercase">
            A inicializar canal seguro...
          </p>
        </div>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/login" replace />;
}

function RedirectRoot() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  
  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  return isAuth ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RedirectRoot />} />
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans p-4">
            <div className="text-center max-w-sm w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="inline-flex p-3 bg-rose-50 text-rose-500 rounded-xl mb-3">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0B192C]">404</h1>
              <p className="text-sm font-medium text-slate-600 mt-1 mb-5">
                O recurso ou ecra solicitado nao existe na rede.
              </p>
              <a
                href="/"
                className="block w-full bg-[#0B192C] hover:bg-slate-800 text-white font-semibold text-sm py-3 px-4 rounded-xl transition shadow-sm"
              >
                Voltar ao Inicio Seguro
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
