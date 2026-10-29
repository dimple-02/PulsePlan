import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layers, Loader2 } from 'lucide-react';

/**
 * ProtectedRoute Component
 * 
 * Guards private routes (Dashboard, Projects, Kanban, Team, Settings).
 * - Displays a loading screen during asynchronous session verification.
 * - Redirects unauthenticated visitors to /login, preserving target URL for post-login redirection.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0A0F] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1C1926] border border-[#C9B8FF]/30 flex items-center justify-center text-[#C9B8FF] shadow-[0_0_25px_rgba(201,184,255,0.2)] mb-4 animate-bounce">
          <Layers className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-[#A6A1B5] text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#C9B8FF]" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
