import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import MemberChatDrawer from '../components/chat/MemberChatDrawer';
import {
  Users,
  Shield,
  UserPlus,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Mail,
  RotateCcw,
  XCircle,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  getWorkspaceInvitations,
  resendWorkspaceInvitation,
  revokeWorkspaceInvitation,
} from '../services/api';

/**
 * TeamPage Component
 * 
 * Displays workspace members, enables 1-on-1 team member chat,
 * tracks pending workspace invitations (resend & revoke),
 * and supports role-based access management and member removal.
 */
export default function TeamPage() {
  const { activeWorkspace, addMember, removeMember, reloadWorkspaces } = useWorkspace();

  // Active Tab: 'members' | 'invitations'
  const [activeTab, setActiveTab] = useState('members');

  // Invitations State
  const [invitations, setInvitations] = useState([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [invitationActionMsg, setInvitationActionMsg] = useState({ type: '', text: '' });
  const [processingInvId, setProcessingInvId] = useState(null);

  // Add Member Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Member',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Remove Member Modal State
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Chat Drawer State
  const [chatMember, setChatMember] = useState(null);

  const members = activeWorkspace?.members || [];
  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  const roleBadges = {
    Owner: 'purple',
    Admin: 'primary',
    Member: 'neutral',
    Viewer: 'neutral',
  };

  const invitationStatusBadges = {
    pending: 'warning',
    accepted: 'success',
    rejected: 'danger',
    expired: 'neutral',
    revoked: 'neutral',
  };

  const loadInvitations = useCallback(async () => {
    const wsId = activeWorkspace?._id || activeWorkspace?.id;
    if (!wsId) return;
    setIsLoadingInvitations(true);
    try {
      const data = await getWorkspaceInvitations(wsId);
      setInvitations(data || []);
    } catch (err) {
      console.error('Failed to load workspace invitations:', err);
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeWorkspace) {
      loadInvitations();
    }
  }, [activeWorkspace, loadInvitations]);

  // Auto-refresh team members and invitations periodically (every 5s) so live presence updates in real time
  useEffect(() => {
    if (!activeWorkspace) return;
    const interval = setInterval(() => {
      if (reloadWorkspaces) reloadWorkspaces();
      loadInvitations();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeWorkspace, reloadWorkspaces, loadInvitations]);

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
      await loadInvitations();
      if (reloadWorkspaces) await reloadWorkspaces();
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const id = memberToDelete._id || memberToDelete.id || memberToDelete.email;
      await removeMember(id);
      setMemberToDelete(null);
      if (reloadWorkspaces) await reloadWorkspaces();
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    const wsId = activeWorkspace?._id || activeWorkspace?.id;
    if (!wsId) return;
    setProcessingInvId(invitationId);
    setInvitationActionMsg({ type: '', text: '' });
    try {
      await resendWorkspaceInvitation(wsId, invitationId);
      setInvitationActionMsg({ type: 'success', text: 'Invitation resent successfully.' });
      await loadInvitations();
    } catch (err) {
      setInvitationActionMsg({ type: 'error', text: err.message || 'Failed to resend invitation.' });
    } finally {
      setProcessingInvId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    const wsId = activeWorkspace?._id || activeWorkspace?.id;
    if (!wsId) return;
    setProcessingInvId(invitationId);
    setInvitationActionMsg({ type: '', text: '' });
    try {
      await revokeWorkspaceInvitation(wsId, invitationId);
      setInvitationActionMsg({ type: 'success', text: 'Invitation revoked successfully.' });
      await loadInvitations();
    } catch (err) {
      setInvitationActionMsg({ type: 'error', text: err.message || 'Failed to revoke invitation.' });
    } finally {
      setProcessingInvId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8F6EF] tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-[#C9B8FF]" />
            <span>Team & Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A6A1B5] mt-1">
            Managing members, collaboration, and permissions for <span className="font-semibold text-slate-700 dark:text-[#F8F6EF]">{activeWorkspace?.name}</span>
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={UserPlus}
          className="self-start sm:self-auto"
        >
          Add Member
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-[#C9B8FF]'
              : 'text-slate-500 hover:text-slate-900 dark:text-[#A6A1B5] dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-[#F8F6EF]">
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'invitations'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-[#C9B8FF]'
              : 'text-slate-500 hover:text-slate-900 dark:text-[#A6A1B5] dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Pending Invitations</span>
          {pendingInvitations.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
              {pendingInvitations.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'members' ? (
        <Card>
          <CardHeader>
            <CardTitle>Workspace Collaborators</CardTitle>
            <CardDescription>
              {members.length} members with access to this tenant workspace
            </CardDescription>
          </CardHeader>

          <CardBody className="p-0">
            {/* Mobile Card List (sm:hidden) */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-white/5 p-3 space-y-3">
              {members.map((member) => (
                <div
                  key={member._id || member.id || member.email}
                  className="p-3.5 bg-slate-50/70 dark:bg-[#100E17]/70 rounded-xl border border-slate-100 dark:border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={member.name}
                        initials={member.avatar}
                        status={member.status === 'Active' ? 'online' : 'offline'}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-[#F8F6EF] truncate">
                          {member.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-[#A6A1B5] font-mono truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant={roleBadges[member.role] || 'neutral'} size="xs">
                      {member.role}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#A6A1B5]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      {member.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChatMember(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium text-indigo-600 dark:text-[#C9B8FF] bg-indigo-50 dark:bg-[#C9B8FF]/15 active:bg-indigo-100 dark:active:bg-[#C9B8FF]/25 rounded-lg transition-colors cursor-pointer"
                        aria-label={`Chat with ${member.name}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      {member.role !== 'Owner' && (
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:text-rose-600 active:bg-rose-50 dark:active:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          aria-label={`Remove ${member.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#100E17]/80 border-b border-slate-100 dark:border-white/10 text-[11px] font-semibold text-slate-500 dark:text-[#A6A1B5] uppercase tracking-wider">
                    <th className="py-3 px-5">Member</th>
                    <th className="py-3 px-5">Email</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {members.map((member) => (
                    <tr key={member._id || member.id || member.email} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={member.name}
                            initials={member.avatar}
                            status={member.status === 'Active' ? 'online' : 'offline'}
                            size="sm"
                          />
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#F8F6EF]">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-[#A6A1B5] font-mono">
                        {member.email}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge variant={roleBadges[member.role] || 'neutral'} size="sm">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-[#A6A1B5]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Chat Button */}
                          <button
                            type="button"
                            onClick={() => setChatMember(member)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-[#C9B8FF] bg-indigo-50 dark:bg-[#C9B8FF]/15 hover:bg-indigo-100 dark:hover:bg-[#C9B8FF]/25 rounded-lg transition-colors cursor-pointer"
                            title={`Chat with ${member.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>

                          {/* Remove Member Button */}
                          {member.role !== 'Owner' ? (
                            <button
                              type="button"
                              onClick={() => setMemberToDelete(member)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title={`Remove ${member.name} from workspace`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="w-7 inline-block text-center text-slate-300 text-xs" title="Owner cannot be removed">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : (
        /* Invitations Tab */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workspace Invitations</CardTitle>
                <CardDescription>
                  Track, resend, and revoke invitations sent to join this workspace
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadInvitations}
                disabled={isLoadingInvitations}
                icon={isLoadingInvitations ? Loader2 : RotateCcw}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardBody className="p-0">
            {invitationActionMsg.text && (
              <div
                className={`m-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                  invitationActionMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40'
                }`}
              >
                {invitationActionMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{invitationActionMsg.text}</span>
              </div>
            )}

            {isLoadingInvitations && invitations.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs">Loading workspace invitations...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Mail className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-[#F8F6EF]">No invitations found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Invite teammates using the "Add Member" button above to collaborate.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-[#100E17]/80 border-b border-slate-100 dark:border-white/10 text-[11px] font-semibold text-slate-500 dark:text-[#A6A1B5] uppercase tracking-wider">
                      <th className="py-3 px-5">Recipient</th>
                      <th className="py-3 px-5">Role</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">Invited At</th>
                      <th className="py-3 px-5">Expires At</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {invitations.map((inv) => {
                      const isProcessing = processingInvId === inv._id;
                      const isPending = inv.status === 'pending';

                      return (
                        <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-xs sm:text-sm font-mono font-medium text-slate-900 dark:text-[#F8F6EF]">
                                {inv.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <Badge variant={roleBadges[inv.role] || 'neutral'} size="sm">
                              {inv.role}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-5">
                            <Badge variant={invitationStatusBadges[inv.status] || 'neutral'} size="xs">
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-[#A6A1B5]">
                            {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-[#A6A1B5]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Resend button */}
                              {['pending', 'expired', 'rejected'].includes(inv.status) && (
                                <button
                                  type="button"
                                  onClick={() => handleResendInvitation(inv._id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-[#C9B8FF] bg-indigo-50 dark:bg-[#C9B8FF]/15 hover:bg-indigo-100 dark:hover:bg-[#C9B8FF]/25 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Resend invitation email"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  )}
                                  <span>Resend</span>
                                </button>
                              )}

                              {/* Revoke button */}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeInvitation(inv._id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Revoke invitation"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Revoke</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* RBAC Architecture Explanation Card for Viva */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-[#14121C] rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-[#C9B8FF] font-semibold text-xs">
            <Shield className="w-4 h-4" />
            <span>Workspace Owner</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A6A1B5] leading-relaxed">
            Full billing ownership, tenant configuration, member de-provisioning, and workspace deletion rights.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#14121C] rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-[#C9B8FF] font-semibold text-xs">
            <Shield className="w-4 h-4" />
            <span>Workspace Admin</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A6A1B5] leading-relaxed">
            Can create and manage all projects, invite new members, configure integrations, and manage Kanban workflows.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#14121C] rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-[#F8F6EF] font-semibold text-xs">
            <Shield className="w-4 h-4" />
            <span>Workspace Member</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A6A1B5] leading-relaxed">
            Can view assigned projects, create tasks, direct message teammates, and update card statuses on boards.
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

      {/* Remove Member Confirmation Modal */}
      <Modal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        title="Remove Team Member"
        description={`Remove ${memberToDelete?.name} from this workspace?`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="ghost"
              onClick={() => setMemberToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmRemoveMember}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove Member'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-1 text-xs text-slate-600">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="leading-relaxed">
              This action will revoke <strong>{memberToDelete?.name}</strong>'s access to all projects, Kanban tasks, and workspace communications.
            </p>
          </div>
          <p className="text-slate-500">
            Email: <span className="font-mono text-slate-700">{memberToDelete?.email}</span>
          </p>
        </div>
      </Modal>

      {/* Member 1-on-1 Chat Slide-over Drawer */}
      <MemberChatDrawer
        isOpen={!!chatMember}
        onClose={() => setChatMember(null)}
        member={chatMember}
      />
    </div>
  );
}