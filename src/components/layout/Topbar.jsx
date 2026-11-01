import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Plus,
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
import ThemeToggle from '../common/ThemeToggle';
import { formatRelativeTime, sortActivitiesNewestFirst } from '../../utils/dateUtils';

/**
 * Topbar Component
 * 
 * Provides search, active tenant context indicator, quick creation actions,
 * theme toggle, and activity notifications dropdown.
 */
export default function Topbar({
  onMenuClick,
  onOpenCreateProject,
  onOpenCreateTask,
}) {
  const navigate = useNavigate();
  const {
    activeWorkspace,
    searchQuery,
    setSearchQuery,
    isLoading,
  } = useWorkspace();
  const { user, logout } = useAuth();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true, state: {} });
    }
  };

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
    <header className="h-16 bg-white dark:bg-[#14121C] border-b border-slate-200 dark:border-white/10 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left section: Mobile menu button + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-[#A6A1B5] hover:text-slate-700 dark:hover:text-[#F8F6EF] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]/60">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, tasks, or tags..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#0B0A0F] border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20 focus:border-indigo-500 dark:focus:border-[#C9B8FF]/50 focus:bg-white dark:focus:bg-[#100E17] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 dark:text-[#A6A1B5] hover:text-slate-600 dark:hover:text-[#F8F6EF]"
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
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-[#A6A1B5]">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-[#C9B8FF]" />
            <span className="font-semibold text-slate-900 dark:text-[#F8F6EF] truncate max-w-[120px]">
              {activeWorkspace.name}
            </span>
            <Badge variant="primary" size="sm">
              {activeWorkspace.plan}
            </Badge>
          </div>
        )}

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

        {/* Theme Toggle in authenticated Topbar */}
        <ThemeToggle className="text-slate-500 dark:text-[#A6A1B5] hover:text-slate-800 dark:hover:text-[#F8F6EF]" />

        {/* Activity / Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-500 dark:text-[#A6A1B5] hover:text-slate-700 dark:hover:text-[#F8F6EF] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors relative"
            aria-label="View recent activity"
          >
            <Bell className="w-4 h-4" />
            {activeWorkspace?.activities?.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 dark:bg-[#C9B8FF] rounded-full ring-2 ring-white dark:ring-[#14121C] animate-pulse" />
            )}
          </button>

          {/* Notifications Flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1A1726] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in duration-100">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-[#F8F6EF]">
                  Tenant Activity Feed
                </h4>
                <Badge variant="primary" size="sm">
                  {activeWorkspace?.activities?.length || 0} Events
                </Badge>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                {activeWorkspace?.activities && activeWorkspace.activities.length > 0 ? (
                  sortActivitiesNewestFirst(activeWorkspace.activities).map((act, index) => (
                    <div key={act.id || act._id || `topbar-act-${index}`} className="p-3 text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <p className="text-slate-800 dark:text-[#F8F6EF]">
                        <span className="font-semibold text-slate-900 dark:text-[#F8F6EF]">{act.user}</span>{' '}
                        {act.action}{' '}
                        <span className="font-medium text-indigo-600 dark:text-[#C9B8FF]">"{act.target}"</span>
                        {act.destination && (
                          <span className="text-slate-600 dark:text-[#A6A1B5]"> to {act.destination}</span>
                        )}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-[#A6A1B5]/70 mt-1 block">
                        {formatRelativeTime(act.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-[#A6A1B5]">
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
          onClick={handleLogout}
          title={`Sign out (${user?.name || user?.email})`}
          className="p-2 rounded-lg text-slate-400 dark:text-[#A6A1B5] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
