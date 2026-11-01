import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../common/Card';
import { Activity, Clock, History } from 'lucide-react';
import { formatRelativeTime, sortActivitiesNewestFirst } from '../../utils/dateUtils';

/**
 * RecentActivityFeed Component
 * 
 * Displays audit log events for the current workspace with live relative times.
 */
export default function RecentActivityFeed({ activities = [] }) {
  // Live reference time that updates periodically so relative times stay accurate without full page reloads
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Sort activities strictly by actual creation time, newest first
  const sortedActivities = useMemo(() => {
    return sortActivitiesNewestFirst(activities);
  }, [activities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600 dark:text-[#C9B8FF]" />
          <span>Tenant Activity Stream</span>
        </CardTitle>
        <CardDescription>Real-time updates in this workspace</CardDescription>
      </CardHeader>

      <CardBody className="p-0">
        {sortedActivities.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-[#A6A1B5] flex items-center justify-center mb-2">
              <History className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-[#F8F6EF]">No activity recorded yet</p>
            <p className="text-[11px] text-slate-400 dark:text-[#A6A1B5]/70 mt-0.5 max-w-xs">
              Actions such as creating projects, tasks, or moving cards will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {sortedActivities.slice(0, 5).map((act, index) => {
              const relativeTime = formatRelativeTime(act.createdAt, currentTime);
              const fullDateTooltip = act.createdAt && !isNaN(new Date(act.createdAt).getTime())
                ? new Date(act.createdAt).toLocaleString()
                : 'Timestamp unavailable';

              return (
                <div
                  key={act.id || act._id || `act-${index}`}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-700 dark:text-[#F8F6EF] leading-snug">
                      <span className="font-semibold text-slate-900 dark:text-[#F8F6EF]">{act.user}</span>{' '}
                      <span className="text-slate-500 dark:text-[#A6A1B5]">{act.action}</span>{' '}
                      <span className="font-medium text-indigo-600 dark:text-[#C9B8FF]">"{act.target}"</span>
                      {act.destination && (
                        <span className="text-slate-500 dark:text-[#A6A1B5]">
                          {' '}to <span className="font-semibold">{act.destination}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-[#A6A1B5]/70 mt-1.5"
                    title={fullDateTooltip}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{relativeTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
