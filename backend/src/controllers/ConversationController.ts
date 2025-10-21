import { Request, Response } from 'express';
import { ConversationService } from '@services/ConversationService';
import { asyncHandler } from '@middleware/errorHandler';

const conversationService = new ConversationService();

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await conversationService.createConversation(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: { conversation },
    timestamp: new Date(),
  });
});

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const { archived, limit, offset } = req.query;

  const { conversations, total } = await conversationService.getUserConversations(req.userId!, {
    archived: archived === 'true',
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0,
  });

  res.status(200).json({
    success: true,
    data: { conversations, total },
    timestamp: new Date(),
  });
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const conversation = await conversationService.getConversationById(conversationId, req.userId!);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found',
      code: 'CONVERSATION_NOT_FOUND',
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    data: { conversation },
    timestamp: new Date(),
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const conversation = await conversationService.markConversationAsRead(conversationId, req.userId!);

  res.status(200).json({
    success: true,
    data: { conversation },
    timestamp: new Date(),
  });
});

export const toggleArchive = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const conversation = await conversationService.toggleArchive(conversationId, req.userId!);

  res.status(200).json({
    success: true,
    data: { conversation },
    timestamp: new Date(),
  });
});

export const togglePin = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const conversation = await conversationService.togglePin(conversationId, req.userId!);

  res.status(200).json({
    success: true,
    data: { conversation },
    timestamp: new Date(),
  });
});

export const toggleMute = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const conversation = await conversationService.toggleMute(conversationId, req.userId!);

  res.status(200).json({
    success: true,
    data: { conversation },
    timestamp: new Date(),
  });
});

export const searchConversations = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  const conversations = await conversationService.searchConversations(req.userId!, query as string);

  res.status(200).json({
    success: true,
    data: { conversations },
    timestamp: new Date(),
  });
});
