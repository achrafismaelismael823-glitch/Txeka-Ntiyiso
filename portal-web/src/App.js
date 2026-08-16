import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';

// Lazy loading das páginas — performance otimizada
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage/DocumentsPage'));
const EmitPage = lazy(() => import('./pages/EmitPage/EmitPage'));
const BulkEmitPage = lazy(() => import('./pages/BulkEmitPage/BulkEmitPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage/VerifyPage'));
const AuditPage = lazy(() => import('./pages/AuditPage/AuditPage'));
const CreditsPage = lazy(() => import('./pages/CreditsPage/CreditsPage'));
const InstitutionsPage = lazy(() => import('./pages/InstitutionsPage/InstitutionsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage/NotFoundPage'));

// PageLoader — skeleton global para lazy loading
const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      <p className="text-sm text-slate-500">A carregar...</p>
    </div>
  </div>
);

// ProtectedRoute — redireciona para login se não autenticado
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider position="top-right">
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Pública */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/verify" element={<VerifyPage />} />

                {/* Protegidas — Dashboard Layout */}
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/documents" element={
                    <ProtectedRoute allowedRoles={['admin', 'institution']}>
                      <DocumentsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/emit" element={
                    <ProtectedRoute allowedRoles={['admin', 'institution']}>
                      <EmitPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/bulk-emit" element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <BulkEmitPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/audit" element={
                    <ProtectedRoute allowedRoles={['admin', 'institution']}>
                      <AuditPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/credits" element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <CreditsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/institutions" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <InstitutionsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['admin', 'institution']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
