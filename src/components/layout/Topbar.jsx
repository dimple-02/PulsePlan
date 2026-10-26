import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  RotateCcw,
  Building2,
  FolderPlus,
  CheckSquare,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

/**
 * Topbar Component
 * 
 * Provides search, active tenant context indicator, quick creation actions,
 * activity notifications dropdown, and seed data reset tool for testing.
 */
export default function Topbar({
  onMenuClick,
  onOpenCreateProject,
  onOpenCreateTask,
}) {
  const {
    activeWorkspace,
    searchQuery,
    setSearchQuery,
    resetAllData,
    isLoading,
  } = useWorkspace();
  const { user, logout } = useAuth();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left section: Mobile menu button + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, tasks, or tags..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right section: Tenant badge, Quick Actions & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Multi-Tenant Workspace Badge */}
        {activeWorkspace && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-900 truncate max-w-[120px]">
              {activeWorkspace.name}
            </span>
            <Badge variant="primary" size="sm">
              {activeWorkspace.plan}
            </Badge>
          </div>
        )}

        {/* Reset Mock Data for Viva demonstration */}
        <Button
          variant="ghost"
          size="sm"
          onClick={resetAllData}
          title="Reset to default seed data"
          className="hidden sm:inline-flex text-slate-500 hover:text-slate-800"
          icon={RotateCcw}
        >
          Reset Seed
        </Button>

        {/* Quick Create Project */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenCreateProject}
          icon={FolderPlus}
          className="hidden sm:inline-flex"
        >
          Project
        </Button>

        {/* Quick Create Task */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateTask}
          icon={Plus}
        >
          <span className="hidden xs:inline">New Task</span>
          <span className="xs:hidden">Task</span>
        </Button>

        {/* Activity / Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
            aria-label="View recent activity"
          >
            <Bell className="w-4 h-4" />
            {activeWorkspace?.activities?.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900">
                  Tenant Activity Feed
                </h4>
                <Badge variant="primary" size="sm">
                  {activeWorkspace?.activities?.length || 0} Events
                </Badge>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {activeWorkspace?.activities && activeWorkspace.activities.length > 0 ? (
                  activeWorkspace.activities.map((act) => (
                    <div key={act.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                      <p className="text-slate-800">
                        <span className="font-semibold text-slate-900">{act.user}</span>{' '}
                        {act.action}{' '}
                        <span className="font-medium text-indigo-600">"{act.target}"</span>
                        {act.destination && (
                          <span> to {act.destination}</span>
                        )}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {act.timestamp}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No recent activities recorded for this workspace.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User signout shortcut */}
        <button
          type="button"
          onClick={logout}
          title={`Sign out (${user?.name || user?.email})`}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
