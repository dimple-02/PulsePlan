import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DEFAULT_DEV_JWT_SECRET = 'pulseplan_jwt_secret_dev_key_2026';

/**
 * Validates required environment variables at startup.
 * Throws a fatal error if production security requirements are violated.
 */
export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];

  // 1. Validate MONGODB_URI
  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI is required. Please provide a valid MongoDB connection string.');
  }

  // 2. Validate JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (isProduction) {
    if (!jwtSecret) {
      errors.push('JWT_SECRET is required in production.');
    } else if (jwtSecret === DEFAULT_DEV_JWT_SECRET) {
      errors.push(
        'SECURITY CRITICAL: Default development JWT secret cannot be used in production. Set a cryptographically strong JWT_SECRET.'
      );
    } else if (jwtSecret.length < 32) {
      errors.push(
        `JWT_SECRET must be at least 32 characters long in production (current length: ${jwtSecret.length}).`
      );
    }
  } else {
    if (!jwtSecret) {
      console.warn(
        '[Security Notice] No JWT_SECRET specified in development; using development fallback key.'
      );
    }
  }

  // 3. Validate PORT
  const port = Number(process.env.PORT || 5000);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`Invalid PORT configuration: '${process.env.PORT}'. Must be a number between 1 and 65535.`);
  }

  // 4. Validate CLIENT_URL in production
  if (isProduction && !process.env.CLIENT_URL) {
    errors.push('CLIENT_URL is required in production for strict CORS origin enforcement.');
  }

  if (errors.length > 0) {
    const message = `[FATAL - Environment Validation Failed]:\n - ${errors.join('\n - ')}`;
    console.error(message);
    throw new Error(message);
  }
}

export const ENV = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulseplan_db',
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ].filter(Boolean),
};
