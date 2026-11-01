import fs from 'fs';

let content = fs.readFileSync('src/context/WorkspaceContext.jsx', 'utf8');

// Replace activeWorkspace
const oldActiveWs = `  // Compute active workspace object
  const activeWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return (
      workspaces.find((w) => String(w._id || w.id) === String(activeWorkspaceId)) || null
    );
  }, [workspaces, activeWorkspaceId]);`;

const newActiveWs = `  // Compute active workspace object with graceful fallback to prevent blank views
  const activeWorkspace = useMemo(() => {
    if (!workspaces || workspaces.length === 0) return null;
    if (activeWorkspaceId) {
      const found = workspaces.find((w) => String(w._id || w.id) === String(activeWorkspaceId));
      if (found) return found;
    }
    // Graceful fallback to first available workspace so pages never render blank
    return workspaces[0] || null;
  }, [workspaces, activeWorkspaceId]);`;

content = content.replace(/\r\n/g, '\n');
const oldNorm = oldActiveWs.replace(/\r\n/g, '\n');
const newNorm = newActiveWs.replace(/\r\n/g, '\n');

if (content.includes(oldNorm)) {
  content = content.replace(oldNorm, newNorm);
} else {
  console.log('oldActiveWs not found');
}

// Add createWorkspace
const oldUpdateWs = `  // Update Workspace Settings
  const updateWorkspace = useCallback(`;

const createWsCode = `  // Create Workspace
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
      showToast(\`Created new workspace "\${created.name}"!\`, 'success');
      return created;
    } catch (error) {
      console.error('[Frontend] Error creating workspace:', error);
      showToast(error.message || 'Failed to create workspace', 'danger');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Update Workspace Settings
  const updateWorkspace = useCallback(`;

if (content.includes(oldUpdateWs)) {
  content = content.replace(oldUpdateWs, createWsCode);
} else {
  console.log('oldUpdateWs not found');
}

// Add createWorkspace to value
const oldValue = `    updateWorkspace,
    addMember,`;
const newValue = `    createWorkspace,
    updateWorkspace,
    addMember,`;
if (content.includes(oldValue)) {
  content = content.replace(oldValue, newValue);
} else {
  console.log('oldValue not found');
}

fs.writeFileSync('src/context/WorkspaceContext.jsx', content, 'utf8');
console.log('WorkspaceContext updated successfully!');
