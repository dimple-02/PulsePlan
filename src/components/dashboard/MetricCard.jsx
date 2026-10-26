import React from 'react';
import { Card } from '../common/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * MetricCard Component
 * 
 * Reusable metric summary card with icon, percentage change, and trend direction.
 */
export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconBg = 'bg-indigo-50 text-indigo-600',
  trend = null, // e.g. '+12%'
  isPositive = true,
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-slate-400 mt-1">
          {subtext}
        </p>
      )}
    </Card>
  );
}
