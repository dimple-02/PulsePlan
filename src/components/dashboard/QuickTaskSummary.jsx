import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../common/Card';
import { CheckCircle2, Circle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * QuickTaskSummary Component
 * 
 * Shows distribution of tasks across Kanban workflow statuses.
 */
export default function QuickTaskSummary({ tasks = [] }) {
  const counts = {
    backlog: tasks.filter((t) => t.status === 'backlog').length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const columns = [
    { label: 'Backlog', count: counts.backlog, color: 'bg-slate-400', textColor: 'text-slate-600' },
    { label: 'To Do', count: counts.todo, color: 'bg-sky-500', textColor: 'text-sky-600' },
    { label: 'In Progress', count: counts.in_progress, color: 'bg-indigo-600', textColor: 'text-indigo-600' },
    { label: 'In Review', count: counts.review, color: 'bg-amber-500', textColor: 'text-amber-600' },
    { label: 'Completed', count: counts.done, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  ];

  return (
    <Card>
      <CardHeader
        action={
          <Link
            to="/kanban"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Open Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <CardTitle>Kanban Status Breakdown</CardTitle>
        <CardDescription>{tasks.length} total tasks tracked</CardDescription>
      </CardHeader>

      <CardBody>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {columns.map((col) => (
            <div
              key={col.label}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-xs font-medium text-slate-600 truncate">
                  {col.label}
                </span>
              </div>
              <span className={`text-xl font-bold ${col.textColor}`}>
                {col.count}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
