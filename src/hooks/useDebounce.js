import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Delays updating the debounced value until after `delay` milliseconds
 * have elapsed since the last time the value changed.
 * 
 * Great for search bars and filter inputs to avoid filtering on every single keystroke.
 * 
 * @param {any} value - The input value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} debouncedValue
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update debouncedValue after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel the timer if value changes (or component unmounts) before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
