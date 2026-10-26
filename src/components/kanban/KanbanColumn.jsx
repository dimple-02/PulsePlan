import React from 'react';
import KanbanCard from './KanbanCard';
import { Plus, CheckCircle, Clock } from 'lucide-react';

/**
 * KanbanColumn Component
 * 
 * Column wrapper containing the task cards for a specific status.
 * Renders an empty placeholder state when no tasks match.
 * 
 * Syllabus Demonstration: React Props & Prop Drilling
 * - Intermediate component in the hierarchy: KanbanBoardPage -> KanbanColumn -> KanbanCard
 * - Receives `onCardClick` from KanbanBoardPage and drills it down to KanbanCard as `onClick`.
 */
export default function KanbanColumn({
  id,
  title,
  indicatorColor = 'bg-slate-400',
  tasks = [],
  onCardClick,
  onQuickAdd,
}) {
  return (
    <div className="w-72 sm:w-80 shrink-0 flex flex-col bg-slate-100/70 rounded-2xl border border-slate-200/80 p-3 max-h-[calc(100vh-210px)]">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${indicatorColor}`} />
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
            {title}
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onQuickAdd(id)}
          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-all shadow-xs"
          title={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/40 min-h-[140px]">
            <p className="text-xs text-slate-400 font-medium">No tasks in {title}</p>
            <button
              type="button"
              onClick={() => onQuickAdd(id)}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a task</span>
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task._id || task.id}
              task={task}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
