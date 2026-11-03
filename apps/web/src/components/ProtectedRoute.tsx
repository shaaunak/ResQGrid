import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-rq-bg flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-rq-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-rq-muted uppercase tracking-wider">Verifying Session Credentials...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page with return url
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is not allowed, redirect to overview or citizen home
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-rq-border rounded-xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-[#C8201B] border border-red-200 rounded-full flex items-center justify-center mx-auto text-xl font-bold font-mono">
            403
          </div>
          <h2 className="text-base font-bold text-rq-ink">Access Denied (Insufficient Permissions)</h2>
          <p className="text-xs text-rq-muted leading-relaxed">
            Your authenticated role (<strong className="font-mono text-rq-ink">{role}</strong>) does not have authorization to access this operational screen.
          </p>
          <div className="pt-2">
            <Navigate to="/" replace />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

