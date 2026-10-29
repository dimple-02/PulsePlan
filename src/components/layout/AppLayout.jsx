import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CreateProjectModal from '../projects/CreateProjectModal';
import CreateTaskModal from '../kanban/CreateTaskModal';
import { useWorkspace } from '../../hooks/useWorkspace';
import { CheckCircle2, AlertCircle, Info, RefreshCw, AlertTriangle } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-200">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : notification.type === 'danger' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>

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
