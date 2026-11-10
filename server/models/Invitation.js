import mongoose from 'mongoose';

/**
 * Invitation Schema
 *
 * Tracks project collaborator invitations across tenant organizations:
 * - Stores SHA-256 token hash (never raw invitation secret)
 * - Strict tenant isolation linking to project and workspace
 * - Lifecycle status tracking: 'pending' | 'accepted' | 'rejected' | 'expired' | 'revoked'
 */
const invitationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['project', 'workspace'],
      default: 'project',
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Invited email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Target workspace ID is required'],
      index: true,
    },
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviter user ID is required'],
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Member', 'Viewer'],
      default: 'Member',
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'claimed', 'accepted', 'rejected', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    claimedAt: {
      type: Date,
    },
    claimId: {
      type: String,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.tokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for fast lookups and duplicate prevention
invitationSchema.index({ projectId: 1, email: 1, status: 1 });
invitationSchema.index({ workspaceId: 1, email: 1, status: 1 });
invitationSchema.index({ workspaceId: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });

export const Invitation = mongoose.model('Invitation', invitationSchema);
