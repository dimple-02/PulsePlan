import React from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../common/Card';
import Badge from '../common/Badge';
import { AvatarGroup } from '../common/Avatar';
import Button from '../common/Button';
import { Calendar, DollarSign, Kanban, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../hooks/useWorkspace';

/**
 * ProjectCard Component
 * 
 * Grid card representation of a single project within the tenant.
 */
export default function ProjectCard({ project, onSelect, onDelete }) {
  const navigate = useNavigate();
  const { setActiveProjectId } = useWorkspace();

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
    setActiveProjectId(project.id);
    navigate('/kanban');
  };

  return (
    <Card hoverEffect className="flex flex-col h-full" onClick={() => onSelect(project)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between w-full gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">
              {project.key}
            </span>
            <h3 className="text-sm font-semibold text-slate-900 mt-1 truncate">
              {project.name}
            </h3>
          </div>
          <Badge variant={statusMap[project.status] || 'neutral'} size="sm" dot>
            {project.status}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="py-2 flex-1">
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {project.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
            <span>Completion</span>
            <span className="font-semibold text-slate-700">{project.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                project.progress === 100
                  ? 'bg-emerald-500'
                  : project.progress > 50
                  ? 'bg-indigo-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Meta details */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{project.deadline}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate justify-end">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-700">{project.budget}</span>
          </div>
        </div>
      </CardBody>

      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full">
          <AvatarGroup users={project.members || ['AM']} max={3} size="xs" />

          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
    </Card>
  );
}
