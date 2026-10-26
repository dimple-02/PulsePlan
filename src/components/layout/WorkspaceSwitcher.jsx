import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { ChevronsUpDown, Check, Building2, Plus, Sparkles } from 'lucide-react';
import Badge from '../common/Badge';

/**
 * WorkspaceSwitcher Component
 * 
 * Central piece for demonstrating Multi-Tenancy in this SaaS.
 * Allows switching between distinct tenant organizations, immediately
 * scoping the projects, kanban tasks, and team members to that tenant.
 */
export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeWorkspace) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition-all text-left border border-slate-200 group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
            style={{ backgroundColor: activeWorkspace.color || '#4f46e5' }}
          >
            {activeWorkspace.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 truncate block">
                {activeWorkspace.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-500 font-medium truncate">
                {activeWorkspace.plan} Plan
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {activeWorkspace.projects?.length || 0} Projects
              </span>
            </div>
          </div>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 ml-1" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-100">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Switch Tenant Workspace
          </div>

          <div className="max-h-60 overflow-y-auto">
            {workspaces.map((ws) => {
              const wsId = ws._id || ws.id;
              const isSelected = wsId === (activeWorkspace._id || activeWorkspace.id);
              return (
                <button
                  key={wsId}
                  type="button"
                  onClick={() => {
                    switchWorkspace(wsId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-indigo-50/70 text-indigo-900 font-medium' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: ws.color }}
                    >
                      {ws.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate font-medium">{ws.name}</p>
                      <p className="text-[10px] text-slate-400">{ws.plan} • {ws.projects.length} proj</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 mt-1.5 pt-1 px-2">
            <div className="text-[11px] text-slate-400 px-2 py-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Multi-Tenant Data Isolation Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
