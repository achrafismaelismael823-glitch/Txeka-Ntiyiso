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

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-cyan">A carregar...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="emit" element={<EmitPage />} />
          <Route path="bulk-emit" element={<BulkEmitPage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="credits" element={<CreditsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit" element={<PrivateRoute adminOnly><AuditPage /></PrivateRoute>} />
          <Route path="institutions" element={<PrivateRoute adminOnly><InstitutionsPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

