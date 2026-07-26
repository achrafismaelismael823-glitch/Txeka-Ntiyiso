import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Lazy loading para otimizar bundle (CRA suporta React.lazy + Suspense)
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const DocumentsPage = React.lazy(() => import('./pages/DocumentsPage'));
const EmitPage = React.lazy(() => import('./pages/EmitPage'));
const BulkEmitPage = React.lazy(() => import('./pages/BulkEmitPage'));
const VerifyPage = React.lazy(() => import('./pages/VerifyPage'));
const AuditPage = React.lazy(() => import('./pages/AuditPage'));
const CreditsPage = React.lazy(() => import('./pages/CreditsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const InstitutionsPage = React.lazy(() => import('./pages/InstitutionsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, adminOnly, institutionOnly }) => {
  const { isAuthenticated, isAdmin, isInstitution, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!isAuthenticated()) return <Navigate to="/login" state={{ from: location }} replace />;
  
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (institutionOnly && !isInstitution) return <Navigate to="/" replace />;
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated()) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Rotas públicas */}
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/verify/:hash?" element={<VerifyPage />} />
    
    {/* Rotas protegidas com layout */}
    <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/emit" element={<EmitPage />} />
      <Route path="/audit" element={<AuditPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      
      {/* Apenas instituição */}
      <Route path="/bulk-emit" element={
        <ProtectedRoute institutionOnly><BulkEmitPage /></ProtectedRoute>
      } />
      <Route path="/credits" element={
        <ProtectedRoute institutionOnly><CreditsPage /></ProtectedRoute>
      } />
      
      {/* Apenas admin */}
      <Route path="/institutions" element={
        <ProtectedRoute adminOnly><InstitutionsPage /></ProtectedRoute>
      } />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <React.Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </React.Suspense>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
