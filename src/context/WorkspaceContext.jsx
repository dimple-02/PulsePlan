import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

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
const STORAGE_KEY_WS = 'pulseplan_active_workspace_id';
const STORAGE_KEY_PROJ = 'pulseplan_active_project_id';

export function WorkspaceProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_WS) || null;
    } catch {
      return null;
    }
  });
  const [activeProjectId, setActiveProjectId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PROJ) || null;
    } catch {
      return null;
    }
  });
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
    if (!isAuthenticated) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setActiveProjectId(null);
      setIsLoading(false);
      try {
        localStorage.removeItem(STORAGE_KEY_WS);
        localStorage.removeItem(STORAGE_KEY_PROJ);
      } catch {}
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data || []);

      if (data && data.length > 0) {
        // Retrieve stored preference or current state or fallback
        const savedWsId = localStorage.getItem(STORAGE_KEY_WS);
        const savedProjId = localStorage.getItem(STORAGE_KEY_PROJ);

        setActiveWorkspaceId((prevId) => {
          const candidateId = prevId || savedWsId;
          const exists = candidateId && data.some((w) => String(w._id || w.id) === String(candidateId));
          const chosenId = exists ? candidateId : (data[0]._id || data[0].id);

          const chosenWs = data.find((w) => String(w._id || w.id) === String(chosenId));

          setActiveProjectId((prevProjId) => {
            const candidateProjId = prevProjId || savedProjId;
            const projExists = candidateProjId && chosenWs?.projects?.some(
              (p) => String(p._id || p.id) === String(candidateProjId)
            );
            const chosenProjId = projExists
              ? candidateProjId
              : (chosenWs?.projects?.[0] ? (chosenWs.projects[0]._id || chosenWs.projects[0].id) : null);

            try {
              if (chosenProjId) {
                localStorage.setItem(STORAGE_KEY_PROJ, String(chosenProjId));
              } else {
                localStorage.removeItem(STORAGE_KEY_PROJ);
              }
            } catch {}
            return chosenProjId;
          });

          try {
            if (chosenId) {
              localStorage.setItem(STORAGE_KEY_WS, String(chosenId));
            }
          } catch {}
          return chosenId;
        });
      } else {
        setActiveWorkspaceId(null);
        setActiveProjectId(null);
      }
    } catch (err) {
      console.error('[Frontend] Failed to load workspaces from backend:', err);
      if (err.status !== 401) {
        setApiError(err.message || 'Failed to connect to backend server');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Reload when authentication state or user changes
  useEffect(() => {
    loadWorkspacesFromBackend();
  }, [loadWorkspacesFromBackend, user?.id]);

  // Compute active workspace object with graceful fallback to prevent blank views
  const activeWorkspace = useMemo(() => {
    if (!workspaces || workspaces.length === 0) return null;
    if (activeWorkspaceId) {
      const found = workspaces.find((w) => String(w._id || w.id) === String(activeWorkspaceId));
      if (found) return found;
    }
    // Graceful fallback to first available workspace so pages never render blank
    return workspaces[0] || null;
  }, [workspaces, activeWorkspaceId]);

  // Compute active project object
  const activeProject = useMemo(() => {
    if (!activeWorkspace || !activeWorkspace.projects || activeWorkspace.projects.length === 0) return null;
    return (
      activeWorkspace.projects.find((p) => String(p._id || p.id) === String(activeProjectId)) ||
      activeWorkspace.projects[0] ||
      null
    );
  }, [activeWorkspace, activeProjectId]);

  // Switch active workspace
  const switchWorkspace = useCallback((wsId) => {
    setActiveWorkspaceId(wsId);
    try {
      localStorage.setItem(STORAGE_KEY_WS, String(wsId));
    } catch {}

    const targetWs = workspaces.find((w) => String(w._id || w.id) === String(wsId));
    if (targetWs && targetWs.projects && targetWs.projects.length > 0) {
      const defaultProjId = targetWs.projects[0]._id || targetWs.projects[0].id;
      setActiveProjectId(defaultProjId);
      try {
        localStorage.setItem(STORAGE_KEY_PROJ, String(defaultProjId));
      } catch {}
    } else {
      setActiveProjectId(null);
      try {
        localStorage.removeItem(STORAGE_KEY_PROJ);
      } catch {}
    }
    showToast(`Switched workspace to "${targetWs?.name || wsId}"`, 'success');
  }, [workspaces, showToast]);

  // Select active project (or switch workspace if item is a workspace)
  const selectProject = useCallback((projOrWsId) => {
    if (!projOrWsId) {
      setActiveProjectId(null);
      try {
        localStorage.removeItem(STORAGE_KEY_PROJ);
      } catch {}
      return null;
    }

    const targetId = String(projOrWsId);

    // 1. Check if targetId is a project in the currently active workspace
    const projectInActive = activeWorkspace?.projects?.find(
      (p) => String(p._id || p.id) === targetId
    );

    if (projectInActive) {
      const chosenId = projectInActive._id || projectInActive.id;
      setActiveProjectId(chosenId);
      try {
        localStorage.setItem(STORAGE_KEY_PROJ, String(chosenId));
      } catch {}
      showToast(`Active project: "${projectInActive.name}" (${projectInActive.key})`, 'info');
      return { type: 'project', data: projectInActive };
    }

    // 2. Check if targetId matches a workspace (e.g. if a workspace was passed)
    const matchingWs = workspaces.find(
      (w) => String(w._id || w.id) === targetId
    );
    if (matchingWs) {
      switchWorkspace(matchingWs._id || matchingWs.id);
      return { type: 'workspace', data: matchingWs };
    }

    // 3. Check if targetId is a project belonging to another authorized workspace
    for (const ws of workspaces) {
      const matchingProj = (ws.projects || []).find(
        (p) => String(p._id || p.id) === targetId
      );
      if (matchingProj) {
        const wsId = ws._id || ws.id;
        const pId = matchingProj._id || matchingProj.id;
        setActiveWorkspaceId(wsId);
        setActiveProjectId(pId);
        try {
          localStorage.setItem(STORAGE_KEY_WS, String(wsId));
          localStorage.setItem(STORAGE_KEY_PROJ, String(pId));
        } catch {}
        showToast(`Switched to "${ws.name}" • Project: "${matchingProj.name}"`, 'success');
        return { type: 'project', data: matchingProj, workspace: ws };
      }
    }

    // 4. Not found in any tenant context accessible to this user
    console.warn(`[WorkspaceContext] Project or Workspace '${projOrWsId}' not found.`);
    showToast('The requested project could not be found in your workspaces.', 'warning');
    return null;
  }, [activeWorkspace, workspaces, switchWorkspace, showToast]);

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
                  createdAt: new Date().toISOString(),
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
                  createdAt: new Date().toISOString(),
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
            const currentTask = (ws.tasks || []).find((t) => (t._id === taskId || t.id === taskId));
            const oldStatus = currentTask?.status;
            const newActivities = (oldStatus && oldStatus !== newStatus) ? [
              {
                id: `act-${Date.now()}`,
                user: updatedTask?.assignee?.name || 'You',
                action: 'moved task',
                target: updatedTask?.title || currentTask?.title || 'Task',
                destination: newStatus,
                timestamp: 'Just now',
                createdAt: new Date().toISOString(),
              },
              ...(ws.activities || []),
            ] : (ws.activities || []);
            return {
              ...ws,
              tasks: (ws.tasks || []).map((t) =>
                (t._id === taskId || t.id === taskId) ? { ...t, status: newStatus } : t
              ),
              activities: newActivities,
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

  // Create Workspace
  const createWorkspace = useCallback(async (workspaceData) => {
    setIsLoading(true);
    try {
      const created = await api.createWorkspace(workspaceData);
      setWorkspaces((prev) => [created, ...(prev || [])]);
      const newWsId = created._id || created.id;
      setActiveWorkspaceId(newWsId);
      try {
        localStorage.setItem(STORAGE_KEY_WS, String(newWsId));
      } catch {}
      showToast(`Created new workspace "${created.name}"!`, 'success');
      return created;
    } catch (error) {
      console.error('[Frontend] Error creating workspace:', error);
      showToast(error.message || 'Failed to create workspace', 'danger');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Update Workspace settings
  const updateWorkspace = useCallback(async (workspaceId, updatedData) => {
    try {
      const updated = await api.updateWorkspace(workspaceId, updatedData);
      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) =>
          (ws._id === workspaceId || ws.id === workspaceId) ? { ...ws, ...updated } : ws
        )
      );
      showToast('Workspace settings updated in MongoDB.', 'success');
      return updated;
    } catch (error) {
      console.error('[Frontend] Error updating workspace:', error);
      showToast(error.message || 'Failed to update workspace', 'danger');
      throw error;
    }
  }, [showToast]);

  // Add Member to Workspace
  const addMember = useCallback(async (memberData) => {
    if (!activeWorkspaceId) {
      showToast('No active workspace selected', 'danger');
      return;
    }
    try {
      const newMember = await api.addWorkspaceMember(activeWorkspaceId, memberData);
      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            return {
              ...ws,
              members: [...(ws.members || []), newMember],
              membersCount: (ws.members?.length || 0) + 1,
              activities: [
                {
                  id: `act-${Date.now()}`,
                  user: 'You',
                  action: 'added new member',
                  target: newMember.name,
                  timestamp: 'Just now',
                  createdAt: new Date().toISOString(),
                },
                ...(ws.activities || []),
              ],
            };
          }
          return ws;
        })
      );
      showToast(`Added ${newMember.name} to workspace!`, 'success');
      return newMember;
    } catch (error) {
      console.error('[Frontend] Error adding member:', error);
      showToast(error.message || 'Failed to add member', 'danger');
      throw error;
    }
  }, [activeWorkspaceId, showToast]);

  // Remove Member from Workspace
  const removeMember = useCallback(async (memberId) => {
    if (!activeWorkspaceId) {
      showToast('No active workspace selected', 'danger');
      return;
    }
    try {
      await api.removeWorkspaceMember(activeWorkspaceId, memberId);
      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) => {
          if (ws._id === activeWorkspaceId || ws.id === activeWorkspaceId) {
            const updatedMembers = (ws.members || []).filter(
              (m) => m._id !== memberId && m.id !== memberId && m.email !== memberId
            );
            return {
              ...ws,
              members: updatedMembers,
              membersCount: updatedMembers.length,
            };
          }
          return ws;
        })
      );
      showToast('Member removed from workspace.', 'info');
    } catch (error) {
      console.error('[Frontend] Error removing member:', error);
      showToast(error.message || 'Failed to remove member', 'danger');
      throw error;
    }
  }, [activeWorkspaceId, showToast]);

  const value = {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    switchWorkspace,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    selectProject,
    searchQuery,
    setSearchQuery,
    isLoading,
    apiError,
    reloadWorkspaces: loadWorkspacesFromBackend,
    notification,
    showToast,
    createWorkspace,
    updateWorkspace,
    addMember,
    removeMember,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
