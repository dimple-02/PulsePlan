import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Root App Component
 * 
 * Provides:
 * 1. BrowserRouter: Enables HTML5 history routing without page reloads
 * 2. AuthProvider: Manages user authentication, HTTP-only session cookies, and persistent login
 * 3. WorkspaceProvider: Multi-tenant workspace state and MongoDB-persisted CRUD actions
 * 4. AppRoutes: Guarded application routes and public login/signup pages
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <AppRoutes />
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
