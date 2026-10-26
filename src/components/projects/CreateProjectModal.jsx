import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useWorkspace } from '../../hooks/useWorkspace';
import { FolderPlus } from 'lucide-react';

/**
 * CreateProjectModal Component
 * 
 * Demonstrates:
 * - Controlled form inputs in React
 * - Form validation (checking required project name)
 * - Async dispatch to WorkspaceContext
 */
export default function CreateProjectModal({ isOpen, onClose }) {
  const { addProject, activeWorkspace } = useWorkspace();

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    category: 'Product',
    priority: 'Medium',
    status: 'In Progress',
    budget: '',
    deadline: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple frontend validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await addProject(formData);
      // Reset form
      setFormData({
        name: '',
        key: '',
        category: 'Product',
        priority: 'Medium',
        status: 'In Progress',
        budget: '',
        deadline: '',
        description: '',
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description={`Add a new initiative to workspace: ${activeWorkspace?.name || 'Active Workspace'}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            icon={FolderPlus}
          >
            Create Project
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Project Name"
              name="name"
              placeholder="e.g. Distributed Caching Layer"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
          </div>
          <div>
            <Input
              label="Key"
              name="key"
              placeholder="e.g. CACHE"
              value={formData.key}
              onChange={handleChange}
              helperText="Prefix for task keys"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={[
              'Product',
              'DevOps',
              'Security',
              'Data Platform',
              'Payments',
              'Compliance',
              'Mobile Design',
              'Branding',
            ]}
          />
          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={['Low', 'Medium', 'High', 'Urgent']}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Budget"
            name="budget"
            placeholder="$25,000"
            value={formData.budget}
            onChange={handleChange}
          />
          <Input
            label="Target Deadline"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Project Description
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the scope, objectives, and deliverables of this project..."
            className="w-full rounded-lg text-sm border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
          />
        </div>
      </form>
    </Modal>
  );
}
