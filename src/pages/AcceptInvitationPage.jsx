import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../hooks/useWorkspace';
import {
  getInvitationByToken,
  acceptProjectInvitation,
  rejectProjectInvitation,
} from '../services/api';
import {
  Layers,
  FolderGit2,
  Users,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  Building2,
} from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import Badge from '../components/common/Badge';
import { areEmailsEqual } from '../utils/emailUtils';

/**
 * AcceptInvitationPage Component
 *
 * Handles public invitation links: /invitations/:token and /invite/:token
 * Supports both Project Collaboration and Workspace Collaboration invitations.
 * Validates expiration, enforces recipient identity match, and executes atomic acceptance.
 */
export default function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { switchWorkspace, reloadWorkspaces } = useWorkspace();

  const [invitationData, setInvitationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [acceptedSuccess, setAcceptedSuccess] = useState(null);
  const [rejectedSuccess, setRejectedSuccess] = useState(false);

  // Fetch invitation status
  useEffect(() => {
    let isMounted = true;
    async function loadInvitation() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const res = await getInvitationByToken(token);
        if (isMounted) {
          if (res.data) {
            setInvitationData(res.data);
          } else {
            setErrorMessage(res.message || 'Invitation is invalid or has expired.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.message || 'Invitation not found or link has expired.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (token) {
      loadInvitation();
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAccept = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const res = await acceptProjectInvitation(token);
      const acceptData = res.data || {};
      setAcceptedSuccess(acceptData);

      // Persist chosen workspace & project in localStorage for instant routing
      if (acceptData.workspaceId) {
        try {
          localStorage.setItem('pulseplan_active_workspace_id', String(acceptData.workspaceId));
          if (acceptData.projectId) {
            localStorage.setItem('pulseplan_active_project_id', String(acceptData.projectId));
          }
        } catch {}
      }

      // Synchronize in-memory workspace context
      if (reloadWorkspaces) {
        await reloadWorkspaces();
      }
      if (switchWorkspace && acceptData.workspaceId) {
        switchWorkspace(acceptData.workspaceId, acceptData.projectId);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to accept invitation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await rejectProjectInvitation(token);
      setRejectedSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to decline invitation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchAccount = async () => {
    await logout();
    navigate(`/login?redirect=${encodeURIComponent(`/invitations/${token}`)}`, {
      state: { from: { pathname: `/invitations/${token}` } },
    });
  };

  const invitedEmail = invitationData?.invitedEmail?.toLowerCase()?.trim();
  const currentEmail = user?.email?.toLowerCase()?.trim();
  const isEmailMatching = Boolean(
    isAuthenticated && currentEmail && invitedEmail && areEmailsEqual(currentEmail, invitedEmail)
  );
  const isProjectInvitation = Boolean(invitationData?.project || invitationData?.projectName);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] text-[#14121C] dark:text-[#F8F6EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-150">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#5935D6] dark:bg-gradient-to-br dark:from-[#C9B8FF] dark:to-[#FFD6E8] text-white dark:text-[#0B0A0F] shadow-lg shadow-[#5935D6]/20 dark:shadow-[0_0_20px_rgba(201,184,255,0.25)] mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#14121C] dark:text-[#F8F6EF] sm:text-3xl">
          {isProjectInvitation ? 'Project Collaboration' : 'Workspace Collaboration'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#5C576C] dark:text-[#A6A1B5]">
          You have been invited to collaborate on PulsePlan
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#14121C] py-8 px-5 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] sm:rounded-2xl border border-slate-200 dark:border-[#C9B8FF]/20 relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#7C5CFC] via-[#C9B8FF] to-[#FFD6E8]" />

          {/* LOADING STATE */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#5935D6] dark:text-[#C9B8FF]" />
              <p className="text-xs font-medium text-[#5C576C] dark:text-[#A6A1B5]">
                Validating invitation token...
              </p>
            </div>
          )}

          {/* ERROR / EXPIRED / INVALID STATE */}
          {!isLoading && errorMessage && !invitationData && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-1">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F8F6EF]">
                Invitation Inactive or Expired
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A6A1B5] leading-relaxed">
                {errorMessage}
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-slate-800 dark:text-[#F8F6EF] transition-colors"
                >
                  <span>Go to PulsePlan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* ACCEPTED SUCCESS CONFIRMATION */}
          {!isLoading && acceptedSuccess && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8F6EF]">
                Invitation Accepted!
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A6A1B5] leading-relaxed">
                {acceptedSuccess.type === 'project' || acceptedSuccess.projectName ? (
                  <>
                    You have been added to <strong className="text-slate-800 dark:text-[#F8F6EF]">{acceptedSuccess.projectName || invitationData?.project?.name}</strong> as an authorized collaborator.
                  </>
                ) : (
                  <>
                    You have joined <strong className="text-slate-800 dark:text-[#F8F6EF]">{acceptedSuccess.workspaceName || invitationData?.workspace?.name}</strong> as an authorized workspace member.
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => navigate(acceptedSuccess.type === 'project' ? '/projects' : `/workspaces/${acceptedSuccess.workspaceId}`)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all cursor-pointer"
              >
                <span>{acceptedSuccess.type === 'project' ? 'Open Project Board' : 'Open Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* REJECTED CONFIRMATION */}
          {!isLoading && rejectedSuccess && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-[#A6A1B5] mb-1">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F8F6EF]">
                Invitation Declined
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A6A1B5]">
                You have declined the invitation to join {invitationData?.project?.name || invitationData?.workspace?.name}.
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-xs font-semibold text-slate-800 dark:text-[#F8F6EF] transition-colors"
                >
                  <span>Return to Home</span>
                </Link>
              </div>
            </div>
          )}

          {/* ACTIVE INVITATION CARD (Not accepted/rejected yet) */}
          {!isLoading && invitationData && !acceptedSuccess && !rejectedSuccess && (
            <div className="space-y-5">
              {/* Expiration or Status Warning */}
              {invitationData.status !== 'pending' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Notice: This invitation has already been marked as <strong>{invitationData.status}</strong>.
                  </span>
                </div>
              )}

              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Details Box (Project or Workspace) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#100E17] border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-[#C9B8FF] bg-indigo-50 dark:bg-[#C9B8FF]/15 border border-indigo-200 dark:border-[#C9B8FF]/30 px-1.5 py-0.5 rounded uppercase">
                      {isProjectInvitation ? (invitationData.project?.key || 'PROJ') : 'WORKSPACE'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-[#F8F6EF] mt-1.5">
                      {isProjectInvitation
                        ? (invitationData.project?.name || invitationData.projectName)
                        : (invitationData.workspace?.name || invitationData.workspaceName)}
                    </h3>
                  </div>
                  <Badge variant="purple" size="sm">
                    {invitationData.role}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 space-y-1.5 text-xs text-slate-600 dark:text-[#A6A1B5]">
                  <div className="flex justify-between">
                    <span>Workspace:</span>
                    <strong className="text-slate-800 dark:text-[#F8F6EF]">
                      {invitationData.workspace?.name || invitationData.workspaceName}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Invited By:</span>
                    <strong className="text-slate-800 dark:text-[#F8F6EF]">
                      {invitationData.inviter?.name || invitationData.inviterName || 'Team Administrator'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Invited Email:</span>
                    <strong className="text-indigo-600 dark:text-[#C9B8FF] font-mono">
                      {invitedEmail}
                    </strong>
                  </div>
                </div>
              </div>

              {/* IDENTITY CHECK / ACTION BUTTONS */}
              {!isAuthenticated ? (
                /* 1. NOT LOGGED IN */
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-[#1C182A] border border-indigo-100 dark:border-[#C9B8FF]/20 text-xs text-slate-600 dark:text-[#A6A1B5] flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-[#5935D6] dark:text-[#C9B8FF] shrink-0 mt-0.5" />
                    <span>
                      Please log in or sign up with <strong className="text-slate-800 dark:text-[#F8F6EF]">{invitedEmail}</strong> to accept this invitation.
                    </span>
                  </div>

                  <Link
                    to={`/login?redirect=${encodeURIComponent(`/invitations/${token}`)}`}
                    state={{ from: { pathname: `/invitations/${token}` } }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In to Accept</span>
                  </Link>

                  <Link
                    to={`/signup?redirect=${encodeURIComponent(`/invitations/${token}`)}`}
                    state={{ from: { pathname: `/invitations/${token}` } }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-slate-800 dark:text-[#F8F6EF] transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create a New Account</span>
                  </Link>
                </div>
              ) : !isEmailMatching ? (
                /* 2. LOGGED IN WITH WRONG EMAIL */
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Account Mismatch</p>
                      <p>
                        You are currently signed in as <strong className="underline">{currentEmail}</strong>, but this invitation was sent to <strong className="underline">{invitedEmail}</strong>.
                      </p>
                      <p>
                        To protect tenant isolation, you must switch to the account associated with the invitation.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Switch to {invitedEmail}</span>
                  </button>
                </div>
              ) : (
                /* 3. LOGGED IN WITH MATCHING EMAIL */
                <div className="space-y-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Signed in as <strong className="font-mono">{currentEmail}</strong> (Identity verified)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isProcessing || invitationData.status !== 'pending'}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5935D6] hover:bg-[#4828b8] dark:bg-[#C9B8FF] dark:hover:bg-[#ded2ff] text-white dark:text-[#0B0A0F] font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Accepting invitation...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isProjectInvitation
                            ? 'Accept Invitation & Join Project'
                            : 'Accept Invitation & Join Workspace'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isProcessing || invitationData.status !== 'pending'}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-600 dark:text-[#A6A1B5] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span>Decline Invitation</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
