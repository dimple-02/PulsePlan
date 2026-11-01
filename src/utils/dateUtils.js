/**
 * Date and relative time utilities for PulsePlan SaaS.
 */

/**
 * Formats a Date, ISO string, or timestamp into human-friendly relative time.
 * 
 * Rules:
 * - Missing or invalid timestamps -> "Date unavailable"
 * - Less than a minute ago -> "Just now"
 * - 1 minute ago -> "1 minute ago"
 * - Several minutes ago -> "X minutes ago"
 * - 1 hour ago -> "1 hour ago"
 * - Several hours ago -> "X hours ago"
 * - 1 day ago -> "1 day ago"
 * - Several days ago -> "X days ago"
 * - 1 month ago -> "1 month ago"
 * - Several months ago -> "X months ago"
 * - 1 year ago -> "1 year ago"
 * - Several years ago -> "X years ago"
 * 
 * @param {string|Date|number} dateInput - The timestamp to format
 * @param {number|Date} [referenceTime=Date.now()] - Point of comparison (defaults to now)
 * @returns {string} Human-readable relative time string
 */
export function formatRelativeTime(dateInput, referenceTime = Date.now()) {
  if (!dateInput) {
    return 'Date unavailable';
  }

  const date = new Date(dateInput);
  const time = date.getTime();
  if (isNaN(time)) {
    return 'Date unavailable';
  }

  const now = typeof referenceTime === 'number' ? referenceTime : new Date(referenceTime).getTime();
  const diffMs = now - time;

  // Handle small clock drift / immediate client updates (up to 5s in future)
  if (diffMs < 0 && diffMs >= -5000) {
    return 'Just now';
  }
  if (diffMs < 0) {
    return 'Just now';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) {
    return 'Just now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
}

/**
 * Sorts an array of activities by actual creation time, newest first.
 * Safely handles missing, invalid, or null timestamps without crashing.
 * 
 * @param {Array} activities - List of activity items
 * @returns {Array} Sorted shallow copy of activities
 */
export function sortActivitiesNewestFirst(activities = []) {
  if (!Array.isArray(activities)) return [];

  return [...activities].sort((a, b) => {
    const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : NaN;
    const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : NaN;

    const validA = !isNaN(timeA);
    const validB = !isNaN(timeB);

    if (validA && validB) {
      return timeB - timeA;
    }
    if (validA) return -1;
    if (validB) return 1;
    return 0;
  });
}
