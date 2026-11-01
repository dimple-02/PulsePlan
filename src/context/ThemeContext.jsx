import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

/**
 * ThemeProvider Component
 * 
 * Manages global application theme state (Dark Mode & Light Mode).
 * - Restores persisted theme from localStorage
 * - Defaults to 'dark' for visitors without a preference
 * - Synchronously updates:
 *   1. document.documentElement.classList ('dark' or 'light')
 *   2. data-theme attribute
 *   3. data-bs-theme attribute (Bootstrap 5.3)
 *   4. style.colorScheme (native inputs, scrollbars, dialogs)
 * - Persists choice to localStorage['pulseplan_theme']
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('pulseplan_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {}
    return 'dark'; // Default to dark theme as required
  });

  const applyTheme = useCallback((targetTheme) => {
    const isDark = targetTheme === 'dark';
    const root = document.documentElement;

    // Toggle Tailwind class
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Set data attributes for Tailwind and Bootstrap 5
    root.setAttribute('data-theme', targetTheme);
    root.setAttribute('data-bs-theme', targetTheme);

    // Set native browser color-scheme for inputs and scrollbars
    root.style.colorScheme = targetTheme;

    // Persist to localStorage
    try {
      localStorage.setItem('pulseplan_theme', targetTheme);
    } catch (e) {}
  }, []);

  // Sync DOM on mount and state change
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  }, []);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
