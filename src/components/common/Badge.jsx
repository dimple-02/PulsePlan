import React from 'react';

/**
 * Reusable Badge Component
 * 
 * Props:
 * - variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'info'
 * - size: 'sm' | 'md'
 * - dot: boolean (shows a small colored status dot)
 * - children: ReactNode
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) {
  const variantStyles = {
    primary: 'bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-700 dark:text-[#C9B8FF] border-indigo-200 dark:border-[#C9B8FF]/30',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
    neutral: 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-[#F8F6EF] border-slate-200 dark:border-white/15',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-[#FFD6E8] border-purple-200 dark:border-purple-800/40',
    info: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/40',
  };

  const dotColors = {
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-400',
    purple: 'bg-purple-500',
    info: 'bg-sky-500',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.neutral}`}
        />
      )}
      {children}
    </span>
  );
}
