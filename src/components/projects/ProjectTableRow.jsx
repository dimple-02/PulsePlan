import React, { useState } from 'react';
import Badge from '../common/Badge';
import { AvatarGroup } from '../common/Avatar';
import Button from '../common/Button';
import { Kanban, Trash2, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../hooks/useWorkspace';
import ProjectMembersModal from './ProjectMembersModal';

/**
 * ProjectTableRow Component
 * 
 * Table row representation for project list view.
 */
export default function ProjectTableRow({ project, onSelect, onDelete }) {
  const navigate = useNavigate();
  const { setActiveProjectId } = useWorkspace();
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const statusMap = {
    'In Progress': 'primary',
    'Planning': 'warning',
    'Completed': 'success',
    'Under Review': 'info',
  };

  const priorityMap = {
    Low: 'neutral',
    Medium: 'info',
    High: 'warning',
    Urgent: 'danger',
  };

  const handleOpenBoard = (e) => {
    e.stopPropagation();
    setActiveProjectId(project._id || project.id);
    navigate('/kanban');
  };

  return (
    <tr
      onClick={() => onSelect(project)}
      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-100 dark:border-white/10"
    >
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-[#C9B8FF] bg-indigo-50 dark:bg-[#C9B8FF]/15 border border-indigo-100 dark:border-[#C9B8FF]/30 px-1.5 py-0.5 rounded uppercase">
            {project.key}
          </span>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#F8F6EF] block truncate">
              {project.name}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-[#A6A1B5] block truncate">
              {project.category} • Lead: {project.lead}
            </span>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4 hidden md:table-cell">
        <Badge variant={statusMap[project.status] || 'neutral'} size="sm" dot>
          {project.status}
        </Badge>
      </td>

      <td className="py-3.5 px-4 hidden lg:table-cell">
        <Badge variant={priorityMap[project.priority] || 'neutral'} size="sm">
          {project.priority}
        </Badge>
      </td>

      <td className="py-3.5 px-4 w-36">
        <div className="flex items-center gap-2">
          <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-[#C9B8FF] h-full rounded-full"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-[#A6A1B5]">
            {project.progress}%
          </span>
        </div>
      </td>

      <td className="py-3.5 px-4 hidden sm:table-cell text-xs text-slate-600 dark:text-[#A6A1B5]">
        {project.deadline}
      </td>

      <td className="py-3.5 px-4 hidden xl:table-cell text-xs font-medium text-slate-700 dark:text-[#F8F6EF]">
        {project.budget}
      </td>

      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMembersModalOpen(true)}
            icon={Users}
            title="Collaborators & Invitations"
          >
            Members
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenBoard}
            icon={Kanban}
          >
            Board
          </Button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(project._id || project.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Project Collaborators & Invitations Modal */}
        <ProjectMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          project={project}
        />
      </td>
    </tr>
  );
}
