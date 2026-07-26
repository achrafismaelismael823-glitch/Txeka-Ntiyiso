import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './hooks/useAuth';

import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import EmitPage from './pages/EmitPage';
import BulkEmitPage from './pages/BulkEmitPage';
import CreditsPage from './pages/CreditsPage';
import InstitutionsPage from './pages/InstitutionsPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';
import VerifyPage from './pages/VerifyPage';
import NotFoundPage from './pages/NotFoundPage';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify/:hash?" element={<VerifyPage />} />

            <Route
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/emit" element={<EmitPage />} />
              <Route path="/bulk-emit" element={<BulkEmitPage />} />
              <Route path="/credits" element={<CreditsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/institutions"
                element={
                  <PrivateRoute adminOnly>
                    <InstitutionsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <PrivateRoute adminOnly>
                    <AuditPage />
                  </PrivateRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
