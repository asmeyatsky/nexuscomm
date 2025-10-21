import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { AppError } from '@middleware/errorHandler';

export class MessageService {
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);

  /**
   * Create a new message
   */
  async createMessage(
    userId: string,
    data: {
      conversationId: string;
      content: string;
      channelType: string;
      direction: 'inbound' | 'outbound';
      senderExternalId: string;
      senderName: string;
      senderAvatar?: string;
      externalId: string;
      externalThreadId?: string;
      mediaUrls?: string[];
      senderAccountId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Message> {
    // Verify conversation belongs to user
    const conversation = await this.conversationRepository.findOne({
      where: { id: data.conversationId, userId },
    });

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    const message = this.messageRepository.create({
      userId,
      conversationId: data.conversationId,
      content: data.content,
      channelType: data.channelType,
      direction: data.direction,
      senderExternalId: data.senderExternalId,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      externalId: data.externalId,
      externalThreadId: data.externalThreadId,
      mediaUrls: data.mediaUrls || [],
      senderAccountId: data.senderAccountId,
      metadata: data.metadata || {},
      status: data.direction === 'outbound' ? 'sent' : 'delivered',
      isRead: data.direction === 'outbound', // Outbound messages are read by default
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation
    await this.conversationRepository.update(
      { id: data.conversationId },
      {
        lastMessage: data.content,
        lastMessageTimestamp: new Date(),
        lastMessageDirection: data.direction,
        ...(data.direction === 'inbound' && { unreadCount: conversation.unreadCount + 1 }),
      }
    );

    return savedMessage;
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ messages: Message[]; total: number }> {
    // Verify conversation belongs to user
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    const query = this.messageRepository
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId });

    const total = await query.getCount();

    const messages = await query
      .orderBy('m.createdAt', 'DESC')
      .limit(options?.limit || 50)
      .offset(options?.offset || 0)
      .getMany();

    return { messages: messages.reverse(), total };
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, userId },
    });

    if (!message) {
      throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await this.messageRepository.save(message);
    }

    return message;
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await this.messageRepository.update(
      { conversationId, userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string, userId: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id: messageId, userId },
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.getMessageById(messageId, userId);

    if (!message) {
      throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
    }

    // Only allow deletion of outbound messages
    if (message.direction !== 'outbound') {
      throw new AppError(403, 'Can only delete outbound messages', 'CANNOT_DELETE_MESSAGE');
    }

    await this.messageRepository.remove(message);
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    messageId: string,
    userId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<Message> {
    const message = await this.getMessageById(messageId, userId);

    if (!message) {
      throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
    }

    message.status = status;

    if (status === 'read' && !message.readAt) {
      message.readAt = new Date();
    }

    return this.messageRepository.save(message);
  }

  /**
   * Search messages
   */
  async searchMessages(userId: string, query: string): Promise<Message[]> {
    return this.messageRepository
      .createQueryBuilder('m')
      .where('m.userId = :userId', { userId })
      .andWhere('m.content ILIKE :query', { query: `%${query}%` })
      .orderBy('m.createdAt', 'DESC')
      .take(50)
      .getMany();
  }
}
