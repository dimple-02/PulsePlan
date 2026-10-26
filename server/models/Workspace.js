import mongoose from 'mongoose';

/**
 * Workspace (Tenant) Schema
 * 
 * In a multi-tenant SaaS architecture, each Workspace represents an isolated tenant organization.
 * All Projects and Tasks belong strictly to a single Workspace.
 */
const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: String, enum: ['Owner', 'Admin', 'Member'], default: 'Member' },
    avatar: { type: String, default: 'U' },
    status: { type: String, enum: ['Active', 'Offline'], default: 'Active' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const activitySchema = new mongoose.Schema(
  {
    user: { type: String, default: 'You' },
    action: { type: String, required: true },
    target: { type: String, required: true },
    destination: { type: String },
    timestamp: { type: String, default: 'Just now' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[a-z0-9-]+$/, 'Slug must be alphanumeric and dashes only'],
    },
    plan: {
      type: String,
      enum: ['Starter', 'Pro Team', 'Enterprise'],
      default: 'Starter',
    },
    color: {
      type: String,
      default: '#4f46e5',
    },
    badgeColor: {
      type: String,
      default: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    membersCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    currentUserRole: {
      type: String,
      default: 'Workspace Admin',
    },
    members: [memberSchema],
    activities: [activitySchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

export const Workspace = mongoose.model('Workspace', workspaceSchema);
