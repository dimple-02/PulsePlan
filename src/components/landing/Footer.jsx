import React from 'react';
import { Layers } from 'lucide-react';

/**
 * Footer Component
 * 
 * - PulsePlan wordmark and icon
 * - Short product description
 * - Navigation links (Features, How It Works, Preview, Architecture, Sign In, Get Started)
 * - Copyright line
 * 
 * Preserves authenticity: No invented social accounts, testimonials, or fake claims.
 */
export default function Footer({ onOpenLogin, onOpenSignup }) {
  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const topOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <footer className="bg-[#F0EEF6] dark:bg-[#0B0A0F] border-t border-[#E5E1EE] dark:border-white/[0.08] py-12 sm:py-16 text-[#5C576C] dark:text-[#A6A1B5] transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pb-10 border-b border-[#E5E1EE] dark:border-white/[0.06]">
          {/* Brand & Description */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1C1926] border border-[#7C5CFC]/30 dark:border-[#C9B8FF]/25 flex items-center justify-center text-[#5935D6] dark:text-[#C9B8FF] shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-[#14121C] dark:text-[#F8F6EF] tracking-tight font-sans">
                PulsePlan
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5C576C] dark:text-[#A6A1B5] max-w-sm leading-relaxed">
              Multi-tenant project and workspace management platform engineered for engineering,
              product, and operations teams to organize, prioritize, and execute.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-2.5">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#14121C] dark:text-[#F8F6EF]">
              Navigation
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleScrollTo(e, 'features')}
                  className="hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleScrollTo(e, 'how-it-works')}
                  className="hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#preview"
                  onClick={(e) => handleScrollTo(e, 'preview')}
                  className="hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
                >
                  Product Showcase
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  onClick={(e) => handleScrollTo(e, 'architecture')}
                  className="hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors"
                >
                  Architecture & Security
                </a>
              </li>
            </ul>
          </div>

          {/* Access / Actions */}
          <div className="md:col-span-3 space-y-2.5">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#14121C] dark:text-[#F8F6EF]">
              Access Workspace
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-left hover:text-[#14121C] dark:hover:text-[#F8F6EF] transition-colors focus:outline-none"
                >
                  Sign In to Tenant
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSignup}
                  className="text-left text-[#5935D6] dark:text-[#C9B8FF] hover:text-[#4828b8] dark:hover:text-[#ded2ff] font-medium transition-colors focus:outline-none"
                >
                  Create New Workspace
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Disclaimer Line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5C576C]/80 dark:text-[#A6A1B5]/80 gap-3">
          <p>© 2026 PulsePlan Inc. Multi-tenant project management platform.</p>
          <p className="font-mono text-[11px]">Strict Data Isolation • Encrypted Sessions</p>
        </div>
      </div>
    </footer>
  );
}
