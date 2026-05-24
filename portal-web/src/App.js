// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

/**
 * Componente ProtectedRoute
 * Valida autenticação antes de permitir acesso a rotas protegidas
 */
function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticação
    setIsAuth(isAuthenticated());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/login" replace />;
}

/**
 * Componente App Principal
 * Define estrutura de roteamento da aplicação
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
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Rota Raiz - Redireciona para Dashboard se autenticado, Login caso contrário */}
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

        {/* Rota 404 - Página não encontrada */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
                <p className="text-gray-600 mb-4">Página não encontrada</p>
                <a
                  href="/"
                  className="inline-block bg-primary hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Voltar ao Início
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
