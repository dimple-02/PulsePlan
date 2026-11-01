import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Users,
  Settings,
  Layers,
  Sparkles,
  Folder,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import ThemeToggle from '../common/ThemeToggle';

/**
 * Sidebar Component
 * 
 * Provides primary navigation, tenant workspace switcher,
 * project quick-switch list, theme toggle, and mobile responsive dismissal.
 */
export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { activeWorkspace, activeProjectId, setActiveProjectId } = useWorkspace();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true, state: {} });
    }
  };

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Projects', to: '/projects', icon: FolderKanban, count: activeWorkspace?.projects?.length },
    { name: 'Kanban Board', to: '/kanban', icon: Kanban },
    { name: 'Team & Roles', to: '/team', icon: Users, count: activeWorkspace?.members?.length },
    { name: 'Workspace Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#14121C] border-r border-slate-200 dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* App Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-[#C9B8FF] dark:to-[#FFD6E8] flex items-center justify-center text-white dark:text-[#0B0A0F] shadow-md shadow-indigo-200 dark:shadow-[0_0_15px_rgba(201,184,255,0.3)] font-semibold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-[#F8F6EF] tracking-tight flex items-center gap-1.5">
                PulsePlan
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-700 dark:text-[#C9B8FF] px-1.5 py-0.5 rounded border border-indigo-100 dark:border-[#C9B8FF]/20">
                  SaaS
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Switcher Section */}
        <div className="p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#100E17]/60">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#A6A1B5]/70 mb-1.5 px-1">
            Current Tenant
          </div>
          <WorkspaceSwitcher />
        </div>

        {/* Main Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#A6A1B5]/70 mb-2 px-3">
              Overview
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-700 dark:text-[#C9B8FF] font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-[#A6A1B5] hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-[#F8F6EF]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-[#A6A1B5] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Scoped Projects Quick Switch */}
          {activeWorkspace?.projects && activeWorkspace.projects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#A6A1B5]/70">
                  Tenant Projects
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-[#A6A1B5]/70">
                  {activeWorkspace.projects.length} total
                </span>
              </div>
              <div className="space-y-1">
                {activeWorkspace.projects.slice(0, 4).map((proj) => {
                  const projId = proj._id || proj.id;
                  const isSelected = projId === activeProjectId;
                  return (
                    <button
                      key={projId}
                      type="button"
                      onClick={() => {
                        setActiveProjectId(projId);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-[#F8F6EF] font-medium'
                          : 'text-slate-600 dark:text-[#A6A1B5] hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600 dark:text-[#C9B8FF]' : 'text-slate-400 dark:text-[#A6A1B5]/60'}`} />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-[#A6A1B5]/60 shrink-0 ml-1">
                        {proj.key}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Current User & Logout footer */}
        <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#100E17]/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar
                name={user?.name || 'User'}
                initials={user?.avatar || 'U'}
                status="online"
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-[#F8F6EF] truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-[#A6A1B5] truncate" title={user?.email}>
                  {user?.email || 'Authenticated'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle className="text-slate-400 dark:text-[#A6A1B5] hover:text-slate-700 dark:hover:text-[#F8F6EF]" />
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of PulsePlan"
                className="p-1.5 rounded-lg text-slate-400 dark:text-[#A6A1B5] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
