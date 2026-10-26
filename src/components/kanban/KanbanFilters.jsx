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
    <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Left side: Project Picker & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-600 shrink-0 hidden sm:block" />
          <select
            value={activeProjectId || ''}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {activeWorkspace?.projects && activeWorkspace.projects.length > 0 ? (
              activeWorkspace.projects.map((proj) => {
                const pId = proj._id || proj.id;
                return (
                  <option key={pId} value={pId}>
                    {proj.name} ({proj.key})
                  </option>
                );
              })
            ) : (
              <option value="">No projects in workspace</option>
            )}
          </select>
        </div>

        {/* Board Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter tasks on board..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right side: Priority & Assignee dropdowns */}
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
