import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import KanbanBoardPage from '../pages/KanbanBoardPage';
import TeamPage from '../pages/TeamPage';
import SettingsPage from '../pages/SettingsPage';
import WorkspacePage from '../pages/WorkspacePage';
import NotFoundPage from '../pages/NotFoundPage';
import LandingPage from '../pages/LandingPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import AcceptInvitationPage from '../pages/AcceptInvitationPage';
import OnboardingPage from '../pages/OnboardingPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { Layers, Loader2 } from 'lucide-react';

/**
 * RootRoute Component
 * 
 * Determines whether to display the public SaaS Landing Page or the authenticated Dashboard.
 * - Logged-out visitors: Default to stunning PulsePlan Landing Page
 * - Authenticated users: Render the AppLayout and DashboardPage
 */
function RootRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  if (isAuthenticated) {
    // If newly registered user has incomplete onboarding, route them to onboarding setup
    if (user?.onboarding && user.onboarding.completed === false && user.onboarding.skipped === false) {
      return <Navigate to="/onboarding" replace />;
    }

    return (
      <AppLayout>
        <DashboardPage />
      </AppLayout>
    );
  }

  return <LandingPage />;
}

/**
 * PublicAuthRoute Component
 * 
 * Renders the landing page with the appropriate modal open (login or signup).
 * If the user is already authenticated, redirects them to their intended destination or home.
 */
function PublicAuthRoute({ defaultMode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isLoading && isAuthenticated) {
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    const fromPath = location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ''}`
      : (typeof location.state?.from === 'string' ? location.state.from : null);

    const needsOnboarding = Boolean(
      user?.onboarding &&
      user.onboarding.completed === false &&
      user.onboarding.skipped === false
    );

    const isInvite =
      (redirectParam && (redirectParam.startsWith('/invitations/') || redirectParam.startsWith('/invite/'))) ||
      (fromPath && (fromPath.startsWith('/invitations/') || fromPath.startsWith('/invite/')));

    if (needsOnboarding && !isInvite) {
      const targetQuery = (fromPath || redirectParam) ? `?redirect=${encodeURIComponent(fromPath || redirectParam)}` : '';
      return <Navigate to={`/onboarding${targetQuery}`} replace />;
    }

    const destination = fromPath || redirectParam || '/';
    return <Navigate to={destination} replace />;
  }

  return <LandingPage defaultAuthModal={defaultMode} />;
}

/**
 * AppRoutes Component
 * 
 * Configures application client-side routing with React Router v6.
 * - Root /: LandingPage for logged-out visitors; AppLayout + Dashboard for authenticated users
 * - /login, /signup: LandingPage with centered Auth Modal (login/signup)
 * - /landing: Explicit public view of LandingPage
 * - Protected routes: /projects, /kanban, /team, /settings, /dashboard
 * - 404 Fallback: NotFoundPage
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Route: Landing Page when unauthenticated, Dashboard when authenticated */}
      <Route path="/" element={<RootRoute />} />

      {/* Public Auth Routes: Landing Page with Login or Signup modal open */}
      <Route path="/login" element={<PublicAuthRoute defaultMode="login" />} />
      <Route path="/signup" element={<PublicAuthRoute defaultMode="signup" />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/invitations/:token" element={<AcceptInvitationPage />} />
      <Route path="/invite/:token" element={<AcceptInvitationPage />} />
      <Route path="/landing" element={<LandingPage />} />

      {/* Protected SaaS Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workspaces" element={<WorkspacePage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/kanban" element={<KanbanBoardPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
