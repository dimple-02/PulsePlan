import crypto from 'node:crypto';
import { Otp } from '../models/Otp.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { ENV } from '../config/env.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Computes a HMAC-SHA256 hash of an OTP using the configured OTP salt
 */
export function hashOtp(otp) {
  return crypto
    .createHmac('sha256', ENV.OTP_SALT)
    .update(String(otp).trim())
    .digest('hex');
}

/**
 * Computes a SHA-256 hash of a reset or invitation token
 */
export function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(String(token).trim())
    .digest('hex');
}

/**
 * Generate a cryptographically secure 6-digit OTP
 *
 * Enforces:
 * - 60-second resend cooldown
 * - Invalidation of any prior active OTPs for this email and purpose
 * - 5-minute strict expiration
 * - Hashed storage in MongoDB
 */
export async function generateOtp(email, purpose = 'password_reset') {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check for active resend cooldown
  const latestOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (latestOtp && latestOtp.lastSentAt) {
    const elapsedMs = Date.now() - new Date(latestOtp.lastSentAt).getTime();
    if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000);
      const error = new Error(
        `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before requesting a new verification code.`
      );
      error.code = 'COOLDOWN_ACTIVE';
      error.remainingSeconds = remainingSeconds;
      throw error;
    }
  }

  // 2. Invalidate previous active OTPs for this email & purpose
  await Otp.deleteMany({ email: normalizedEmail, purpose });

  // 3. Generate a uniform 6-digit random number (100000 - 999999)
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // 4. Persist hashed OTP document
  await Otp.create({
    email: normalizedEmail,
    hashedOtp,
    purpose,
    attempts: 0,
    maxAttempts: MAX_OTP_ATTEMPTS,
    expiresAt,
    lastSentAt: new Date(),
    isUsed: false,
  });

  // Return raw OTP and expiration strictly for email transmission
  return {
    rawOtp,
    expiresAt,
    expiryMinutes: 5,
  };
}

/**
 * Verifies an OTP entered by the user
 *
 * Enforces:
 * - Expiration check (5 minutes)
 * - Attempt counting (Max 5 attempts)
 * - Timing-safe constant-time comparison
 * - Single-use consumption (immediate invalidation on success)
 */
export async function verifyOtp(email, candidateOtp, purpose = 'password_reset') {
  const normalizedEmail = email.toLowerCase().trim();

  if (!candidateOtp || String(candidateOtp).trim().length !== 6) {
    return {
      valid: false,
      code: 'INVALID_FORMAT',
      message: 'Verification code must be a 6-digit number.',
    };
  }

  const otpDoc = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return {
      valid: false,
      code: 'NOT_FOUND_OR_EXPIRED',
      message: 'No active verification code found for this email. Please request a new code.',
    };
  }

  // Check expiration
  if (new Date() > new Date(otpDoc.expiresAt)) {
    await Otp.deleteOne({ _id: otpDoc._id });
    return {
      valid: false,
      code: 'EXPIRED',
      message: 'Verification code has expired. Please request a new code.',
    };
  }

  // Check attempt limit
  if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
    await Otp.deleteOne({ _id: otpDoc._id });
    return {
      valid: false,
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Maximum verification attempts exceeded (5/5). Please request a new code.',
    };
  }

  // Timing-safe comparison of the hash
  const candidateHash = hashOtp(candidateOtp);
  const candidateBuf = Buffer.from(candidateHash, 'hex');
  const storedBuf = Buffer.from(otpDoc.hashedOtp, 'hex');

  const isMatch =
    candidateBuf.length === storedBuf.length &&
    crypto.timingSafeEqual(candidateBuf, storedBuf);

  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();

    const attemptsRemaining = MAX_OTP_ATTEMPTS - otpDoc.attempts;
    if (attemptsRemaining <= 0) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return {
        valid: false,
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    return {
      valid: false,
      code: 'INVALID_OTP',
      message: `Invalid verification code. You have ${attemptsRemaining} attempt${
        attemptsRemaining === 1 ? '' : 's'
      } remaining.`,
      attemptsRemaining,
    };
  }

  // OTP is valid - consume and invalidate to prevent reuse
  await Otp.deleteOne({ _id: otpDoc._id });

  return { valid: true };
}

/**
 * Creates a cryptographically random, short-lived Password Reset Token
 */
export async function createResetToken(email) {
  const normalizedEmail = email.toLowerCase().trim();

  // Invalidate any existing reset tokens
  await PasswordResetToken.deleteMany({ email: normalizedEmail });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await PasswordResetToken.create({
    email: normalizedEmail,
    tokenHash,
    expiresAt,
    isUsed: false,
  });

  return rawToken;
}

/**
 * Validates a Password Reset Token
 */
export async function verifyResetToken(email, rawToken) {
  if (!rawToken) return false;
  const normalizedEmail = email.toLowerCase().trim();
  const tokenHash = hashToken(rawToken);

  const tokenDoc = await PasswordResetToken.findOne({
    email: normalizedEmail,
    tokenHash,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  return Boolean(tokenDoc);
}

/**
 * Consumes and permanently invalidates a Password Reset Token
 */
export async function consumeResetToken(email, rawToken) {
  if (!rawToken) return;
  const normalizedEmail = email.toLowerCase().trim();
  const tokenHash = hashToken(rawToken);

  await PasswordResetToken.deleteMany({ email: normalizedEmail, tokenHash });
}
