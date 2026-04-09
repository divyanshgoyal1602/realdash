import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AlertsProvider } from './context/AlertsContext';
import Layout from './components/shared/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OfficePage from './pages/OfficePage';
import ActivitiesPage from './pages/ActivitiesPage';
import AAPPage from './pages/AAPPage';
import ReportsPage from './pages/ReportsPage';
import AlertsPage from './pages/AlertsPage';
import AdminPage from './pages/AdminPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading RealDash…</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// Redirect already-logged-in users away from auth pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public auth routes */}
    <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Protected app routes */}
    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="offices/:id" element={<OfficePage />} />
      <Route path="activities"  element={<ActivitiesPage />} />
      <Route path="aap"         element={<AAPPage />} />
      <Route path="reports"     element={<ReportsPage />} />
      <Route path="alerts"      element={<AlertsPage />} />
      <Route path="admin" element={
        <ProtectedRoute roles={['superadmin', 'ministry']}>
          <AdminPage />
        </ProtectedRoute>
      } />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AlertsProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#34d399', secondary: '#1e293b' } },
              error:   { iconTheme: { primary: '#f87171', secondary: '#1e293b' } },
            }}
          />
          </AlertsProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
