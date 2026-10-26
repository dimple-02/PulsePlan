/**
 * JavaScript Fundamentals & Promise Demonstration Utility
 * 
 * Demonstrates:
 * 1. JavaScript Fundamentals: ES6 Classes/Functions, arrow functions, template literals, destructuring
 * 2. Creating Custom Promises with `new Promise((resolve, reject) => ...)`
 * 3. Asynchronous execution with Promises and async/await
 * 4. Structured Error Handling with try/catch and reject()
 * 5. Concurrent execution using Promise.all / Promise.race
 * 
 * Perfect reference for College Viva presentation on JS Async & Promises.
 */

/**
 * Creates an explicit Promise that resolves after a specified delay.
 * Demonstrates the Promise constructor pattern: `new Promise((resolve, reject) => ...)`
 * 
 * @param {number} ms - Milliseconds to delay
 * @param {any} value - Optional value to resolve with
 * @returns {Promise<any>}
 */
export function delay(ms = 300, value = null) {
  return new Promise((resolve, reject) => {
    if (typeof ms !== 'number' || ms < 0) {
      reject(new TypeError(`Delay must be a non-negative number. Received: ${ms}`));
      return;
    }
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
}

/**
 * Executes an async operation with a maximum timeout.
 * Demonstrates Promise.race between the target promise and a rejection timeout.
 * 
 * @param {Promise} promise - The promise to await
 * @param {number} timeoutMs - Timeout limit in milliseconds
 * @param {string} errorMessage - Message upon timeout rejection
 * @returns {Promise<any>}
 */
export async function withTimeout(promise, timeoutMs = 5000, errorMessage = 'Operation timed out') {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Measures the execution time and resolution status of an async Promise function.
 * Demonstrates try/catch error handling, timestamps, and return payload formatting.
 * 
 * @param {Function} asyncFn - Async function returning a Promise
 * @returns {Promise<{ success: boolean, durationMs: number, result?: any, error?: string }>}
 */
export async function measureAsyncExecution(asyncFn) {
  const startTime = performance.now();
  try {
    const result = await asyncFn();
    const durationMs = Math.round(performance.now() - startTime);
    return {
      success: true,
      durationMs,
      result,
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      durationMs,
      error: error.message || 'Unknown asynchronous error',
    };
  }
}
