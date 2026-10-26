import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../common/Card';
import { Activity, Clock, History } from 'lucide-react';

/**
 * RecentActivityFeed Component
 * 
 * Displays audit log events for the current workspace.
 */
export default function RecentActivityFeed({ activities = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Tenant Activity Stream</span>
        </CardTitle>
        <CardDescription>Real-time updates in this workspace</CardDescription>
      </CardHeader>

      <CardBody className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <History className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700">No activity recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
              Actions such as creating projects, tasks, or moving cards will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-900">{act.user}</span>{' '}
                    <span className="text-slate-500">{act.action}</span>{' '}
                    <span className="font-medium text-indigo-600">"{act.target}"</span>
                    {act.destination && (
                      <span className="text-slate-500"> to <span className="font-semibold">{act.destination}</span></span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{act.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
