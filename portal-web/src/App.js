import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';

// ── Lazy loading de todas as páginas ──
const LoginPage = lazy(() => import('./pages/LoginPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const RevokePage = lazy(() => import('./pages/RevokePage'));
const InstitutionDashboardPage = lazy(() => import('./pages/InstitutionDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const EmitPage = lazy(() => import('./pages/EmitPage'));
const BulkEmitPage = lazy(() => import('./pages/BulkEmitPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const CreditsPage = lazy(() => import('./pages/CreditsPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const InstitutionsPage = lazy(() => import('./pages/InstitutionsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      <p className="text-sm text-slate-500">A carregar...</p>
    </div>
  </div>
);

/**
 * ProtectedRoute — Guarda de rotas com verificação de role.
 * Princípio: nunca confiar no frontend para segurança (backend é a fonte da verdade),
 * mas o frontend deve espelhar as permissões para UX correta.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const fallback = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

/**
 * RoleRedirect — Redireciona a raiz "/" conforme o role do utilizador.
 */
const RoleRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider position="top-right">
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ── Rotas Públicas ── */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/verify/:hash" element={<VerifyPage />} />

                {/* ── Redirect baseado no role ── */}
                <Route path="/" element={<RoleRedirect />} />

                {/* ── Instituição: operacional, zero configuração ── */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <InstitutionDashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/emit" element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <EmitPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/bulk-emit" element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <BulkEmitPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/credits" element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <CreditsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/revoke" element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <RevokePage />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* ── Admin: gestão do sistema, zero operação de documentos ── */}
                <Route element={<DashboardLayout />}>
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/institutions" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <InstitutionsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/audit" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AuditPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/documents" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DocumentsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* ── 404 ── */}
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
