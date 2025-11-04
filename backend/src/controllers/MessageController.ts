import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import diConfig from '@infrastructure/config/DependencyInjectionConfig';
import { CreateMessageDTO, GetMessageHistoryDTO, DeleteMessageDTO, SearchMessageDTO, GetMessageByIdDTO, MarkMessagesAsReadDTO } from '@application/dtos/MessageDTOs';

export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  const createMessageUseCase = diConfig.getCreateMessageUseCase();
  
  const createMessageDTO: CreateMessageDTO = {
    conversationId: req.body.conversationId,
    userId: req.userId!,
    content: req.body.content,
    html: req.body.html,
    entities: req.body.entities,
    attachments: req.body.attachments,
    parentId: req.body.parentId,
    channelType: req.body.channelType || 'internal',
  };

  const message = await createMessageUseCase.execute(createMessageDTO);

  res.status(201).json({
    success: true,
    data: { message },
    timestamp: new Date(),
  });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { limit, offset } = req.query;

  const getMessageHistoryDTO: GetMessageHistoryDTO = {
    conversationId,
    userId: req.userId!,
    limit: limit ? parseInt(limit as string, 10) : 50,
    offset: offset ? parseInt(offset as string, 10) : 0,
  };

  const getMessageHistoryUseCase = diConfig.getGetMessageHistoryUseCase();
  const result = await getMessageHistoryUseCase.execute(getMessageHistoryDTO);

  res.status(200).json({
    success: true,
    data: result,
    timestamp: new Date(),
  });
});

export const getMessage = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  
  const getMessageByIdDTO: GetMessageByIdDTO = {
    messageId,
    userId: req.userId!,
  };

  const getMessageByIdUseCase = diConfig.getGetMessageByIdUseCase();
  const message = await getMessageByIdUseCase.execute(getMessageByIdDTO);

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
  
  // Use the new use case to mark individual message as read
  const markIndividualMessageAsReadUseCase = diConfig.getMarkIndividualMessageAsReadUseCase();
  await markIndividualMessageAsReadUseCase.execute({
    messageId,
    userId: req.userId!,
  });

  res.status(200).json({
    success: true,
    data: { message: 'Message marked as read' },
    timestamp: new Date(),
  });
});

export const markConversationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  
  const markMessagesAsReadDTO: MarkMessagesAsReadDTO = {
    userId: req.userId!,
    conversationId,
    messageIds: [], // Empty array means mark all messages in conversation
  };

  const markMessagesAsReadUseCase = diConfig.getMarkMessagesAsReadUseCase();
  await markMessagesAsReadUseCase.execute(markMessagesAsReadDTO);

  res.status(200).json({
    success: true,
    data: { message: 'All messages marked as read' },
    timestamp: new Date(),
  });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const deleteMessageDTO: DeleteMessageDTO = {
    messageId,
    userId: req.userId!,
  };

  const deleteMessageUseCase = diConfig.getDeleteMessageUseCase();
  await deleteMessageUseCase.execute(deleteMessageDTO);

  res.status(200).json({
    success: true,
    data: { message: 'Message deleted successfully' },
    timestamp: new Date(),
  });
});

export const updateMessageStatus = asyncHandler(async (req: Request, res: Response) => {
  // Message status is typically handled automatically, not through an API
  // This would be handled by internal processes or channel adapters
  res.status(501).json({
    success: false,
    error: 'Method not implemented in this refactored version',
    code: 'NOT_IMPLEMENTED',
    timestamp: new Date(),
  });
});

export const searchMessages = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { query } = req.query;
  
  const searchMessageDTO: SearchMessageDTO = {
    conversationId,
    searchTerm: query as string || '',
    userId: req.userId!,
  };

  const searchMessagesUseCase = diConfig.getSearchMessagesUseCase();
  const result = await searchMessagesUseCase.execute(searchMessageDTO);

  res.status(200).json({
    success: true,
    data: result,
    timestamp: new Date(),
  });
});
