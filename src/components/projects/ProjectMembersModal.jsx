import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useAuth } from '../../context/AuthContext';
import {
  getProjectCollaborators,
  getProjectInvitations,
  createProjectInvitation,
  resendProjectInvitation,
  revokeProjectInvitation,
  removeProjectCollaborator,
} from '../../services/api';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  XCircle,
} from 'lucide-react';

/**
 * ProjectMembersModal Component
 *
 * Provides a comprehensive collaboration management interface:
 * - View active project collaborators and roles
 * - Invite collaborators via email with granular RBAC (Admin, Member, Viewer)
 * - Track pending, accepted, rejected, expired, and revoked invitations
 * - Resend or revoke active invitations
 */
export default function ProjectMembersModal({ isOpen, onClose, project }) {
  const { activeWorkspace, reloadWorkspaces } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'invitations'

  // Data states
  const [collaborators, setCollaborators] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Invite Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [isSending, setIsSending] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // In-flight action tracking
  const [processingId, setProcessingId] = useState(null);

  const workspaceId = activeWorkspace?._id || activeWorkspace?.id;
  const projectId = project?._id || project?.id;

  // Load collaborators & invitations when modal opens
  const loadData = async () => {
    if (!workspaceId || !projectId) return;
    setIsLoading(true);
    try {
      const [collabRes, inviteRes] = await Promise.all([
        getProjectCollaborators(workspaceId, projectId).catch(() => ({ collaborators: [] })),
        getProjectInvitations(workspaceId, projectId).catch(() => []),
      ]);

      setCollaborators(collabRes?.collaborators || []);
      setInvitations(inviteRes || []);
    } catch (err) {
      console.error('Failed to load project collaboration data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      loadData();
      setActionMessage({ type: '', text: '' });
      setInviteEmail('');
      setInviteRole('Member');
    }
  }, [isOpen, projectId]);

  // Handle Send Invitation
  const handleSendInvite = async (e) => {
    e.preventDefault();
    setActionMessage({ type: '', text: '' });

    if (!inviteEmail.trim()) {
      setActionMessage({ type: 'error', text: 'Please enter a valid collaborator email.' });
      return;
    }

    setIsSending(true);
    try {
      await createProjectInvitation(workspaceId, projectId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setActionMessage({
        type: 'success',
        text: `Invitation dispatched to ${inviteEmail.trim()} successfully!`,
      });
      setInviteEmail('');
      setInviteRole('Member');
      // Refresh invitations list
      const updatedInvites = await getProjectInvitations(workspaceId, projectId);
      setInvitations(updatedInvites);
      setActiveTab('invitations');
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch project invitation.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle Resend Invitation
  const handleResend = async (invitationId) => {
    setProcessingId(invitationId);
    setActionMessage({ type: '', text: '' });
    try {
      await resendProjectInvitation(workspaceId, projectId, invitationId);
      setActionMessage({ type: 'success', text: 'Invitation resent successfully.' });
      const updatedInvites = await getProjectInvitations(workspaceId, projectId);
      setInvitations(updatedInvites);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to resend invitation.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Revoke Invitation
  const handleRevoke = async (invitationId) => {
    setProcessingId(invitationId);
    setActionMessage({ type: '', text: '' });
    try {
      await revokeProjectInvitation(workspaceId, projectId, invitationId);
      setActionMessage({ type: 'success', text: 'Invitation revoked.' });
      const updatedInvites = await getProjectInvitations(workspaceId, projectId);
      setInvitations(updatedInvites);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to revoke invitation.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Remove Collaborator
  const handleRemoveCollaborator = async (collabIdOrEmail) => {
    setProcessingId(collabIdOrEmail);
    setActionMessage({ type: '', text: '' });
    try {
      await removeProjectCollaborator(workspaceId, projectId, collabIdOrEmail);
      setActionMessage({ type: 'success', text: 'Collaborator removed from project.' });
      const collabRes = await getProjectCollaborators(workspaceId, projectId);
      setCollaborators(collabRes?.collaborators || []);
      if (reloadWorkspaces) {
        reloadWorkspaces();
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to remove collaborator.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success" size="xs" dot>Accepted</Badge>;
      case 'pending':
        return <Badge variant="warning" size="xs" dot>Pending</Badge>;
      case 'expired':
        return <Badge variant="neutral" size="xs" dot>Expired</Badge>;
      case 'revoked':
        return <Badge variant="danger" size="xs" dot>Revoked</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="xs" dot>Declined</Badge>;
      default:
        return <Badge variant="neutral" size="xs">{status}</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Collaborators — ${project?.name || 'Project'}`}
      description={`Manage project membership and email invitations for ${project?.key || 'initiative'}`}
      size="lg"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'members'
                ? 'bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-700 dark:text-[#C9B8FF]'
                : 'text-slate-500 dark:text-[#A6A1B5] hover:text-slate-800 dark:hover:text-[#F8F6EF]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Members ({collaborators.length + 1})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invitations')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'invitations'
                ? 'bg-indigo-50 dark:bg-[#C9B8FF]/15 text-indigo-700 dark:text-[#C9B8FF]'
                : 'text-slate-500 dark:text-[#A6A1B5] hover:text-slate-800 dark:hover:text-[#F8F6EF]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>
              Invitations ({invitations.filter((i) => i.status === 'pending').length} pending)
            </span>
          </button>
        </div>

        {/* Action Feedback Message */}
        {actionMessage.text && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
              actionMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {actionMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{actionMessage.text}</div>
          </div>
        )}

        {/* TAB 1: ACTIVE MEMBERS */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* Project Lead */}
            <div className="p-3 bg-slate-50 dark:bg-[#100E17] rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={project?.lead || 'Lead'} initials="PL" size="sm" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8F6EF]">
                    {project?.lead || 'Workspace Lead'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#A6A1B5]">
                    Project Creator / Designated Lead
                  </p>
                </div>
              </div>
              <Badge variant="purple" size="xs">Project Lead</Badge>
            </div>

            {/* Collaborators List */}
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-[#C9B8FF]" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-[#A6A1B5]/40 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-[#F8F6EF]">
                  No additional collaborators yet
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#A6A1B5] mt-1 max-w-xs mx-auto">
                  Invite teammates by email to collaborate on tasks and sprints in this project.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('invitations')}
                  className="mt-3 text-xs"
                  icon={UserPlus}
                >
                  Invite by Email
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                {collaborators.map((c) => (
                  <div
                    key={c.userId || c.email}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={c.name || c.email}
                        initials={c.avatar || 'U'}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-[#F8F6EF] truncate">
                          {c.name || c.email.split('@')[0]}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-[#A6A1B5] font-mono truncate">
                          {c.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={c.role === 'Admin' ? 'primary' : 'neutral'} size="xs">
                        {c.role}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleRemoveCollaborator(c.userId || c.email)}
                        disabled={processingId === (c.userId || c.email)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Remove collaborator"
                      >
                        {processingId === (c.userId || c.email) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVITATIONS */}
        {activeTab === 'invitations' && (
          <div className="space-y-5">
            {/* Invite Form */}
            <form
              onSubmit={handleSendInvite}
              className="p-4 bg-slate-50 dark:bg-[#100E17] rounded-xl border border-slate-200 dark:border-white/10 space-y-3"
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8F6EF] uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-600 dark:text-[#C9B8FF]" />
                <span>Invite New Collaborator</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#181524] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-[#F8F6EF] placeholder-slate-400 dark:placeholder-[#A6A1B5]/50 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20 focus:border-[#7C5CFC] dark:focus:border-[#C9B8FF] transition-all"
                  />
                </div>

                <div>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white dark:bg-[#181524] border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-[#F8F6EF] focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 dark:focus:ring-[#C9B8FF]/20"
                  >
                    <option value="Member">Role: Member</option>
                    <option value="Admin">Role: Admin</option>
                    <option value="Viewer">Role: Viewer</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 dark:text-[#A6A1B5]">
                  An invitation link will be sent with a 7-day expiration window.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={isSending}
                  icon={Send}
                >
                  Send Invite
                </Button>
              </div>
            </form>

            {/* Invitations History Table */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-[#F8F6EF] mb-2">
                Project Invitations ({invitations.length})
              </h4>

              {invitations.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-[#A6A1B5] italic p-3 bg-slate-50/50 dark:bg-white/5 rounded-lg border border-slate-200/60 dark:border-white/5">
                  No invitations recorded for this project yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id || inv._id}
                      className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-[#F8F6EF] truncate">
                            {inv.email}
                          </span>
                          {getStatusBadge(inv.status)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#A6A1B5]">
                          Role: <span className="font-medium text-slate-700 dark:text-[#F8F6EF]">{inv.role}</span>
                          {inv.expiresAt && (
                            <span className="ml-2 font-mono">
                              (Expires {new Date(inv.expiresAt).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Pending Actions */}
                      {inv.status === 'pending' && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleResend(inv.id || inv._id)}
                            disabled={processingId === (inv.id || inv._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-600 dark:text-[#C9B8FF] bg-indigo-50 dark:bg-[#C9B8FF]/15 hover:bg-indigo-100 dark:hover:bg-[#C9B8FF]/25 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            title="Resend invitation email"
                          >
                            {processingId === (inv.id || inv._id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">Resend</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRevoke(inv.id || inv._id)}
                            disabled={processingId === (inv.id || inv._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            title="Revoke invitation"
                          >
                            <XCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Revoke</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
