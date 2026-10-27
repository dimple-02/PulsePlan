import mongoose from 'mongoose';

/**
 * Task Schema
 * 
 * Each task belongs strictly to a Project and its parent Workspace.
 * Verification rule: task.projectId MUST belong to task.workspaceId.
 * Supports Cloudinary attachments with metadata (url, publicId, fileName, fileSize).
 */
const taskSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required for tenant isolation'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    assignee: {
      name: { type: String, default: 'Workspace Member' },
      avatar: { type: String, default: 'WM' },
    },
    dueDate: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    storyPoints: {
      type: Number,
      default: 3,
      min: [0, 'Story points cannot be negative'],
    },
    // Cloudinary File Attachments
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        fileName: { type: String, required: true },
        fileType: { type: String, default: 'application/octet-stream' },
        fileSize: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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

taskSchema.index({ workspaceId: 1, projectId: 1 });

export const Task = mongoose.model('Task', taskSchema);
