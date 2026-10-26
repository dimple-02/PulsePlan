import React from 'react';

/**
 * Reusable Card Compound Components
 * 
 * Demonstrates Component Composition pattern in React.
 * Allows flexible layout construction while maintaining consistent styling.
 */
export function Card({ children, className = '', hoverEffect = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action = null }) {
  return (
    <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between ${className}`}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-slate-900 leading-snug ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 ${className}`}>
      {children}
    </p>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 rounded-b-xl flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export default Card;
