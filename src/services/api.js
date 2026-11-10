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
  return result.data;
}

export async function verifyEmail({ email, otp }) {
  const result = await apiRequest('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
  return result.data?.user;
}

export async function resendVerification(email) {
  return await apiRequest('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
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

export async function forgotPassword(email) {
  return await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetOtp({ email, otp }) {
  return await apiRequest('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function resetPassword({ email, newPassword, resetToken, otp }) {
  return await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, newPassword, resetToken, otp }),
  });
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

export async function addWorkspaceMember(workspaceId, memberData) {
  const result = await apiRequest(`/workspaces/${workspaceId}/members`, {
    method: 'POST',
    body: JSON.stringify(memberData),
  }, workspaceId);
  return result.data || result.member || result;
}

export async function getWorkspaceInvitations(workspaceId) {
  const result = await apiRequest(`/workspaces/${workspaceId}/invitations`, { method: 'GET' }, workspaceId);
  return result.data || [];
}

export async function createWorkspaceInvitation(workspaceId, { email, role }) {
  const result = await apiRequest(`/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  }, workspaceId);
  return result.data;
}

export async function resendWorkspaceInvitation(workspaceId, invitationId) {
  const result = await apiRequest(`/workspaces/${workspaceId}/invitations/${invitationId}/resend`, {
    method: 'POST',
  }, workspaceId);
  return result.data;
}

export async function revokeWorkspaceInvitation(workspaceId, invitationId) {
  const result = await apiRequest(`/workspaces/${workspaceId}/invitations/${invitationId}/revoke`, {
    method: 'POST',
  }, workspaceId);
  return result.data;
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



export async function removeWorkspaceMember(workspaceId, memberId) {
  const result = await apiRequest(`/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'DELETE',
  }, workspaceId);
  return result.data;
}

// -------------------------------------------------------------
// Chat & Messaging API
// -------------------------------------------------------------
export async function getWorkspaceMessages(workspaceId, recipientEmail = null) {
  const query = recipientEmail ? `?recipientEmail=${encodeURIComponent(recipientEmail)}` : '';
  const result = await apiRequest(`/workspaces/${workspaceId}/messages${query}`, {
    method: 'GET',
  }, workspaceId);
  return result.data || [];
}

export async function sendWorkspaceMessage(workspaceId, messageData) {
  const result = await apiRequest(`/workspaces/${workspaceId}/messages`, {
    method: 'POST',
    body: JSON.stringify(messageData),
  }, workspaceId);
  return result.data;
}

// -------------------------------------------------------------
// Project Collaborators & Invitations API Calls
// -------------------------------------------------------------
export async function getProjectCollaborators(workspaceId, projectId) {
  const result = await apiRequest(
    `/projects/${projectId}/collaborators`,
    { method: 'GET' },
    workspaceId
  );
  return result.data;
}

export async function removeProjectCollaborator(workspaceId, projectId, userIdOrEmail) {
  return await apiRequest(
    `/projects/${projectId}/collaborators/${encodeURIComponent(userIdOrEmail)}`,
    { method: 'DELETE' },
    workspaceId
  );
}

export async function getProjectInvitations(workspaceId, projectId) {
  const result = await apiRequest(
    `/projects/${projectId}/invitations`,
    { method: 'GET' },
    workspaceId
  );
  return result.data || [];
}

export async function createProjectInvitation(workspaceId, projectId, { email, role }) {
  const result = await apiRequest(
    `/projects/${projectId}/invitations`,
    {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    },
    workspaceId
  );
  return result.data;
}

export async function resendProjectInvitation(workspaceId, projectId, invitationId) {
  const result = await apiRequest(
    `/projects/${projectId}/invitations/${invitationId}/resend`,
    { method: 'POST' },
    workspaceId
  );
  return result.data;
}

export async function revokeProjectInvitation(workspaceId, projectId, invitationId) {
  return await apiRequest(
    `/projects/${projectId}/invitations/${invitationId}/revoke`,
    { method: 'POST' },
    workspaceId
  );
}

// -------------------------------------------------------------
// Public & Recipient Invitation Actions (By Token)
// -------------------------------------------------------------
export async function getInvitationByToken(token) {
  return await apiRequest(`/invitations/token/${encodeURIComponent(token)}`, {
    method: 'GET',
  });
}

export async function acceptProjectInvitation(token) {
  return await apiRequest(`/invitations/token/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
  });
}

export const acceptInvitation = acceptProjectInvitation;

export async function rejectProjectInvitation(token) {
  return await apiRequest(`/invitations/token/${encodeURIComponent(token)}/reject`, {
    method: 'POST',
  });
}

export const rejectInvitation = rejectProjectInvitation;
