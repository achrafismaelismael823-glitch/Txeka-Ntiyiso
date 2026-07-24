// Router — Protected Routes, Lazy Loading, Role-Based Access, Error Boundary

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './layouts/DashboardLayout';

// ─── Lazy Loading de todas as páginas ────────────────────────────────
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EmitPage = lazy(() => import('./pages/EmitPage'));
const BulkEmitPage = lazy(() => import('./pages/BulkEmitPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const InstitutionsPage = lazy(() => import('./pages/InstitutionsPage'));
const CreditsPage = lazy(() => import('./pages/CreditsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ─── Loading Skeleton ────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="space-y-4 w-full max-w-2xl">
      <div className="h-8 bg-slate-200 rounded-lg animate-pulse w-1/3" />
      <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);

// ─── Protected Route Component ───────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole = 'any' }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasPermission(requiredRole)) return <Navigate to="/dashboard" replace />;

  return children;
};

// ─── Public Route (só para não autenticados) ─────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── App Routes ──────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route
        path="/verify"
        element={
          <Suspense fallback={<PageLoader />}>
            <VerifyPage />
          </Suspense>
        }
      />

      {/* Protegidas — Layout Dashboard */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={
          <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>
        } />
        <Route path="/emit" element={
          <Suspense fallback={<PageLoader />}><EmitPage /></Suspense>
        } />
        <Route path="/bulk" element={
          <Suspense fallback={<PageLoader />}><BulkEmitPage /></Suspense>
        } />
        <Route path="/documents" element={
          <Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense>
        } />
        <Route path="/credits" element={
          <Suspense fallback={<PageLoader />}><CreditsPage /></Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
        } />
        
        {/* Admin Only */}
        <Route path="/audit" element={
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<PageLoader />}><AuditPage /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/institutions" element={
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<PageLoader />}><InstitutionsPage /></Suspense>
          </ProtectedRoute>
        } />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={
        <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>
      } />
    </Routes>
  );
}

// ─── App Root ────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

