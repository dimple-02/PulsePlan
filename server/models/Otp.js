import mongoose from 'mongoose';

/**
 * OTP (One-Time Password) Schema
 *
 * Implements secure storage for email verification and password reset OTPs:
 * - Stores ONLY a cryptographic hash of the 6-digit code (never plaintext)
 * - 5-minute strict expiration with automatic MongoDB TTL index
 * - Max 5 attempts tracking
 * - 60-second resend cooldown tracking
 */
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required for OTP tracking'],
      lowercase: true,
      trim: true,
      index: true,
    },
    hashedOtp: {
      type: String,
      required: [true, 'Hashed OTP is required'],
    },
    purpose: {
      type: String,
      enum: ['password_reset', 'email_verification'],
      default: 'password_reset',
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index: Automatically removes documents when expiresAt is reached
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for querying active OTP by email and purpose
otpSchema.index({ email: 1, purpose: 1 });

export const Otp = mongoose.model('Otp', otpSchema);
