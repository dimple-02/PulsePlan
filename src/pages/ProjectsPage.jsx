import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspace';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectTableRow from '../components/projects/ProjectTableRow';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import {
  FolderPlus,
  LayoutGrid,
  List,
  Search,
  Filter,
  Inbox,
  Sparkles,
} from 'lucide-react';

/**
 * ProjectsPage Component
 * 
 * Demonstrates:
 * - useState for search queries, view modes (grid/table), category/status filters
 * - useMemo to optimize derived filtered list calculations
 * - Conditional rendering between Grid and Table views
 * - Empty states for zero-result queries
 */
export default function ProjectsPage() {
  const { activeWorkspace, deleteProject, selectProject } = useWorkspace();
  const navigate = useNavigate();

  const handleSelectProject = (project) => {
    const pId = project._id || project.id;
    if (selectProject) {
      selectProject(pId);
    }
    navigate('/kanban');
  };

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Calculate dynamic completion from tasks in real time
  const projects = useMemo(() => {
    const rawProjects = activeWorkspace?.projects || [];
    const allTasks = activeWorkspace?.tasks || [];

    return rawProjects.map((p) => {
      const pId = String(p._id || p.id);
      const pTasks = allTasks.filter((t) => {
        const tProjId =
          typeof t.projectId === 'object' && t.projectId !== null
            ? (t.projectId._id || t.projectId.id)
            : t.projectId;
        return String(tProjId) === pId;
      });

      const doneTasks = pTasks.filter((t) => t.status === 'done');
      const calculatedProgress =
        pTasks.length > 0 ? Math.round((doneTasks.length / pTasks.length) * 100) : (p.progress || 0);

      return {
        ...p,
        progress: calculatedProgress,
        totalTasksCount: pTasks.length,
        doneTasksCount: doneTasks.length,
      };
    });
  }, [activeWorkspace?.projects, activeWorkspace?.tasks]);

  // Derived filtered projects list using useMemo
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchFilter === '' ||
        project.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        project.key.toLowerCase().includes(searchFilter.toLowerCase()) ||
        project.description.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'all' || project.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [projects, searchFilter, statusFilter, categoryFilter]);

  // Extract distinct categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category).filter(Boolean));
    return Array.from(set);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8F6EF] tracking-tight">
              Projects
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#A6A1B5] border border-slate-200 dark:border-white/10">
              {filteredProjects.length} of {projects.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A6A1B5] mt-1">
            Managing initiatives for tenant <span className="font-semibold text-slate-700 dark:text-[#F8F6EF]">{activeWorkspace?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid / Table Toggle */}
          <div className="flex items-center p-1 bg-white dark:bg-[#14121C] border border-slate-200 dark:border-white/10 rounded-lg shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-700 dark:text-[#C9B8FF] font-semibold'
                  : 'text-slate-400 dark:text-[#A6A1B5] hover:text-slate-600 dark:hover:text-[#F8F6EF]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-700 dark:text-[#C9B8FF] font-semibold'
                  : 'text-slate-400 dark:text-[#A6A1B5] hover:text-slate-600 dark:hover:text-[#F8F6EF]'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={FolderPlus}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#14121C] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by project name, key, or scope..."
            className="w-full pl-9 pr-4 py-2 text-base sm:text-sm bg-slate-50 dark:bg-[#0B0A0F] border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20 focus:bg-white dark:focus:bg-[#100E17]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-base sm:text-xs rounded-lg border border-slate-300 dark:border-white/15 py-2 px-3 bg-white dark:bg-[#100E17] text-slate-700 dark:text-[#F8F6EF] focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20"
          >
            <option value="all">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Planning">Planning</option>
            <option value="Completed">Completed</option>
            <option value="Under Review">Under Review</option>
          </select>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-base sm:text-xs rounded-lg border border-slate-300 dark:border-white/15 py-2 px-3 bg-white dark:bg-[#100E17] text-slate-700 dark:text-[#F8F6EF] focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#C9B8FF]/20"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {(searchFilter || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchFilter('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Projects Display: Grid or Table or Empty State */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            projects.length === 0
              ? 'No projects in this workspace yet'
              : 'No projects match your filter'
          }
          description={
            projects.length === 0
              ? 'This tenant workspace currently has no projects. Click below to create your first project.'
              : 'Try adjusting your search criteria or resetting the status and category filters.'
          }
          actionLabel="Create Project"
          onAction={() => setIsCreateModalOpen(true)}
          actionIcon={FolderPlus}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id || project.id}
              project={project}
              onSelect={handleSelectProject}
              onDelete={deleteProject}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#14121C] rounded-xl border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
          {/* Mobile Table View Fallback */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-white/5 p-3 space-y-3">
            {filteredProjects.map((project) => (
              <div
                key={project._id || project.id}
                onClick={() => handleSelectProject(project)}
                className="p-3.5 bg-slate-50/70 dark:bg-[#100E17]/70 rounded-xl border border-slate-100 dark:border-white/5 space-y-2.5 active:bg-slate-100 dark:active:bg-white/5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-[#C9B8FF] bg-indigo-50 dark:bg-[#C9B8FF]/15 px-1.5 py-0.5 rounded uppercase">
                      {project.key}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-[#F8F6EF] mt-1">
                      {project.name}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-[#F8F6EF]">
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-[#C9B8FF] rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-[#A6A1B5]">
                  <span>{project.status}</span>
                  <span>{project.deadline}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#100E17]/80 border-b border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-500 dark:text-[#A6A1B5] uppercase tracking-wider">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4 hidden md:table-cell">Status</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Priority</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Deadline</th>
                  <th className="py-3 px-4 hidden xl:table-cell">Budget</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <ProjectTableRow
                    key={project._id || project.id}
                    project={project}
                    onSelect={handleSelectProject}
                    onDelete={deleteProject}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Creation Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
