import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import BootstrapSyllabusShowcase from '../components/common/BootstrapSyllabusShowcase';
import { Settings, Save, Building2, Shield, Sparkles } from 'lucide-react';

/**
 * SettingsPage Component
 * 
 * Manages configuration for the current tenant workspace.
 */
export default function SettingsPage() {
  const { activeWorkspace, updateWorkspace, showToast } = useWorkspace();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return;

    setIsSaving(true);
    try {
      await updateWorkspace(activeWorkspace._id || activeWorkspace.id, {
        name,
        description,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage general settings and tenant metadata for <span className="font-semibold text-slate-700">{activeWorkspace.name}</span>
        </p>
      </div>

      {/* General Settings Card */}
      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Tenant details and public profile</CardDescription>
          </CardHeader>

          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Workspace Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Workspace Slug (Tenant Identifier)"
                value={activeWorkspace.slug}
                disabled
                helperText="Unique subdomain slug used for multi-tenant routing"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg text-sm border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Tenant Plan
                </span>
                <span className="text-xs text-slate-500">
                  Current subscription tier for this organization
                </span>
              </div>
              <Badge variant="primary" size="md">
                {activeWorkspace.plan} Tier
              </Badge>
            </div>
          </CardBody>

          <CardFooter className="justify-end">
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving} icon={Save}>
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Syllabus Showcase: Bootstrap 5, Tailwind CSS, & JavaScript Promises */}
      <BootstrapSyllabusShowcase />
    </div>
  );
}
