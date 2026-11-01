import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../common/Card';
import Badge from '../common/Badge';
import { ArrowUpRight, Folder, FolderPlus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../hooks/useWorkspace';

/**
 * ProjectProgressList Component
 * 
 * Displays list of projects within the active workspace and their % completion.
 */
export default function ProjectProgressList({ projects = [] }) {
  const navigate = useNavigate();
  const { selectProject, activeProjectId } = useWorkspace();

  const statusColorMap = {
    'In Progress': 'primary',
    'Planning': 'warning',
    'Completed': 'success',
    'Under Review': 'info',
  };

  const handleProjectClick = (project) => {
    const projId = project._id || project.id;
    if (selectProject) {
      selectProject(projId);
    }
    navigate('/kanban');
  };

  return (
    <Card>
      <CardHeader
        action={
          <Link
            to="/projects"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-[#C9B8FF] dark:hover:text-[#FFD6E8] flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <CardTitle>Active Projects</CardTitle>
        <CardDescription>Initiatives in this tenant workspace</CardDescription>
      </CardHeader>

      <CardBody className="divide-y divide-slate-100 dark:divide-white/5 p-0">
        {projects.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-[#A6A1B5] flex items-center justify-center mb-2.5">
              <FolderPlus className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-[#F8F6EF]">No projects created yet</p>
            <p className="text-[11px] text-slate-400 dark:text-[#A6A1B5]/70 mt-0.5 max-w-xs">
              This tenant workspace has no projects. Use "+ Project" in the navigation bar to add one.
            </p>
            <Link
              to="/projects"
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-[#C9B8FF] dark:hover:text-[#FFD6E8] flex items-center gap-1"
            >
              <span>Go to Projects</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          projects.slice(0, 4).map((project) => {
            const isSelected = String(project._id || project.id) === String(activeProjectId);
            return (
              <div
                key={project._id || project.id}
                onClick={() => handleProjectClick(project)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleProjectClick(project);
                  }
                }}
                className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group ${
                  isSelected
                    ? 'bg-indigo-50/50 dark:bg-[#C9B8FF]/10 hover:bg-indigo-50/80 dark:hover:bg-[#C9B8FF]/15'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 dark:bg-[#C9B8FF] text-white dark:text-[#0B0A0F]'
                      : 'bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-600 dark:text-[#C9B8FF] group-hover:bg-indigo-100 dark:group-hover:bg-[#C9B8FF]/25'
                  }`}>
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#F8F6EF] truncate group-hover:text-indigo-600 dark:group-hover:text-[#C9B8FF] transition-colors">
                        {project.name}
                      </h4>
                      <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-[#A6A1B5] bg-slate-100 dark:bg-white/10 px-1 rounded">
                        {project.key}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-[#C9B8FF] bg-indigo-100/70 dark:bg-[#C9B8FF]/20 px-1.5 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#A6A1B5] truncate mt-0.5">
                      Lead: {project.lead} • Target: {project.deadline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:shrink-0 w-full sm:w-auto">
                  {/* Progress Bar */}
                  <div className="flex-1 sm:w-32">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-[#A6A1B5] mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
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

                  <Badge variant={statusColorMap[project.status] || 'neutral'} size="sm" dot>
                    {project.status}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
