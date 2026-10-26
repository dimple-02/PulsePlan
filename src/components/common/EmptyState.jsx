import React from 'react';
import Button from './Button';
import { Inbox } from 'lucide-react';

/**
 * Reusable Empty State Component
 * 
 * Provides friendly feedback when lists, search results, or Kanban columns
 * have no items to display.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no items to display in this view right now.',
  actionLabel = null,
  onAction = null,
  actionIcon = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
