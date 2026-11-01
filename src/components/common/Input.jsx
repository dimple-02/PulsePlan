import React from 'react';

/**
 * Reusable Controlled Input Component
 * 
 * Demonstrates:
 * - Controlled component pattern in React (value and onChange driven by state)
 * - Accessible form labels and error messaging
 */
export default function Input({
  label,
  id,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  helperText = '',
  required = false,
  icon: Icon = null,
  className = '',
  ...rest
}) {
  const inputId = id || name || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#A6A1B5]/70">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-lg text-base sm:text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            Icon ? 'pl-9' : 'pl-3.5'
          } pr-3.5 py-2.5 ${
            error
              ? 'border-rose-300 dark:border-rose-500/50 text-rose-900 dark:text-rose-200 placeholder-rose-300 dark:placeholder-rose-300/40 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20'
              : 'border-slate-300 dark:border-white/15 text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:border-indigo-500 dark:focus:border-[#C9B8FF]/60 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20 bg-white dark:bg-[#100E17]'
          }`}
          {...rest}
        />
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-[#A6A1B5]">{helperText}</p>
      ) : null}
    </div>
  );
}
