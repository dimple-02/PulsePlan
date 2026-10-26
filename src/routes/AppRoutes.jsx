import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import KanbanBoardPage from '../pages/KanbanBoardPage';
import TeamPage from '../pages/TeamPage';
import SettingsPage from '../pages/SettingsPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';

/**
 * AppRoutes Component
 * 
 * Configures application client-side routing with React Router v6.
 * - Public routes: /login, /signup
 * - Protected routes: Wrapped by <ProtectedRoute /> which enforces authentication
 *   and restores session state from HTTP-only cookies on page reload.
 * - 404 Fallback: NotFoundPage
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected SaaS Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          {/* Dashboard Overview */}
          <Route index element={<DashboardPage />} />

          {/* Project Listing (Grid & Table) */}
          <Route path="projects" element={<ProjectsPage />} />

          {/* Interactive Kanban Board */}
          <Route path="kanban" element={<KanbanBoardPage />} />

          {/* Team Members & Role Access */}
          <Route path="team" element={<TeamPage />} />

          {/* Workspace Configuration & Seed Reset */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
