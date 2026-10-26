import React from 'react';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import { Calendar, MoreVertical, ChevronRight, ChevronLeft } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';

/**
 * KanbanCard Component
 * 
 * Individual task card rendered inside a Kanban column.
 * Provides quick move actions and opens the task modal on click.
 */
export default function KanbanCard({ task, onClick }) {
  const { updateTaskStatus } = useWorkspace();

  const priorityMap = {
    low: { variant: 'neutral', label: 'Low' },
    medium: { variant: 'info', label: 'Med' },
    high: { variant: 'warning', label: 'High' },
    urgent: { variant: 'danger', label: 'Urgent' },
  };

  const statusOrder = ['backlog', 'todo', 'in_progress', 'review', 'done'];
  const currentIndex = statusOrder.indexOf(task.status);

  const handleMovePrevious = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      updateTaskStatus(task.id, statusOrder[currentIndex - 1]);
    }
  };

  const handleMoveNext = (e) => {
    e.stopPropagation();
    if (currentIndex < statusOrder.length - 1) {
      updateTaskStatus(task.id, statusOrder[currentIndex + 1]);
    }
  };

  return (
    <div
      onClick={() => onClick(task)}
      className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group space-y-2.5"
    >
      {/* Card Header: Priority & Story Points */}
      <div className="flex items-center justify-between gap-1">
        <Badge
          variant={priorityMap[task.priority]?.variant || 'neutral'}
          size="sm"
        >
          {priorityMap[task.priority]?.label || task.priority}
        </Badge>

        <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
          {task.storyPoints || 3} pts
        </span>
      </div>

      {/* Task Title */}
      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Assignee, Date, and Column Move Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            name={task.assignee?.name || 'User'}
            initials={task.assignee?.avatar}
            size="xs"
          />
          {task.dueDate && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{task.dueDate}</span>
            </span>
          )}
        </div>

        {/* Quick Shift Controls for Viva demonstration of state transitions */}
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handleMovePrevious}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Move left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {currentIndex < statusOrder.length - 1 && (
            <button
              type="button"
              onClick={handleMoveNext}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Move right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
