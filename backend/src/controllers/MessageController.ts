import { Request, Response } from 'express';
import { MessageService } from '@services/MessageService';
import { asyncHandler } from '@middleware/errorHandler';

const messageService = new MessageService();

export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await messageService.createMessage(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { limit, offset } = req.query;

  const { messages, total } = await messageService.getConversationMessages(
    conversationId,
    req.userId!,
    {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    }
  );

  res.status(200).json({
    success: true,
    data: { messages, total },
    timestamp: new Date(),
  });
});

export const getMessage = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const message = await messageService.getMessageById(messageId, req.userId!);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found',
      code: 'MESSAGE_NOT_FOUND',
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const message = await messageService.markMessageAsRead(messageId, req.userId!);

  res.status(200).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});

export const markConversationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  await messageService.markConversationMessagesAsRead(conversationId, req.userId!);

  res.status(200).json({
    success: true,
    data: { message: 'All messages marked as read' },
    timestamp: new Date(),
  });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  await messageService.deleteMessage(messageId, req.userId!);

  res.status(200).json({
    success: true,
    data: { message: 'Message deleted successfully' },
    timestamp: new Date(),
  });
});

export const updateMessageStatus = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { status } = req.body;

  const message = await messageService.updateMessageStatus(messageId, req.userId!, status);

  res.status(200).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});

export const searchMessages = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  const messages = await messageService.searchMessages(req.userId!, query as string);

  res.status(200).json({
    success: true,
    data: { messages },
    timestamp: new Date(),
  });
});
