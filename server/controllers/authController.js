import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { ENV } from '../config/env.js';

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
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
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

    // 3. Create the user entity (password will be hashed in User pre-save hook)
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      avatar: initials,
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

    // 5. Generate token and set HTTP-only cookie
    const token = generateToken(user);
    res.cookie('token', token, getCookieOptions());

    const userJson = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
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

    res.clearCookie('token', {
      ...getCookieOptions(),
      maxAge: 0,
    });

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
