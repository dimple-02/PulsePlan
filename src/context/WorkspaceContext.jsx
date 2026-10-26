import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getWorkspaces, saveWorkspaces, resetToDefaultSeed } from '../services/clientStorage';

// Create the Context with null default
export const WorkspaceContext = createContext(null);

/**
 * WorkspaceProvider Component
 * 
 * Manages multi-tenant workspace state globally across the React application.
 * Solves the "Prop Drilling" problem in React by supplying tenant data, active
 * projects, and CRUD handlers to any child component via Context API.
 */
export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Show a temporary toast notification
  const showToast = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoading(true);
      const data = await getWorkspaces();
      if (isMounted) {
        setWorkspaces(data);
        if (data.length > 0) {
          const defaultWs = data[0];
          setActiveWorkspaceId(defaultWs.id);
          if (defaultWs.projects.length > 0) {
            setActiveProjectId(defaultWs.projects[0].id);
          }
        }
        setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active workspace object whenever activeWorkspaceId or workspaces list changes
  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  // Compute active project object
  const activeProject = useMemo(() => {
    if (!activeWorkspace || !activeWorkspace.projects) return null;
    return activeWorkspace.projects.find((p) => p.id === activeProjectId) || activeWorkspace.projects[0] || null;
  }, [activeWorkspace, activeProjectId]);

  // Sync active project if active workspace changes
  const switchWorkspace = useCallback((wsId) => {
    setActiveWorkspaceId(wsId);
    const targetWs = workspaces.find((w) => w.id === wsId);
    if (targetWs && targetWs.projects && targetWs.projects.length > 0) {
      setActiveProjectId(targetWs.projects[0].id);
    } else {
      setActiveProjectId(null);
    }
    showToast(`Switched workspace to "${targetWs?.name || wsId}"`, 'success');
  }, [workspaces, showToast]);

  // Persist updates to storage whenever workspaces state changes (after initial load)
  const syncAndSave = useCallback(async (updatedWorkspaces) => {
    setWorkspaces(updatedWorkspaces);
    await saveWorkspaces(updatedWorkspaces);
  }, []);

  // Project Management Actions (Scoped to Active Tenant Workspace)
  const addProject = useCallback(async (projectData) => {
    if (!activeWorkspaceId) return;

    const newProject = {
      id: `proj-${Date.now()}`,
      key: projectData.key?.toUpperCase() || `P${Math.floor(Math.random() * 900 + 100)}`,
      name: projectData.name,
      description: projectData.description || 'No description provided.',
      status: projectData.status || 'Planning',
      priority: projectData.priority || 'Medium',
      progress: 0,
      budget: projectData.budget || '$10,000',
      spent: '$0',
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
      deadline: projectData.deadline || '2025-01-30',
      lead: projectData.lead || 'Alex Morgan',
      members: ['AM'],
      category: projectData.category || 'General',
    };

    const updated = workspaces.map((ws) => {
      if (ws.id === activeWorkspaceId) {
        return {
          ...ws,
          projects: [newProject, ...ws.projects],
          activities: [
            {
              id: `act-${Date.now()}`,
              user: 'You',
              action: 'created new project',
              target: newProject.name,
              timestamp: 'Just now',
            },
            ...ws.activities,
          ],
        };
      }
      return ws;
    });

    await syncAndSave(updated);
    setActiveProjectId(newProject.id);
    showToast(`Project "${newProject.name}" created successfully!`, 'success');
    return newProject;
  }, [activeWorkspaceId, workspaces, syncAndSave, showToast]);

  const updateProject = useCallback(async (projectId, updatedData) => {
    if (!activeWorkspaceId) return;

    const updated = workspaces.map((ws) => {
      if (ws.id === activeWorkspaceId) {
        return {
          ...ws,
          projects: ws.projects.map((p) => (p.id === projectId ? { ...p, ...updatedData } : p)),
        };
      }
      return ws;
    });

    await syncAndSave(updated);
    showToast('Project updated successfully.', 'success');
  }, [activeWorkspaceId, workspaces, syncAndSave, showToast]);

  const deleteProject = useCallback(async (projectId) => {
    if (!activeWorkspaceId) return;

    const updated = workspaces.map((ws) => {
      if (ws.id === activeWorkspaceId) {
        const remainingProjects = ws.projects.filter((p) => p.id !== projectId);
        const remainingTasks = ws.tasks.filter((t) => t.projectId !== projectId);
        return {
          ...ws,
          projects: remainingProjects,
          tasks: remainingTasks,
        };
      }
      return ws;
    });

    await syncAndSave(updated);

    // If deleted project was active, reset to first available
    const currentWs = updated.find((w) => w.id === activeWorkspaceId);
    if (currentWs && currentWs.projects.length > 0) {
      setActiveProjectId(currentWs.projects[0].id);
    } else {
      setActiveProjectId(null);
    }

    showToast('Project removed.', 'info');
  }, [activeWorkspaceId, workspaces, syncAndSave, showToast]);

  // Task / Kanban Actions (Scoped to Active Project & Tenant)
  const addTask = useCallback(async (taskData) => {
    if (!activeWorkspaceId || !activeProject) return;

    const newTask = {
      id: `task-${Date.now()}`,
      projectId: activeProject.id,
      title: taskData.title,
      description: taskData.description || 'No detailed description.',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      assignee: taskData.assignee || { name: 'Alex Morgan', avatar: 'AM' },
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      tags: taskData.tags || ['Feature'],
      storyPoints: Number(taskData.storyPoints) || 3,
    };

    const updated = workspaces.map((ws) => {
      if (ws.id === activeWorkspaceId) {
        return {
          ...ws,
          tasks: [newTask, ...ws.tasks],
          activities: [
            {
              id: `act-${Date.now()}`,
              user: 'You',
              action: 'created task',
              target: newTask.title,
              timestamp: 'Just now',
            },
            ...ws.activities,
          ],
        };
      }
      return ws;
    });

    await syncAndSave(updated);
    showToast(`Task "${newTask.title}" added to board!`, 'success');
    return newTask;
  }, [activeWorkspaceId, activeProject, workspaces, syncAndSave, showToast]);

  const updateTaskStatus = useCallback(async (taskId, newStatus) => {
    if (!activeWorkspaceId) return;

    const updated = workspaces.map((ws) => {
      if (ws.id === activeWorkspaceId) {
        return {
          ...ws,
          tasks: ws.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
        };
      }
      return ws;
    });

    await syncAndSave(updated);
  }, [activeWorkspaceId, workspaces, syncAndSave]);

  const updateTask = useCallback(async (taskId, updatedData) => {
    if (!activeWorkspaceId) return;

    const updated = workspaces.map((ws) => {
      if (ws.id === activeWorkspaceId) {
        return {
          ...ws,
          tasks: ws.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t)),
        };
      }
      return ws;
    });

    await syncAndSave(updated);
    showToast('Task details updated.', 'success');
  }, [activeWorkspaceId, workspaces, syncAndSave, showToast]);

  const deleteTask = useCallback(async (taskId) => {
    if (!activeWorkspaceId) return;

    const updated = workspaces.map((ws) => {
      if (ws.id === activeWorkspaceId) {
        return {
          ...ws,
          tasks: ws.tasks.filter((t) => t.id !== taskId),
        };
      }
      return ws;
    });

    await syncAndSave(updated);
    showToast('Task deleted from board.', 'info');
  }, [activeWorkspaceId, workspaces, syncAndSave, showToast]);

  // Reset to default seed
  const resetAllData = useCallback(async () => {
    setIsLoading(true);
    const defaults = await resetToDefaultSeed();
    setWorkspaces(defaults);
    setActiveWorkspaceId(defaults[0].id);
    setActiveProjectId(defaults[0].projects[0]?.id || null);
    setIsLoading(false);
    showToast('Sample data reset to default seed.', 'info');
  }, [showToast]);

  const value = {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    switchWorkspace,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    searchQuery,
    setSearchQuery,
    isLoading,
    notification,
    showToast,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    resetAllData,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
