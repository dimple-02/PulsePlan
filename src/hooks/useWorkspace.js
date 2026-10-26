import { useContext } from 'react';
import { WorkspaceContext } from '../context/WorkspaceContext';

/**
 * useWorkspace Custom Hook
 * 
 * Provides components convenient access to the WorkspaceContext.
 * Ensures the component is wrapped inside <WorkspaceProvider />.
 * 
 * Viva Note:
 * Custom hooks in React always begin with 'use' and allow encapsulation
 * and reuse of stateful logic across multiple components.
 */
export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error('useWorkspace must be used within a <WorkspaceProvider />');
  }

  return context;
}
