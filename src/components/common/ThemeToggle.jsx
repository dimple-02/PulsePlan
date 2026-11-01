import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle Component
 * 
 * Accessible toggle button to switch between Dark Mode and Light Mode.
 * - Shows Sun icon in Dark mode (to switch to light mode)
 * - Shows Moon icon in Light mode (to switch to dark mode)
 * - Smooth transition, accessible tooltip & aria-label
 */
export default function ThemeToggle({ className = '', variant = 'default' }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] dark:focus-visible:ring-[#C9B8FF] ${
        variant === 'navbar'
          ? 'text-[#5C576C] hover:text-[#14121C] hover:bg-black/5 dark:text-[#A6A1B5] dark:hover:text-[#F8F6EF] dark:hover:bg-white/10'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-[#A6A1B5] dark:hover:text-[#F8F6EF] dark:hover:bg-white/10'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#FFD6E8] hover:text-white transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-[#5935D6] hover:text-[#14121C] transition-transform duration-300 hover:-rotate-12" />
      )}
      <span className="sr-only">Toggle theme (current: {theme})</span>
    </button>
  );
}
