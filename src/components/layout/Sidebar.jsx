import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Users,
  Settings,
  Layers,
  Sparkles,
  BookOpen,
  Folder,
  CheckCircle2,
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { useWorkspace } from '../../hooks/useWorkspace';
import Avatar from '../common/Avatar';

/**
 * Sidebar Component
 * 
 * Provides primary navigation, tenant workspace switcher,
 * project quick-switch list, and mobile responsive dismissal.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { activeWorkspace, activeProjectId, setActiveProjectId } = useWorkspace();

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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* App Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                PulsePlan
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                  SaaS
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Switcher Section */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
            Current Tenant
          </div>
          <WorkspaceSwitcher />
        </div>

        {/* Main Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-3">
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
                          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
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
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Tenant Projects
                </span>
                <span className="text-[10px] font-medium text-slate-400">
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
                          ? 'bg-slate-100 text-slate-900 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                        {proj.key}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* College Viva Architecture Card */}
          <div className="p-3 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 rounded-xl border border-indigo-100/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Viva Concept Card</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Multi-tenancy logically partitions data per workspace. React Context manages tenant boundaries without prop-drilling.
            </p>
          </div>
        </div>

        {/* Current User & Workspace Plan footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Avatar name="Alex Morgan" initials="AM" status="online" size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                Alex Morgan
              </p>
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <span>{activeWorkspace?.currentUserRole || 'Administrator'}</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
