import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { VoiceProcessingService } from '@services/VoiceProcessingService';
import { EmailProcessingService } from '@services/EmailProcessingService';
import { MessageService } from '@services/MessageService';

const voiceProcessingService = new VoiceProcessingService();
const emailProcessingService = new EmailProcessingService();
const messageService = new MessageService();

export const processVoiceMessage = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, voiceContent, targetPlatform, mediaUrls } = req.body;

  if (!conversationId || !voiceContent) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID and voice content are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  const message = await voiceProcessingService.processVoiceMessage(
    req.userId!,
    conversationId,
    voiceContent,
    { targetPlatform, mediaUrls }
  );

  res.status(201).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});

export const processEmailMessage = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, emailData } = req.body;

  if (!conversationId || !emailData || !emailData.body) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID and email data with body are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  const message = await emailProcessingService.processEmailMessage(
    req.userId!,
    conversationId,
    emailData
  );

  res.status(201).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});

export const processEmailResponse = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, emailResponse, targetPlatform, mediaUrls } = req.body;

  if (!conversationId || !emailResponse) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID and email response are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  const message = await emailProcessingService.processEmailResponse(
    req.userId!,
    conversationId,
    emailResponse,
    { targetPlatform, mediaUrls }
  );

  res.status(201).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});

// Also update the standard message creation to support automatic platform selection
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, content, channelType, mediaUrls, autoSelectPlatform } = req.body;

  if (!conversationId || !content) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID and content are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  // If auto-select platform is requested, use the conversation service to determine the best platform
  let finalChannelType = channelType;
  if (autoSelectPlatform) {
    // For auto-platform selection, we'll need to fetch conversation details
    const conversation = await messageService['conversationRepository'].findOne({
      where: { id: conversationId, userId: req.userId! },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    // Determine the best platform based on available accounts and conversation channels
    finalChannelType = 'whatsapp'; // Default, can be made more sophisticated
    
    // This is a simplified version - in a real implementation, we'd have a more sophisticated
    // platform selection algorithm that considers user's connected accounts
  }

  const message = await messageService.createMessage(req.userId!, {
    conversationId,
    content,
    channelType: finalChannelType || 'whatsapp', // Default to whatsapp if not specified
    direction: 'outbound',
    senderExternalId: req.userId!,
    senderName: 'User', // Would be replaced with actual user name
    externalId: `msg-${Date.now()}`,
    mediaUrls: mediaUrls || [],
    metadata: {
      source: req.body.source || 'app',
      autoSelectedPlatform: autoSelectPlatform
    }
  });

  res.status(201).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});