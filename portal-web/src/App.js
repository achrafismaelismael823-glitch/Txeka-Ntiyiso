// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { ShieldAlert } from 'lucide-react';

/**
 * Componente ProtectedRoute
 * Valida autenticação antes de permitir acesso a rotas protegidas
 */
function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          {/* Spinner estilizado com o Ciano Txeka */}
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-transparent mx-auto"></div>
          <p className="text-xs font-mono tracking-widest text-secondary uppercase">A inicializar canal seguro...</p>
        </div>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/login" replace />;
}

/**
 * Componente App Principal
 */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rota de Login - Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rota de Dashboard - Protegida */}
        <Route
          path="/dashboard"
          element = {
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Rota Raiz - Redirecionamento Inteligente */}
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Rota 404 - Página Não Encontrada com Brandbook Aplicado */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans p-4">
              <div className="text-center max-w-sm w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="inline-flex p-3 bg-red-50 text-val-error rounded-xl mb-3">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">404</h1>
                <p className="text-sm font-medium text-slate-600 mt-1 mb-5">O recurso ou ecrã solicitado não existe na rede.</p>
                <a
                  href="/"
                  className="block w-full bg-primary hover:bg-slate-900 text-white font-semibold text-sm py-3 px-4 rounded-xl transition shadow-sm"
                >
                  Voltar ao Início Seguro
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
  }
