import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../services/api';

// Create the Context with null default
export const WorkspaceContext = createContext(null);

/**
 * WorkspaceProvider Component
 * 
 * Manages multi-tenant workspace state backed by a real Node.js + Express + MongoDB backend.
 * Provides:
 * - Real HTTP API synchronization (GET, POST, PATCH, DELETE)
 * - Transparent loading and error states (no silent fake-mock fallback)
 * - Multi-tenant workspace scoping via 'x-workspace-id' header
 */
export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Show a temporary toast notification
  const showToast = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Fetch workspaces from MongoDB backend
  const loadWorkspacesFromBackend = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      let data = await api.getWorkspaces();

      // If DB has no workspaces yet, seed the default 3 tenant workspaces
      if (!data || data.length === 0) {
        console.log('[Frontend] Workspaces collection is empty. Triggering seed...');
        data = await api.seedDefaultWorkspaces();
      }

      setWorkspaces(data);

      if (data.length > 0) {
        // Keep current active workspace if still valid, or pick first
        setActiveWorkspaceId((prevId) => {
          const exists = data.some((w) => (w._id === prevId || w.id === prevId));
          const chosenId = exists ? prevId : (data[0]._id || data[0].id);

          const chosenWs = data.find((w) => (w._id === chosenId || w.id === chosenId));
          if (chosenWs && chosenWs.projects && chosenWs.projects.length > 0) {
            setActiveProjectId(chosenWs.projects[0]._id || chosenWs.projects[0].id);
          } else {
            setActiveProjectId(null);
          }

          return chosenId;
        });
      }
    } catch (err) {
      console.error('[Frontend] Failed to load workspaces from backend:', err);
      setApiError(err.message || 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadWorkspacesFromBackend();
  }, [loadWorkspacesFromBackend]);

  // Compute active workspace object
  const activeWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return (
      workspaces.find((w) => (w._id && w._id === activeWorkspaceId) || (w.id && w.id === activeWorkspaceId)) || null
    );
  }, [workspaces, activeWorkspaceId]);

  // Compute active project object
  const activeProject = useMemo(() => {
    if (!activeWorkspace || !activeWorkspace.projects || activeWorkspace.projects.length === 0) return null;
    return (
      activeWorkspace.projects.find((p) => (p._id && p._id === activeProjectId) || (p.id && p.id === activeProjectId)) ||
      activeWorkspace.projects[0] ||
      null
    );
  }, [activeWorkspace, activeProjectId]);

  // Switch active workspace
  const switchWorkspace = useCallback((wsId) => {
    setActiveWorkspaceId(wsId);
    const targetWs = workspaces.find((w) => (w._id && w._id === wsId) || (w.id && w.id === wsId));
    if (targetWs && targetWs.projects && targetWs.projects.length > 0) {
      setActiveProjectId(targetWs.projects[0]._id || targetWs.projects[0].id);
    } else {
      setActiveProjectId(null);
    }
    showToast(`Switched workspace to "${targetWs?.name || wsId}"`, 'success');
  }, [workspaces, showToast]);

  // -------------------------------------------------------------
  // Project Management Actions (Persisted to MongoDB)
  // -------------------------------------------------------------
  const addProject = useCallback(async (projectData) => {
    if (!activeWorkspaceId) {
      showToast('Cannot create project: No active workspace selected.', 'danger');
      return;
    }

    try {
      const createdProject = await api.createProject(activeWorkspaceId, projectData);

      // Update local state with the returned project from MongoDB
      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            return {
              ...ws,
              projects: [createdProject, ...(ws.projects || [])],
              activities: [
                {
                  id: `act-${Date.now()}`,
                  user: createdProject.lead || 'You',
                  action: 'created new project',
                  target: createdProject.name,
                  timestamp: 'Just now',
                },
                ...(ws.activities || []),
              ],
            };
          }
          return ws;
        })
      );

      setActiveProjectId(createdProject._id || createdProject.id);
      showToast(`Project "${createdProject.name}" created and saved to MongoDB!`, 'success');
      return createdProject;
    } catch (error) {
      console.error('[Frontend] Error creating project:', error);
      showToast(error.message || 'Failed to create project in database', 'danger');
      throw error;
    }
  }, [activeWorkspaceId, showToast]);

  const updateProject = useCallback(async (projectId, updatedData) => {
    if (!activeWorkspaceId) return;

    try {
      const updatedProject = await api.updateProject(activeWorkspaceId, projectId, updatedData);

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            return {
              ...ws,
              projects: (ws.projects || []).map((p) =>
                (p._id === projectId || p.id === projectId) ? { ...p, ...updatedProject } : p
              ),
            };
          }
          return ws;
        })
      );

      showToast('Project updated successfully in database.', 'success');
    } catch (error) {
      console.error('[Frontend] Error updating project:', error);
      showToast(error.message || 'Failed to update project', 'danger');
      throw error;
    }
  }, [activeWorkspaceId, showToast]);

  const deleteProject = useCallback(async (projectId) => {
    if (!activeWorkspaceId) return;

    try {
      await api.deleteProject(activeWorkspaceId, projectId);

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            const remainingProjects = (ws.projects || []).filter(
              (p) => p._id !== projectId && p.id !== projectId
            );
            const remainingTasks = (ws.tasks || []).filter(
              (t) => t.projectId !== projectId && t.projectId?._id !== projectId
            );
            return {
              ...ws,
              projects: remainingProjects,
              tasks: remainingTasks,
            };
          }
          return ws;
        })
      );

      // If deleted project was active, reset to first available
      setActiveProjectId((prevActiveId) => {
        if (prevActiveId === projectId) {
          const currentWs = workspaces.find(
            (w) => w._id === activeWorkspaceId || w.id === activeWorkspaceId
          );
          const nextProj = (currentWs?.projects || []).find(
            (p) => p._id !== projectId && p.id !== projectId
          );
          return nextProj ? (nextProj._id || nextProj.id) : null;
        }
        return prevActiveId;
      });

      showToast('Project and associated tasks removed from MongoDB.', 'info');
    } catch (error) {
      console.error('[Frontend] Error deleting project:', error);
      showToast(error.message || 'Failed to delete project', 'danger');
    }
  }, [activeWorkspaceId, workspaces, showToast]);

  // -------------------------------------------------------------
  // Task Management Actions (Persisted to MongoDB)
  // -------------------------------------------------------------
  const addTask = useCallback(async (taskData) => {
    if (!activeWorkspaceId) {
      showToast('Please select a workspace before adding tasks.', 'danger');
      return;
    }

    const targetProjectId = taskData.projectId || activeProject?._id || activeProject?.id;
    if (!targetProjectId) {
      showToast('Cannot add task: No project selected or created yet.', 'danger');
      return;
    }

    try {
      const payload = {
        ...taskData,
        projectId: targetProjectId,
      };

      const createdTask = await api.createTask(activeWorkspaceId, payload);

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            return {
              ...ws,
              tasks: [createdTask, ...(ws.tasks || [])],
              activities: [
                {
                  id: `act-${Date.now()}`,
                  user: createdTask.assignee?.name || 'You',
                  action: 'created task',
                  target: createdTask.title,
                  destination: createdTask.status,
                  timestamp: 'Just now',
                },
                ...(ws.activities || []),
              ],
            };
          }
          return ws;
        })
      );

      showToast(`Task "${createdTask.title}" added to MongoDB board!`, 'success');
      return createdTask;
    } catch (error) {
      console.error('[Frontend] Error creating task:', error);
      showToast(error.message || 'Failed to create task in database', 'danger');
      throw error;
    }
  }, [activeWorkspaceId, activeProject, showToast]);

  const updateTaskStatus = useCallback(async (taskId, newStatus) => {
    if (!activeWorkspaceId) return;

    try {
      const updatedTask = await api.updateTask(activeWorkspaceId, taskId, { status: newStatus });

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            return {
              ...ws,
              tasks: (ws.tasks || []).map((t) =>
                (t._id === taskId || t.id === taskId) ? { ...t, status: newStatus } : t
              ),
            };
          }
          return ws;
        })
      );
    } catch (error) {
      console.error('[Frontend] Error moving task status:', error);
      showToast(error.message || 'Failed to update task status in database', 'danger');
    }
  }, [activeWorkspaceId, showToast]);

  const updateTask = useCallback(async (taskId, updatedData) => {
    if (!activeWorkspaceId) return;

    try {
      const updatedTask = await api.updateTask(activeWorkspaceId, taskId, updatedData);

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            return {
              ...ws,
              tasks: (ws.tasks || []).map((t) =>
                (t._id === taskId || t.id === taskId) ? { ...t, ...updatedTask } : t
              ),
            };
          }
          return ws;
        })
      );

      showToast('Task details updated in MongoDB.', 'success');
    } catch (error) {
      console.error('[Frontend] Error updating task:', error);
      showToast(error.message || 'Failed to update task', 'danger');
      throw error;
    }
  }, [activeWorkspaceId, showToast]);

  const deleteTask = useCallback(async (taskId) => {
    if (!activeWorkspaceId) return;

    try {
      await api.deleteTask(activeWorkspaceId, taskId);

      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            return {
              ...ws,
              tasks: (ws.tasks || []).filter((t) => t._id !== taskId && t.id !== taskId),
            };
          }
          return ws;
        })
      );

      showToast('Task deleted from MongoDB board.', 'info');
    } catch (error) {
      console.error('[Frontend] Error deleting task:', error);
      showToast(error.message || 'Failed to delete task', 'danger');
    }
  }, [activeWorkspaceId, showToast]);

  // Reseed default workspaces
  const resetAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const seeded = await api.seedDefaultWorkspaces();
      setWorkspaces(seeded);
      if (seeded.length > 0) {
        setActiveWorkspaceId(seeded[0]._id || seeded[0].id);
        setActiveProjectId(seeded[0].projects?.[0]?._id || seeded[0].projects?.[0]?.id || null);
      }
      showToast('Workspaces reset and verified with MongoDB.', 'info');
    } catch (error) {
      showToast(error.message || 'Failed to reset seed data', 'danger');
    } finally {
      setIsLoading(false);
    }
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
    apiError,
    reloadWorkspaces: loadWorkspacesFromBackend,
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
