/**
 * REST API Service Layer
 * 
 * Replaces simulated localStorage service with real HTTP network requests
 * using standard ES6 fetch and async/await syntax.
 * 
 * College Viva Topics:
 * - API Fetching with Promises & async/await
 * - Passing headers ('x-workspace-id') for multi-tenant backend boundary checks
 * - Handling HTTP status codes and error payloads without silent mock fallbacks
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic Fetch Wrapper
 */
async function apiRequest(endpoint, options = {}, workspaceId = null) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
    ...(options.headers || {}),
  };

  const config = {
    credentials: 'include',
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        result?.message ||
        result?.errors?.[0]?.msg ||
        result?.errors?.[0]?.message ||
        `Server responded with HTTP ${response.status} (${response.statusText})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = result;
      throw error;
    }

    return result;
  } catch (error) {
    // If it's a network error (e.g. server is down/unreachable)
    if (!error.status) {
      console.error(`[API Network Error] Could not connect to backend at ${url}:`, error.message);
      const networkError = new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. Ensure 'node server.js' is running in the server/ directory.`
      );
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

// -------------------------------------------------------------
// Authentication API Calls (Session Cookies & JWT)
// -------------------------------------------------------------
export async function signupUser({ name, email, password }) {
  const result = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  return result.data?.user;
}

export async function loginUser({ email, password }) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return result.data?.user;
}

export async function logoutUser() {
  return await apiRequest('/auth/logout', {
    method: 'POST',
  });
}

export async function getCurrentUser() {
  const result = await apiRequest('/auth/me', {
    method: 'GET',
  });
  return result.data?.user;
}

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
export async function checkBackendHealth() {
  return await apiRequest('/health');
}

// -------------------------------------------------------------
// Workspace (Tenant) API Calls
// -------------------------------------------------------------
export async function getWorkspaces() {
  const result = await apiRequest('/workspaces');
  return result.data || [];
}

export async function getWorkspaceById(id) {
  const result = await apiRequest(`/workspaces/${id}`);
  return result.data;
}

export async function createWorkspace(data) {
  const result = await apiRequest('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function updateWorkspace(id, data) {
  const result = await apiRequest(`/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function deleteWorkspace(id) {
  return await apiRequest(`/workspaces/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Project API Calls (Scoped to Workspace)
// -------------------------------------------------------------
export async function getProjects(workspaceId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const result = await apiRequest(`/projects${query}`, { method: 'GET' }, workspaceId);
  return result.data || [];
}

export async function createProject(workspaceId, projectData) {
  const result = await apiRequest(
    '/projects',
    {
      method: 'POST',
      body: JSON.stringify(projectData),
    },
    workspaceId
  );
  return result.data;
}

export async function updateProject(workspaceId, projectId, updateData) {
  const result = await apiRequest(
    `/projects/${projectId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    },
    workspaceId
  );
  return result.data;
}

export async function deleteProject(workspaceId, projectId) {
  return await apiRequest(
    `/projects/${projectId}`,
    {
      method: 'DELETE',
    },
    workspaceId
  );
}

// -------------------------------------------------------------
// Task API Calls (Scoped to Workspace)
// -------------------------------------------------------------
export async function getTasks(workspaceId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.projectId) params.append('projectId', filters.projectId);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
  if (filters.assignee && filters.assignee !== 'all') params.append('assignee', filters.assignee);
  if (filters.search) params.append('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const result = await apiRequest(`/tasks${query}`, { method: 'GET' }, workspaceId);
  return result.data || [];
}

export async function createTask(workspaceId, taskData) {
  const result = await apiRequest(
    '/tasks',
    {
      method: 'POST',
      body: JSON.stringify(taskData),
    },
    workspaceId
  );
  return result.data;
}

export async function updateTask(workspaceId, taskId, updateData) {
  const result = await apiRequest(
    `/tasks/${taskId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    },
    workspaceId
  );
  return result.data;
}

export async function deleteTask(workspaceId, taskId) {
  return await apiRequest(
    `/tasks/${taskId}`,
    {
      method: 'DELETE',
    },
    workspaceId
  );
}
