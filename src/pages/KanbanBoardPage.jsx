import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import KanbanColumn from '../components/kanban/KanbanColumn';
import KanbanFilters from '../components/kanban/KanbanFilters';
import TaskDetailsModal from '../components/kanban/TaskDetailsModal';
import CreateTaskModal from '../components/kanban/CreateTaskModal';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Plus, Kanban, FolderPlus, Sparkles } from 'lucide-react';

/**
 * KanbanBoardPage Component
 * 
 * Interactive Kanban Task Board for the active project in the tenant workspace.
 * Features:
 * - 5 Workflow Columns: Backlog, To Do, In Progress, In Review, Done
 * - Status transitions
 * - Dynamic task filtering via useMemo
 * - Realistic empty states when no projects or tasks exist
 */
export default function KanbanBoardPage() {
  const { activeWorkspace, activeProject, activeProjectId } = useWorkspace();

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [initialStatusForNewTask, setInitialStatusForNewTask] = useState('todo');

  const projects = activeWorkspace?.projects || [];

  // Filter tasks belonging to the currently active project
  const projectTasks = useMemo(() => {
    if (!activeWorkspace || !activeWorkspace.tasks) return [];
    if (!activeProjectId) return activeWorkspace.tasks;

    return activeWorkspace.tasks.filter((t) => {
      const taskProjId = typeof t.projectId === 'object' && t.projectId !== null ? (t.projectId._id || t.projectId.id) : t.projectId;
      return String(taskProjId) === String(activeProjectId);
    });
  }, [activeWorkspace, activeProjectId]);

  // Apply search and priority filters to the project tasks
  const filteredTasks = useMemo(() => {
    return projectTasks.filter((task) => {
      const matchesSearch =
        searchTerm === '' ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [projectTasks, searchTerm, priorityFilter]);

  // Group filtered tasks into the 5 columns
  const columns = [
    {
      id: 'backlog',
      title: 'Backlog',
      color: 'bg-slate-400',
      tasks: filteredTasks.filter((t) => t.status === 'backlog'),
    },
    {
      id: 'todo',
      title: 'To Do',
      color: 'bg-sky-500',
      tasks: filteredTasks.filter((t) => t.status === 'todo'),
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: 'bg-indigo-600',
      tasks: filteredTasks.filter((t) => t.status === 'in_progress'),
    },
    {
      id: 'review',
      title: 'In Review',
      color: 'bg-amber-500',
      tasks: filteredTasks.filter((t) => t.status === 'review'),
    },
    {
      id: 'done',
      title: 'Done',
      color: 'bg-emerald-500',
      tasks: filteredTasks.filter((t) => t.status === 'done'),
    },
  ];

  const handleCardClick = (task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleQuickAdd = (statusId) => {
    if (projects.length === 0) {
      setIsCreateProjectOpen(true);
      return;
    }
    setInitialStatusForNewTask(statusId);
    setIsCreateTaskOpen(true);
  };

  const isFiltered = searchTerm !== '' || priorityFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8F6EF] tracking-tight flex items-center gap-2">
              <Kanban className="w-5 h-5 text-indigo-600 dark:text-[#C9B8FF]" />
              <span>Kanban Task Board</span>
            </h1>
            {activeProject && (
              <Badge variant="primary" size="sm">
                {activeProject.key}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A6A1B5] mt-1">
            Tracking workflow pipeline for <span className="font-semibold text-slate-700 dark:text-[#F8F6EF]">{activeProject?.name || 'Workspace'}</span>
          </p>
        </div>

        {projects.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleQuickAdd('todo')}
            icon={Plus}
          >
            Add Task
          </Button>
        )}
      </div>

      {/* Case 1: No projects exist in the active workspace */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="No projects in this workspace yet"
          description={`Workspace "${activeWorkspace?.name || 'Your Workspace'}" currently has no projects. Create your first project to enable the Kanban board and task management.`}
          actionLabel="Create Project"
          onAction={() => setIsCreateProjectOpen(true)}
          actionIcon={FolderPlus}
        />
      ) : (
        <>
          {/* Board Filters and Project Selector */}
          <KanbanFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            onResetFilters={() => {
              setSearchTerm('');
              setPriorityFilter('all');
            }}
            isFiltered={isFiltered}
          />

          {/* Mobile Column Quick-Jump Tabs */}
          <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {columns.map((col) => (
              <button
                key={col.id}
                type="button"
                data-column={col.id}
                onClick={() => {
                  const el = document.getElementById(`kanban-col-${col.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-[#A6A1B5] border border-slate-200 dark:border-white/10 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span>{col.title}</span>
                <span className="text-[10px] font-semibold opacity-75">
                  ({col.tasks.length})
                </span>
              </button>
            ))}
          </div>

          {/* Kanban Board Horizontal Scroll Track */}
          {projectTasks.length === 0 && !isFiltered ? (
            <EmptyState
              icon={Kanban}
              title="No tasks in this project yet"
              description={`Project "${activeProject?.name || 'Selected Project'}" currently has no tasks. Add user stories, bugs, or feature tickets to begin.`}
              actionLabel="Create First Task"
              onAction={() => handleQuickAdd('todo')}
              actionIcon={Plus}
            />
          ) : (
            <div className="flex items-start gap-3 sm:gap-4 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory sm:snap-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0 scroll-smooth">
              {columns.map((col) => (
                <div key={col.id} id={`kanban-col-${col.id}`} className="snap-center sm:snap-align-none shrink-0">
                  <KanbanColumn
                    id={col.id}
                    title={col.title}
                    indicatorColor={col.color}
                    tasks={col.tasks}
                    onCardClick={handleCardClick}
                    onQuickAdd={handleQuickAdd}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
      />

      {/* Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        initialStatus={initialStatusForNewTask}
      />

      {/* Project Creation Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />
    </div>
  );
}
