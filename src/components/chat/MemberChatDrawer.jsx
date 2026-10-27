import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { X, Send, MessageSquare, Loader2, Clock, CheckCheck } from 'lucide-react';

/**
 * MemberChatDrawer Component
 * 
 * Direct 1-on-1 real-time chat with a workspace member.
 * Features:
 * - Direct messaging scoped to active tenant workspace
 * - Auto-polling every 3.5s for incoming replies
 * - Optimistic UI sending with automatic scroll-to-bottom
 */
export default function MemberChatDrawer({ isOpen, onClose, member }) {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const workspaceId = activeWorkspace?._id || activeWorkspace?.id;
  const currentEmail = user?.email?.toLowerCase();
  const recipientEmail = member?.email?.toLowerCase();

  // Scroll smoothly to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages from backend
  const loadMessages = async (showLoadingSpinner = false) => {
    if (!workspaceId || !recipientEmail) return;
    if (showLoadingSpinner) setIsLoading(true);

    try {
      const data = await api.getWorkspaceMessages(workspaceId, recipientEmail);
      setMessages(data || []);
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err);
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  // Initial load when opened or member changes
  useEffect(() => {
    if (isOpen && member) {
      loadMessages(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setMessages([]);
      setInputText('');
    }
  }, [isOpen, member?.email, workspaceId]);

  // Polling interval (every 3.5s while chat drawer is open)
  useEffect(() => {
    if (!isOpen || !recipientEmail) return;

    const interval = setInterval(() => {
      loadMessages(false);
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, recipientEmail, workspaceId]);

  // Scroll whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !workspaceId) return;

    const optimisticMessage = {
      _id: 'temp-' + Date.now(),
      sender: {
        userId: user?._id || user?.id,
        name: user?.name || 'You',
        email: currentEmail,
        avatar: user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'),
      },
      recipient: {
        email: recipientEmail,
        name: member?.name,
        avatar: member?.avatar,
      },
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const savedMessage = await api.sendWorkspaceMessage(workspaceId, {
        content: trimmed,
        recipientEmail: member.email,
        recipientName: member.name,
        recipientAvatar: member.avatar,
      });

      // Replace optimistic temp with MongoDB saved message
      setMessages((prev) =>
        prev.map((m) => (m._id === optimisticMessage._id ? savedMessage : m))
      );
    } catch (error) {
      console.error('[Chat] Failed to deliver message:', error);
      // Remove optimistic message if sending failed
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMessage._id));
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              name={member.name}
              initials={member.avatar}
              status={member.status === 'Active' ? 'online' : 'offline'}
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {member.name}
                </h3>
                <Badge variant={member.role === 'Owner' ? 'purple' : member.role === 'Admin' ? 'primary' : 'neutral'} size="xs">
                  {member.role}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {member.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-600" />
              <p className="text-xs">Loading message history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                Direct Message with {member.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                No messages yet. Send a greeting to start collaborating on {activeWorkspace?.name || 'this workspace'}.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine =
                msg.sender?.email?.toLowerCase() === currentEmail ||
                msg.sender?.userId?.toString() === user?._id?.toString() ||
                msg.sender?.userId?.toString() === user?.id?.toString();

              const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <Avatar
                      name={msg.sender?.name || member.name}
                      initials={msg.sender?.avatar || member.avatar}
                      size="xs"
                    />
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-2xs text-xs leading-relaxed ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isMine ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{formattedTime}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${member.name.split(' ')[0]}...`}
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            maxLength={2000}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            title="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </aside>
    </>
  );
}
