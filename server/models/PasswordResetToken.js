import mongoose from 'mongoose';

/**
 * PasswordResetToken Schema
 *
 * Secure short-lived token issued only after successful OTP verification:
 * - Allows setting the new password within 10 minutes
 * - Single-use consumption
 * - Stores ONLY a cryptographic SHA-256 hash
 */
const passwordResetTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
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

// TTL Index: Automatically purged after expiration
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
