import React, { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Users, Shield, UserPlus } from 'lucide-react';

/**
 * TeamPage Component
 * 
 * Displays members and role-based permissions (RBAC) in the active tenant workspace.
 * Highlights tenant user isolation.
 */
export default function TeamPage() {
  const { activeWorkspace, addMember } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Member',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const members = activeWorkspace?.members || [];

  const roleBadges = {
    Owner: 'purple',
    Admin: 'primary',
    Member: 'neutral',
  };

  const handleOpenModal = () => {
    setFormData({ name: '', email: '', role: 'Member' });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Member name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Member email is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await addMember(formData);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Team & Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Managing members and roles for <span className="font-semibold text-slate-700">{activeWorkspace?.name}</span>
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={<UserPlus className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Add Member
        </Button>
      </div>


      {/* Members Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Collaborators</CardTitle>
          <CardDescription>
            {members.length} members with access to this tenant workspace
          </CardDescription>
        </CardHeader>

        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.name}
                          initials={member.avatar}
                          status={member.status === 'Active' ? 'online' : 'offline'}
                          size="sm"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-500 font-mono">
                      {member.email}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={roleBadges[member.role] || 'neutral'} size="sm">
                        {member.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* RBAC Architecture Explanation Card for Viva */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-xs">
            <Shield className="w-4 h-4" />
            <span>Workspace Owner</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Full billing ownership, tenant configuration, member de-provisioning, and workspace deletion rights.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-indigo-700 font-semibold text-xs">
            <Shield className="w-4 h-4" />
            <span>Workspace Admin</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Can create and manage all projects, invite new members, configure integrations, and manage Kanban workflows.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-xs">
            <Shield className="w-4 h-4" />
            <span>Workspace Member</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Can view assigned projects, create tasks, update card statuses on boards, and participate in project discussions.
          </p>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Team Collaborator"
        description={`Add a new member to ${activeWorkspace?.name || 'this workspace'}`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
              {error}
            </div>
          )}

          <Input
            label="Full Name *"
            placeholder="e.g. Dimple Sharma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. dimple@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Select
            label="Workspace Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'Member', label: 'Member — Can create & update tasks' },
              { value: 'Admin', label: 'Admin — Can manage projects & team' },
              { value: 'Owner', label: 'Owner — Full workspace access' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
}

