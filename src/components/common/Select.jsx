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
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
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
        className={`block w-full rounded-lg text-sm border transition-colors px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white ${
          error
            ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-indigo-100'
        }`}
        {...rest}
      >
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {labelText}
            </option>
          );
        })}
      </select>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
