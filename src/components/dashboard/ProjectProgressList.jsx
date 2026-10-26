import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../common/Card';
import Badge from '../common/Badge';
import { ArrowUpRight, Folder, FolderPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * ProjectProgressList Component
 * 
 * Displays list of projects within the active workspace and their % completion.
 */
export default function ProjectProgressList({ projects = [] }) {
  const statusColorMap = {
    'In Progress': 'primary',
    'Planning': 'warning',
    'Completed': 'success',
    'Under Review': 'info',
  };

  return (
    <Card>
      <CardHeader
        action={
          <Link
            to="/projects"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <CardTitle>Active Projects</CardTitle>
        <CardDescription>Initiatives in this tenant workspace</CardDescription>
      </CardHeader>

      <CardBody className="divide-y divide-slate-100 p-0">
        {projects.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
              <FolderPlus className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700">No projects created yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
              This tenant workspace has no projects. Use "+ Project" in the navigation bar to add one.
            </p>
            <Link
              to="/projects"
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Go to Projects</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          projects.slice(0, 4).map((project) => (
            <div
              key={project._id || project.id}
              className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Folder className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {project.name}
                    </h4>
                    <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1 rounded">
                      {project.key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Lead: {project.lead} • Target: {project.deadline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:shrink-0 w-full sm:w-auto">
                {/* Progress Bar */}
                <div className="flex-1 sm:w-32">
                  <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
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

                <Badge variant={statusColorMap[project.status] || 'neutral'} size="sm" dot>
                  {project.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
