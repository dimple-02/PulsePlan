/**
 * Client Storage & Mock Asynchronous Service Layer
 * 
 * College Viva Explanation:
 * -------------------------
 * This file demonstrates JavaScript Promises and async/await patterns.
 * In a real SaaS frontend, components do not manipulate backend databases directly.
 * Instead, they interact with an asynchronous Service Layer.
 * 
 * In this Phase 1 Frontend Foundation:
 * - We simulate network latency with Promise-based timeouts (150-300ms)
 * - Data is persisted in browser localStorage or falls back to INITIAL_WORKSPACES (empty projects)
 * - Ready for Phase 2: In Phase 2, each function below will be swapped to:
 *     const res = await fetch(`http://localhost:5000/api/v1/...`);
 *     return await res.json();
 */

import { INITIAL_WORKSPACES } from '../data/mockWorkspaces';

const STORAGE_KEY = 'pulseplan_saas_workspaces_v2_clean';

// Helper to simulate network latency using standard ES6 Promise
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch all available tenant workspaces
 * Returns a Promise that resolves to the array of workspaces
 */
export async function getWorkspaces() {
  await delay(150);
  try {
    // Clear legacy populated storage if present
    localStorage.removeItem('pulseplan_saas_workspaces_v1');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WORKSPACES));
      return INITIAL_WORKSPACES;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Could not read from localStorage, using in-memory seed:", error);
    return INITIAL_WORKSPACES;
  }
}

/**
 * Save updated workspaces array back to localStorage
 */
export async function saveWorkspaces(workspaces) {
  await delay(100);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
    return true;
  } catch (error) {
    console.error("Failed to save workspaces to storage:", error);
    return false;
  }
}

/**
 * Reset local storage back to pristine seed data (clean empty projects)
 */
export async function resetToDefaultSeed() {
  await delay(100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WORKSPACES));
  return INITIAL_WORKSPACES;
}
