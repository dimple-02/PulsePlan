import mongoose from 'mongoose';

/**
 * Message Schema
 * 
 * Supports:
 * 1. Direct 1-on-1 messages between workspace members
 * 2. Team-wide workspace chat channel
 * 
 * Strict Tenant Isolation:
 * All messages are indexed by and strictly scoped to workspaceId.
 */
const messageSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required for tenant isolation'],
      index: true,
    },
    sender: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      avatar: { type: String, default: 'U' },
    },
    recipient: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      email: { type: String, lowercase: true, trim: true },
      avatar: { type: String },
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ workspaceId: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
