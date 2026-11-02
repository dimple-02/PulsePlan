import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Otp } from '../models/Otp.js';
import { ENV } from '../config/env.js';
import { sendWelcomeEmail, sendOtpEmail } from '../services/emailService.js';
import { generateOtp, verifyOtp } from '../services/otpService.js';

const JWT_EXPIRES_IN = '7d';

/**
 * Cookie configuration helper
 * Uses secure flags in production; 'lax' sameSite in local development to allow cross-port cookies.
 */
export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production' || ENV.IS_PRODUCTION;
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };
}

export function getClearCookieOptions() {
  const { maxAge, ...clearOptions } = getCookieOptions();
  return clearOptions;
}

/**
 * Generate JSON Web Token
 * Explicitly includes tokenVersion and HS256 algorithm
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    },
    ENV.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
  );
}

/**
 * POST /api/auth/signup
 * Register a new user account, create their private personal workspace,
 * set the session cookie, and return sanitized user data.
 */
export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        });
      }
      return res.status(409).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message:
          'An unverified account with this email already exists. Please enter the verification code sent to your email or request a new code.',
        data: {
          email: normalizedEmail,
          requiresVerification: true,
        },
      });
    }

    // 2. Generate avatar initials
    const initials =
      name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    // 3. Create the user entity (isEmailVerified: false by default)
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      avatar: initials,
      isEmailVerified: false,
    });

    // 4. Create an isolated private initial workspace for the new user
    // Requirement 10: Ensures new users do NOT access Acme, Nexus, or Studio Zero
    const firstName = name.trim().split(' ')[0];
    const baseSlug = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}-workspace`;
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const personalWorkspace = await Workspace.create({
      name: `${firstName}'s Workspace`,
      slug: uniqueSlug,
      plan: 'Starter',
      color: '#4f46e5',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: `Private default workspace for ${name}.`,
      currentUserRole: 'Owner',
      membersCount: 1,
      members: [
        {
          name: user.name,
          email: user.email,
          role: 'Owner',
          avatar: initials,
          status: 'Active',
          userId: user._id,
        },
      ],
      activities: [
        {
          user: user.name,
          action: 'created workspace',
          target: `${firstName}'s Workspace`,
          timestamp: 'Just now',
          createdAt: new Date(),
        },
      ],
    });

    // Link personal workspace to the user
    user.workspaces = [
      {
        workspaceId: personalWorkspace._id,
        role: 'Owner',
      },
    ];
    user.activeWorkspaceId = personalWorkspace._id;
    await user.save();

    // 5. Generate 6-Digit Email Verification OTP (Expires in 5m, 60s cooldown)
    const otpData = await generateOtp(normalizedEmail, 'email_verification');

    // 6. Send Email Verification OTP
    sendOtpEmail({
      to: user.email,
      recipientName: user.name,
      otp: otpData.rawOtp,
      purpose: 'Email Verification',
      expiryMinutes: otpData.expiryMinutes,
    }).catch((err) => {
      console.error('[MailService Error]: Failed to dispatch email verification OTP:', err.message);
    });

    const userJson = user.toJSON();

    res.status(201).json({
      success: true,
      message:
        'Account created successfully. A 6-digit verification code has been sent to your email. Please verify your email to activate your account.',
      data: {
        user: userJson,
        requiresVerification: true,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-email
 * Verifies the 6-digit OTP code sent during signup.
 * Upon successful verification, marks account as isEmailVerified: true,
 * issues session JWT, sets HTTP-only cookie, and dispatches welcome email.
 */
export async function verifyEmail(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email address and 6-digit verification code are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const verification = await verifyOtp(normalizedEmail, otp, 'email_verification');
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        code: verification.code,
        message: verification.message,
        attemptsRemaining: verification.attemptsRemaining,
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    user.isEmailVerified = true;
    await user.save();

    // Clean up any remaining OTPs
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'email_verification' });

    // Issue session token and HTTP-only cookie now that email is verified
    const token = generateToken(user);
    res.cookie('token', token, getCookieOptions());

    const userJson = user.toJSON();

    // Dispatch welcome email in background
    sendWelcomeEmail({
      to: user.email,
      recipientName: user.name,
      loginUrl: `${ENV.CLIENT_URL}/login`,
    }).catch((err) => {
      console.error('[MailService Error]: Failed to dispatch welcome email:', err.message);
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to PulsePlan.',
      data: {
        user: userJson,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/resend-verification
 * Resends a 6-digit verification code with 60-second cooldown enforcement.
 */
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check user existence
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Generic message to avoid email enumeration
      return res.status(200).json({
        success: true,
        message:
          'If an unverified account is associated with this email, a new verification code has been sent.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'This email address is already verified. Please sign in.',
      });
    }

    try {
      const otpData = await generateOtp(normalizedEmail, 'email_verification');
      await sendOtpEmail({
        to: user.email,
        recipientName: user.name,
        otp: otpData.rawOtp,
        purpose: 'Email Verification',
        expiryMinutes: otpData.expiryMinutes,
      });

      return res.status(200).json({
        success: true,
        message: 'A new 6-digit verification code has been sent to your email.',
      });
    } catch (err) {
      if (err.code === 'COOLDOWN_ACTIVE') {
        return res.status(429).json({
          success: false,
          code: 'COOLDOWN_ACTIVE',
          message: err.message,
          remainingSeconds: err.remainingSeconds,
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate credentials, set HTTP-only session cookie, and return user.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Query user and explicitly select password field (select: false in schema)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Enforce email verification before allowing login (Requirement 4)
    if (user.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true,
        message:
          'Your email address has not been verified yet. Please enter the verification code sent to your email.',
        data: {
          email: user.email,
          requiresVerification: true,
        },
      });
    }

    // Issue token and set session cookie
    const token = generateToken(user);
    res.cookie('token', token, getCookieOptions());

    const userJson = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: userJson,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Clears the HTTP-only session cookie and increments tokenVersion to invalidate unexpired JWTs.
 */
export async function logout(req, res, next) {
  try {
    if (req.user) {
      // Server-side invalidation: increment tokenVersion so prior JWTs are immediately rejected
      await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    }

    res.clearCookie('token', getClearCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Restores the current user's session from the verified token cookie.
 */
export async function getMe(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    // Populate active workspace or workspace count if helpful
    const userJson = req.user.toJSON();

    res.status(200).json({
      success: true,
      data: {
        user: userJson,
      },
    });
  } catch (error) {
    next(error);
  }
}
