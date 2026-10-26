import mongoose from 'mongoose';

/**
 * Project Schema
 * 
 * Each project belongs strictly to a single Workspace (tenant isolation).
 * The project key is unique within the workspace scope.
 */
const projectSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required for tenant isolation'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot exceed 120 characters'],
    },
    key: {
      type: String,
      required: [true, 'Project key identifier is required'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'Project key cannot exceed 10 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Under Review', 'Completed'],
      default: 'Planning',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    budget: {
      type: String,
      default: '$0',
    },
    spent: {
      type: String,
      default: '$0',
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    deadline: {
      type: String,
      default: '',
    },
    lead: {
      type: String,
      default: 'Workspace Member',
    },
    members: {
      type: [String],
      default: ['WM'],
    },
    category: {
      type: String,
      enum: [
        'Product',
        'DevOps',
        'Security',
        'Data Platform',
        'Payments',
        'Compliance',
        'Mobile Design',
        'Branding',
        'General',
      ],
      default: 'General',
    },
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

// Compound index: project key is unique within a single tenant workspace
projectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });

export const Project = mongoose.model('Project', projectSchema);
