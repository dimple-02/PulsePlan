import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, AlertCircle, Folder } from 'lucide-react';

/**
 * CreateTaskModal Component
 * 
 * Allows creating a task mapped directly to the active project
 * within the active tenant workspace.
 */
export default function CreateTaskModal({ isOpen, onClose, initialStatus = 'todo' }) {
  const { addTask, activeProject, activeWorkspace, activeProjectId, setActiveProjectId } = useWorkspace();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: initialStatus,
    priority: 'medium',
    assigneeName: activeWorkspace?.members?.[0]?.name || user?.name || '',
    dueDate: '',
    tagsString: '',
    storyPoints: '3',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      status: initialStatus,
      assigneeName: activeWorkspace?.members?.[0]?.name || user?.name || '',
    }));
  }, [initialStatus, activeWorkspace, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!activeProject) {
      setErrors({ title: 'Please create a project first before adding tasks.' });
      return;
    }

    if (!formData.title.trim()) {
      setErrors({ title: 'Task title is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const foundMember = activeWorkspace?.members?.find(
        (m) => m.name === formData.assigneeName
      );
      const assigneeObj = {
        name: formData.assigneeName,
        avatar: foundMember?.avatar || formData.assigneeName.slice(0, 2).toUpperCase(),
      };

      const parsedTags = formData.tagsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await addTask({
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assignee: assigneeObj,
        dueDate: formData.dueDate,
        tags: parsedTags.length > 0 ? parsedTags : ['General'],
        storyPoints: formData.storyPoints,
      });

      // Reset
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigneeName: activeWorkspace?.members?.[0]?.name || user?.name || '',
        dueDate: '',
        tagsString: '',
        storyPoints: '3',
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const memberOptions = (activeWorkspace?.members || []).map((m) => ({
    value: m.name,
    label: `${m.name} (${m.role})`,
  }));

  const hasProjects = activeWorkspace?.projects && activeWorkspace.projects.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description={
        hasProjects
          ? `Add task to project: ${activeProject?.name || 'Selected Project'}`
          : 'Workspace currently has no projects'
      }
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
            disabled={!hasProjects}
            icon={CheckSquare}
          >
            Create Task
          </Button>
        </>
      }
    >
      {!hasProjects ? (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">No project available</p>
            <p className="mt-0.5 text-amber-700">
              Tasks belong to projects. Please close this and create a project first using the "+ Project" button.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeWorkspace.projects.length > 1 && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Target Project
              </label>
              <select
                value={activeProjectId || activeProject?._id || activeProject?.id}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="w-full text-xs font-semibold py-1.5 px-2 rounded border border-slate-300 bg-white"
              >
                {activeWorkspace.projects.map((p) => {
                  const projId = p._id || p.id;
                  return (
                    <option key={projId} value={projId}>
                      {p.name} ({p.key})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <Input
            label="Task Title"
            name="title"
            placeholder="e.g. Implement authentication middleware"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Initial Column Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'backlog', label: 'Backlog' },
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'review', label: 'In Review' },
                { value: 'done', label: 'Done' },
              ]}
            />
            <Select
              label="Priority Level"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assignee"
              name="assigneeName"
              value={formData.assigneeName}
              onChange={handleChange}
              options={
                memberOptions.length > 0
                  ? memberOptions
                  : [{ value: user?.name || 'Workspace Member', label: `${user?.name || 'Workspace Member'} (Owner)` }]
              }
            />
            <Input
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tags (comma separated)"
              name="tagsString"
              placeholder="Backend, API, Urgent"
              value={formData.tagsString}
              onChange={handleChange}
            />
            <Select
              label="Story Points (Effort)"
              name="storyPoints"
              value={formData.storyPoints}
              onChange={handleChange}
              options={['1', '2', '3', '5', '8', '13']}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Description
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide acceptance criteria, notes, or implementation details..."
              className="w-full rounded-lg text-sm border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
            />
          </div>
        </form>
      )}
    </Modal>
  );
}
