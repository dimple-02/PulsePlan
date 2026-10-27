import { Message } from '../models/Message.js';
import { Workspace } from '../models/Workspace.js';

/**
 * Message Controller
 * Handles direct messaging between members and workspace team chat.
 */

// GET /api/workspaces/:id/messages
export async function getMessages(req, res, next) {
  try {
    const { id: workspaceId } = req.params;
    const { recipientEmail } = req.query;

    // Verify workspace access
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.',
      });
    }

    const userEmail = req.user.email.toLowerCase();

    let query = { workspaceId };

    if (recipientEmail) {
      const otherEmail = recipientEmail.toLowerCase().trim();
      // 1-on-1 direct messages between current user and specified recipient
      query.$or = [
        { 'sender.email': userEmail, 'recipient.email': otherEmail },
        { 'sender.email': otherEmail, 'recipient.email': userEmail },
      ];
    } else {
      // General workspace team channel messages
      query.$or = [
        { recipient: null },
        { 'recipient.email': { $exists: false } },
      ];
    }

    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(200);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/workspaces/:id/messages
export async function sendMessage(req, res, next) {
  try {
    const { id: workspaceId } = req.params;
    const { content, recipientEmail, recipientName, recipientAvatar } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required.',
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.',
      });
    }

    let recipientData = null;
    if (recipientEmail) {
      const normalizedRecipient = recipientEmail.toLowerCase().trim();
      // Verify recipient exists in this workspace
      const targetMember = workspace.members.find(
        (m) => m.email.toLowerCase() === normalizedRecipient
      );

      recipientData = {
        name: recipientName || targetMember?.name || recipientEmail,
        email: normalizedRecipient,
        avatar: recipientAvatar || targetMember?.avatar || 'U',
        userId: targetMember?.userId,
      };
    }

    const message = await Message.create({
      workspaceId,
      sender: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email.toLowerCase(),
        avatar: req.user.avatar || req.user.name.slice(0, 2).toUpperCase(),
      },
      recipient: recipientData,
      content: content.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: message,
    });
  } catch (error) {
    next(error);
  }
}
