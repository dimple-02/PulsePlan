/**
 * Email Normalization and Canonicalization Utilities (Client-Side)
 *
 * Provides standard email comparison and canonicalization routines:
 * - Case-insensitivity
 * - Gmail / Googlemail dot-insensitivity
 * - Gmail / Googlemail subaddressing (+tag alias) resolution
 * - Equivalence between @gmail.com and @googlemail.com
 */

/**
 * Computes canonical representation of an email address
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
 * Checks whether two email addresses represent the same mailbox.
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
