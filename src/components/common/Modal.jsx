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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      {/* Dark backdrop overlay with click-to-close */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content Container */}
      <div
        className={`relative w-full ${sizeWidths[size] || sizeWidths.md} bg-white dark:bg-[#14121C] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-10 overflow-hidden transform transition-all my-auto sm:my-8 max-h-[92dvh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-white/10 flex items-start justify-between bg-white dark:bg-[#14121C] shrink-0">
          <div className="pr-2">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F8F6EF]">{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 dark:text-[#A6A1B5] mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 dark:text-[#A6A1B5] hover:text-slate-600 dark:hover:text-[#F8F6EF] hover:bg-slate-100 dark:hover:bg-white/10 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex-1 overflow-y-auto text-slate-800 dark:text-[#F8F6EF]">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 dark:bg-[#100E17]/80 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
