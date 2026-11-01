import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Root App Component
 * 
 * Provides:
 * 1. BrowserRouter: Enables HTML5 history routing without page reloads
 * 2. ThemeProvider: Manages Dark/Light mode theme state persisted in localStorage
 * 3. AuthProvider: Manages user authentication, HTTP-only session cookies, and persistent login
 * 4. WorkspaceProvider: Multi-tenant workspace state and MongoDB-persisted CRUD actions
 * 5. AppRoutes: Guarded application routes and public login/signup pages
 */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <AppRoutes />
          </WorkspaceProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
