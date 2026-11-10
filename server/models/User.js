import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema
 * 
 * Manages user authentication identities and their workspace memberships.
 * Passwords are automatically hashed with bcrypt before saving.
 */
const userWorkspaceSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Member'],
      default: 'Member',
    },
  },
  { _id: false }
);

/**
 * First-Time User Onboarding Schema
 * Captures user role, primary use-case goals, team size, and experience level.
 */
const onboardingSchema = new mongoose.Schema(
  {
    completed: {
      type: Boolean,
      default: false,
    },
    skipped: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['Student', 'Developer', 'Team Lead', 'Project Manager', 'Freelancer', 'Other', null],
      default: null,
    },
    goals: {
      type: [String],
      enum: [
        'Personal task management',
        'College projects',
        'Team collaboration',
        'Software development',
        'Business and project management',
      ],
      default: [],
    },
    teamSize: {
      type: String,
      enum: ['Just me', '2–5 people', '6–10 people', '11–25 people', '25+ people', null],
      default: null,
    },
    experience: {
      type: String,
      enum: ['Beginner', 'Some experience', 'Experienced', null],
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password by default in queries
    },
    avatar: {
      type: String,
      default: 'U',
    },
    workspaces: [userWorkspaceSchema],
    activeWorkspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    onboarding: {
      type: onboardingSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
