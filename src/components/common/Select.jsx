import React from 'react';

/**
 * Reusable Controlled Select Component
 */
export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  error = '',
  helperText = '',
  required = false,
  className = '',
  ...rest
}) {
  const selectId = id || name || `select-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`block w-full rounded-lg text-sm border transition-colors px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white dark:bg-[#100E17] ${
          error
            ? 'border-rose-300 dark:border-rose-500/50 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-900/40'
            : 'border-slate-300 dark:border-white/15 text-slate-800 dark:text-[#F8F6EF] focus:border-indigo-500 dark:focus:border-[#C9B8FF]/60 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20'
        }`}
        {...rest}
      >
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">
              {labelText}
            </option>
          );
        })}
      </select>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-[#A6A1B5]">{helperText}</p>
      ) : null}
    </div>
  );
}
