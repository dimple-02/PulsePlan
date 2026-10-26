import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Root App Component
 * 
 * Provides:
 * 1. BrowserRouter: Enables HTML5 history routing without page reloads
 * 2. WorkspaceProvider: React Context providing multi-tenant state and CRUD actions
 * 3. AppRoutes: Page routing tree
 */
export default function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <AppRoutes />
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
