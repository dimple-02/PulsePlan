import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Accessible Modal Component
 * 
 * Demonstrates:
 * - Controlled modal pattern with isOpen & onClose props
 * - useEffect hook with cleanup function for keyboard 'Escape' event listener
 * - DOM body scroll locking when modal is open
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  useEffect(() => {
    if (!isOpen) return;

    // Handle ESC key press
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Lock scrolling on document body
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function when modal unmounts or closes
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeWidths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Dark backdrop overlay with click-to-close */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content Container */}
      <div
        className={`relative w-full ${sizeWidths[size] || sizeWidths.md} bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden transform transition-all my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 max-h-[calc(85vh-140px)] overflow-y-auto">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
