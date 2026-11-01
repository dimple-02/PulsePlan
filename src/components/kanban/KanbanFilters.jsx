import React from 'react';
import { Search, Filter, Folder, X } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';

/**
 * KanbanFilters Component
 * 
 * Filters board tasks by Project, Priority, and Search keyword.
 */
export default function KanbanFilters({
  searchTerm,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  assigneeFilter,
  onAssigneeChange,
  onResetFilters,
  isFiltered,
}) {
  const { activeWorkspace, activeProjectId, setActiveProjectId } = useWorkspace();

  return (
    <div className="bg-white dark:bg-[#14121C] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Left side: Project Picker & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-600 dark:text-[#C9B8FF] shrink-0 hidden sm:block" />
          <select
            value={activeProjectId || ''}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="w-full sm:w-auto text-base sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-white/15 py-1.5 px-3 bg-white dark:bg-[#100E17] text-slate-900 dark:text-[#F8F6EF] focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20"
          >
            {activeWorkspace?.projects && activeWorkspace.projects.length > 0 ? (
              activeWorkspace.projects.map((proj) => {
                const pId = proj._id || proj.id;
                return (
                  <option key={pId} value={pId} className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">
                    {proj.name} ({proj.key})
                  </option>
                );
              })
            ) : (
              <option value="" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">No projects in workspace</option>
            )}
          </select>
        </div>

        {/* Board Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]/60">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter tasks on board..."
            className="w-full pl-8 pr-3 py-1.5 text-base sm:text-xs bg-slate-50 dark:bg-[#0B0A0F] border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20 focus:bg-white dark:focus:bg-[#100E17] transition-all"
          />
        </div>
      </div>

      {/* Right side: Priority & Assignee dropdowns */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="text-base sm:text-xs rounded-lg border border-slate-300 dark:border-white/15 py-1.5 px-2.5 bg-white dark:bg-[#100E17] text-slate-700 dark:text-[#F8F6EF] focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20"
        >
          <option value="all" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">All Priorities</option>
          <option value="urgent" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">Urgent</option>
          <option value="high" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">High</option>
          <option value="medium" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">Medium</option>
          <option value="low" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">Low</option>
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
