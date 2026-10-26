import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import KanbanBoardPage from '../pages/KanbanBoardPage';
import TeamPage from '../pages/TeamPage';
import SettingsPage from '../pages/SettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

/**
 * AppRoutes Component
 * 
 * Configures application client-side routing with React Router v6.
 * All main pages render nested inside the AppLayout chrome.
 */
export default function AppRoutes() {
  return (
    <Routes>
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

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
