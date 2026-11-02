import React, { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../common/Card';
import Badge from '../common/Badge';
import { AvatarGroup } from '../common/Avatar';
import Button from '../common/Button';
import { Calendar, DollarSign, Kanban, ArrowRight, Trash2, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../hooks/useWorkspace';
import ProjectMembersModal from './ProjectMembersModal';

/**
 * ProjectCard Component
 * 
 * Grid card representation of a single project within the tenant.
 */
export default function ProjectCard({ project, onSelect, onDelete }) {
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
    <Card hoverEffect className="flex flex-col h-full" onClick={() => onSelect(project)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between w-full gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-[#C9B8FF] bg-indigo-50 dark:bg-[#C9B8FF]/15 border border-indigo-100 dark:border-[#C9B8FF]/30 px-1.5 py-0.5 rounded uppercase">
              {project.key}
            </span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8F6EF] mt-1 truncate">
              {project.name}
            </h3>
          </div>
          <Badge variant={statusMap[project.status] || 'neutral'} size="sm" dot>
            {project.status}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="py-2 flex-1">
        <p className="text-xs text-slate-500 dark:text-[#A6A1B5] line-clamp-2 leading-relaxed mb-4">
          {project.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-[#A6A1B5] mb-1">
            <span>
              Completion{' '}
              {project.totalTasksCount > 0 ? (
                <span className="text-slate-400 dark:text-[#A6A1B5]/70 font-normal">
                  ({project.doneTasksCount}/{project.totalTasksCount} done)
                </span>
              ) : (
                <span className="text-slate-400 dark:text-[#A6A1B5]/70 font-normal">(0 tasks)</span>
              )}
            </span>
            <span className="font-semibold text-slate-700 dark:text-[#F8F6EF]">{project.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                project.progress === 100
                  ? 'bg-emerald-500'
                  : project.progress > 50
                  ? 'bg-indigo-600 dark:bg-[#C9B8FF]'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Meta details */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-[#A6A1B5] pt-2 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-[#A6A1B5] shrink-0" />
            <span className="truncate">{project.deadline}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate justify-end">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-[#A6A1B5] shrink-0" />
            <span className="font-medium text-slate-700 dark:text-[#F8F6EF]">{project.budget}</span>
          </div>
        </div>
      </CardBody>

      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMembersModalOpen(true);
            }}
            className="flex items-center gap-1.5 p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            title="Manage project collaborators & email invitations"
          >
            <AvatarGroup users={project.members || ['AM']} max={3} size="xs" />
            <span className="p-1 rounded-md bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-600 dark:text-[#C9B8FF] opacity-80 group-hover:opacity-100 transition-opacity">
              <UserPlus className="w-3 h-3" />
            </span>
          </button>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsMembersModalOpen(true);
              }}
              icon={Users}
              className="text-xs"
            >
              Members
            </Button>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project._id || project.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenBoard}
              icon={Kanban}
            >
              Board
            </Button>
          </div>
        </div>
      </CardFooter>

      {/* Project Collaborators & Invitations Modal */}
      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        project={project}
      />
    </Card>
  );
}
