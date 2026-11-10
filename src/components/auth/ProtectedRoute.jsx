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
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-[#EFEAFE] dark:bg-[#1C1926] border border-[#7C5CFC]/30 dark:border-[#C9B8FF]/30 flex items-center justify-center text-[#5935D6] dark:text-[#C9B8FF] shadow-[0_0_25px_rgba(89,53,214,0.2)] dark:shadow-[0_0_25px_rgba(201,184,255,0.2)] mb-4 animate-bounce">
          <Layers className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-[#5C576C] dark:text-[#A6A1B5] text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#5935D6] dark:text-[#C9B8FF]" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location, openLogin: true }} />;
  }

  // Check if newly registered user has incomplete onboarding
  const needsOnboarding = Boolean(
    user?.onboarding &&
    user.onboarding.completed === false &&
    user.onboarding.skipped === false
  );

  // If user requires onboarding and is trying to access other private routes, redirect to /onboarding
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
