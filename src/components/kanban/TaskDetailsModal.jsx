import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import Select from '../common/Select';
import { useWorkspace } from '../../hooks/useWorkspace';
import { Trash2, Calendar, Tag, CheckCircle2, UserCheck } from 'lucide-react';

/**
 * TaskDetailsModal Component
 * 
 * Inspects or modifies an individual task's status, priority, or details.
 */
export default function TaskDetailsModal({ isOpen, onClose, task }) {
  const { updateTask, updateTaskStatus, deleteTask } = useWorkspace();

  const [currentStatus, setCurrentStatus] = useState(task?.status || 'todo');
  const [currentPriority, setCurrentPriority] = useState(task?.priority || 'medium');

  useEffect(() => {
    if (task) {
      setCurrentStatus(task.status);
      setCurrentPriority(task.priority);
    }
  }, [task]);

  if (!task) return null;

  const taskId = task._id || task.id;

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus);
    await updateTaskStatus(taskId, newStatus);
  };

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    setCurrentPriority(newPriority);
    await updateTask(taskId, { priority: newPriority });
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      await deleteTask(taskId);
      onClose();
    }
  };

  const priorityBadges = {
    low: { variant: 'neutral', label: 'Low Priority' },
    medium: { variant: 'info', label: 'Medium Priority' },
    high: { variant: 'warning', label: 'High Priority' },
    urgent: { variant: 'danger', label: 'Urgent' },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      description={`Task ID: ${task.id} • Created in active workspace`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            icon={Trash2}
          >
            Delete
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Quick Status and Priority controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A6A1B5] mb-1 block">
              Kanban Column Status
            </span>
            <select
              value={currentStatus}
              onChange={handleStatusChange}
              className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#100E17] text-slate-800 dark:text-[#F8F6EF] focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20"
            >
              <option value="backlog" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">Backlog</option>
              <option value="todo" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">To Do</option>
              <option value="in_progress" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">In Progress</option>
              <option value="review" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">In Review</option>
              <option value="done" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">Done</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A6A1B5] mb-1 block">
              Priority
            </span>
            <select
              value={currentPriority}
              onChange={handlePriorityChange}
              className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#100E17] text-slate-800 dark:text-[#F8F6EF] focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20"
            >
              <option value="low" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">Low Priority</option>
              <option value="medium" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">Medium Priority</option>
              <option value="high" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">High Priority</option>
              <option value="urgent" className="bg-white dark:bg-[#1A1726] text-slate-900 dark:text-[#F8F6EF]">Urgent</option>
            </select>
          </div>
        </div>

        {/* Task Meta details */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 dark:text-[#A6A1B5] block mb-1">Assignee</span>
            <div className="flex items-center gap-2">
              <Avatar
                name={task.assignee?.name || 'Unassigned'}
                initials={task.assignee?.avatar}
                size="sm"
              />
              <span className="font-medium text-slate-800 dark:text-[#F8F6EF]">
                {task.assignee?.name || 'Unassigned'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 dark:text-[#A6A1B5] block mb-1">Due Date</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-[#F8F6EF]">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-[#A6A1B5]" />
              <span>{task.dueDate || 'No due date'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 dark:text-[#A6A1B5] block mb-1">Story Points</span>
            <span className="inline-block px-2 py-0.5 font-semibold text-xs rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-[#F8F6EF]">
              {task.storyPoints || 3} pts
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-[#A6A1B5] block mb-1">Tags</span>
            <div className="flex flex-wrap gap-1">
              {(task.tags || []).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-700 dark:text-[#C9B8FF] border border-indigo-100 dark:border-[#C9B8FF]/30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] uppercase tracking-wider block mb-1.5">
            Description
          </span>
          <div className="p-3 bg-white dark:bg-[#100E17] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-600 dark:text-[#A6A1B5] leading-relaxed min-h-[80px]">
            {task.description || 'No description provided for this task.'}
          </div>
        </div>
      </div>
    </Modal>
  );
}
