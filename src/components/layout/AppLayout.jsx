import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CreateProjectModal from '../projects/CreateProjectModal';
import CreateTaskModal from '../kanban/CreateTaskModal';
import { useWorkspace } from '../../hooks/useWorkspace';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  RefreshCw,
  AlertTriangle,
  LayoutDashboard,
  Building2,
  FolderKanban,
  Kanban,
  Users,
} from 'lucide-react';
import Button from '../common/Button';

/**
 * AppLayout Component
 * 
 * Provides consistent frame for all pages:
 * - Collapsible Sidebar (responsive mobile + desktop)
 * - Sticky Topbar with search & actions
 * - Backend Connection Error Alert Banner
 * - Global Modals (Create Project, Create Task)
 * - Feedback Toast messages
 */
export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const { notification, apiError, reloadWorkspaces, isLoading } = useWorkspace();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0A0F] text-slate-900 dark:text-[#F8F6EF] flex flex-col transition-colors">
      {/* Backend API Connection Error Banner */}
      {apiError && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-200" />
            <span>
              <strong>Backend Disconnected:</strong> {apiError}
            </span>
          </div>
          <button
            type="button"
            onClick={reloadWorkspaces}
            disabled={isLoading}
            className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded text-white font-semibold transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 dark:bg-[#1C1829] text-white dark:text-[#F8F6EF] shadow-2xl border border-slate-700 dark:border-white/15 animate-in slide-in-from-bottom duration-200">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : notification.type === 'danger' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400 dark:text-[#C9B8FF] shrink-0" />
          )}
          <span className="text-xs font-medium">{notification.message}</span>
        </div>
      )}

      {/* Responsive Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content wrapper shifted by sidebar width on desktop */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen transition-all">
        {/* Sticky Topbar */}
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onOpenCreateProject={() => setCreateProjectOpen(true)}
          onOpenCreateTask={() => setCreateTaskOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children || <Outlet />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#14121C]/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/10 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors min-w-[56px] min-h-[44px] ${
              isActive
                ? 'text-indigo-600 dark:text-[#C9B8FF] font-semibold'
                : 'text-slate-500 dark:text-[#A6A1B5] hover:text-slate-900 dark:hover:text-[#F8F6EF]'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/workspaces"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors min-w-[56px] min-h-[44px] ${
              isActive
                ? 'text-indigo-600 dark:text-[#C9B8FF] font-semibold'
                : 'text-slate-500 dark:text-[#A6A1B5] hover:text-slate-900 dark:hover:text-[#F8F6EF]'
            }`
          }
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span>Workspaces</span>
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors min-w-[56px] min-h-[44px] ${
              isActive
                ? 'text-indigo-600 dark:text-[#C9B8FF] font-semibold'
                : 'text-slate-500 dark:text-[#A6A1B5] hover:text-slate-900 dark:hover:text-[#F8F6EF]'
            }`
          }
        >
          <FolderKanban className="w-5 h-5 mb-0.5" />
          <span>Projects</span>
        </NavLink>

        <NavLink
          to="/kanban"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors min-w-[56px] min-h-[44px] ${
              isActive
                ? 'text-indigo-600 dark:text-[#C9B8FF] font-semibold'
                : 'text-slate-500 dark:text-[#A6A1B5] hover:text-slate-900 dark:hover:text-[#F8F6EF]'
            }`
          }
        >
          <Kanban className="w-5 h-5 mb-0.5" />
          <span>Kanban</span>
        </NavLink>

        <NavLink
          to="/team"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors min-w-[56px] min-h-[44px] ${
              isActive
                ? 'text-indigo-600 dark:text-[#C9B8FF] font-semibold'
                : 'text-slate-500 dark:text-[#A6A1B5] hover:text-slate-900 dark:hover:text-[#F8F6EF]'
            }`
          }
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Team</span>
        </NavLink>
      </nav>

      {/* Global Modals */}
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />

      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
      />
    </div>
  );
}
