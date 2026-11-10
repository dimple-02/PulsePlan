/**
 * Email Normalization and Canonicalization Utilities
 *
 * Provides standard email comparison and canonicalization routines:
 * - RFC 5321 compliant case-insensitivity
 * - Gmail / Googlemail dot-insensitivity (Google MTA ignores all dots in local-part)
 * - Gmail / Googlemail subaddressing (+tag alias) resolution
 * - Equivalence between @gmail.com and @googlemail.com domains
 */

/**
 * Escapes regex special characters in a string
 */
export function escapeRegex(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Computes canonical representation of an email address
 *
 * For Gmail/Googlemail:
 * - Local-part is lowercased, dots are stripped, and plus aliases (+tag) removed
 * - Domain is normalized to 'gmail.com'
 *
 * For all other domains:
 * - Trimmed and lowercased standard representation
 */
export function canonicalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const cleanLocal = local.replace(/\./g, '').split('+')[0];
    return `${cleanLocal}@gmail.com`;
  }

  return `${local}@${domain}`;
}

/**
 * Determines whether two email addresses refer to the exact same recipient mailbox.
 * Supports Gmail dot-insensitivity and subaddressing aliases.
 */
export function areEmailsEqual(email1, email2) {
  if (!email1 || !email2 || typeof email1 !== 'string' || typeof email2 !== 'string') {
    return false;
  }
  const t1 = email1.trim().toLowerCase();
  const t2 = email2.trim().toLowerCase();
  if (t1 === t2) return true;
  return canonicalizeEmail(t1) === canonicalizeEmail(t2);
}

/**
 * Generates a MongoDB-compatible RegExp that matches any valid alias of an email,
 * including Gmail addresses with or without dots and subaddresses (+tag).
 */
export function getEmailRegex(email) {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) {
    return new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const bareLocal = local.replace(/\./g, '').split('+')[0];
    const charPatterns = bareLocal
      .split('')
      .map((c) => escapeRegex(c))
      .join('\\.?');
    return new RegExp(`^${charPatterns}(\\+[^@]*)?@(gmail|googlemail)\\.com$`, 'i');
  }

  return new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
}

/**
 * Standard configuration options for express-validator's normalizeEmail()
 * Ensures Gmail dots are NOT stripped from user input during signup/login.
 */
export const NORMALIZE_EMAIL_OPTS = {
  gmail_remove_dots: false,
  all_lowercase: true,
  gmail_remove_subaddress: false,
};
