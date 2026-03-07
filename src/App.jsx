import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthContext';
import { RosterProvider } from './context/RosterContext';
import { ErrorBoundary } from './components/feedback/ErrorBoundary';
import { LoadingSpinner } from './components/feedback/LoadingSpinner';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './auth/ProtectedRoute';

// Lazy load pages for code splitting
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);
const SearchPage = lazy(() =>
  import('./pages/SearchPage').then(m => ({ default: m.SearchPage }))
);
const LoginPage = lazy(() =>
  import('./auth/LoginPage').then(m => ({ default: m.LoginPage }))
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then(m => ({ default: m.AdminPage }))
);
const LogsPage = lazy(() =>
  import('./pages/LogsPage').then(m => ({ default: m.LogsPage }))
);
const TeamPage = lazy(() =>
  import('./pages/TeamPage').then(m => ({ default: m.TeamPage }))
);
const VerifyPage = lazy(() =>
  import('./pages/VerifyPage').then(m => ({ default: m.VerifyPage }))
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RosterProvider>
          <BrowserRouter>
            <div className="min-h-screen font-sans text-gray-900 selection:bg-red-200 overflow-x-hidden">
              <Header />
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <LoadingSpinner message="Loading page..." />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/verify/:id" element={<VerifyPage />} />
                  <Route
                    path="/team"
                    element={
                      <ProtectedRoute requiredRole="team_user">
                        <TeamPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/logs"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <LogsPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
              <Toaster position="top-center" richColors />
            </div>
          </BrowserRouter>
        </RosterProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
