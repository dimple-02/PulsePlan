import React from 'react';
import WorkspacePage from './WorkspacePage';

/**
 * SettingsPage Component
 * 
 * Renders the Workspace Configuration & Settings view using the resilient
 * WorkspacePage component, ensuring full loading, error, and empty state support
 * with zero blank screens.
 */
export default function SettingsPage() {
  return <WorkspacePage defaultTab="settings" />;
}
