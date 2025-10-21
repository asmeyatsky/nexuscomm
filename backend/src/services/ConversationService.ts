import { AppDataSource } from '@config/database';
import { Conversation } from '@models/Conversation';
import { AppError } from '@middleware/errorHandler';
import { In } from 'typeorm';

export class ConversationService {
  private conversationRepository = AppDataSource.getRepository(Conversation);

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    data: {
      participantIds: string[];
      participantNames: string[];
      participantAvatars?: string[];
      channels: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<Conversation> {
    // Check if conversation already exists
    const existing = await this.conversationRepository.findOne({
      where: {
        userId,
        participantIds: data.participantIds.sort().join(','), // Simple check
      },
    });

    if (existing) {
      return existing;
    }

    const conversation = this.conversationRepository.create({
      userId,
      participantIds: data.participantIds,
      participantNames: data.participantNames,
      participantAvatars: data.participantAvatars || [],
      channels: data.channels,
      unreadCount: 0,
      metadata: data.metadata || {},
    });

    return this.conversationRepository.save(conversation);
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string,
    options?: {
      archived?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const query = this.conversationRepository
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId });

    if (options?.archived !== undefined) {
      query.andWhere('c.isArchived = :archived', { archived: options.archived });
    }

    const total = await query.getCount();

    const conversations = await query
      .orderBy('c.lastMessageTimestamp', 'DESC')
      .limit(options?.limit || 50)
      .offset(options?.offset || 0)
      .getMany();

    return { conversations, total };
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId, userId },
      relations: ['messages'],
    });
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    Object.assign(conversation, updates);
    return this.conversationRepository.save(conversation);
  }

  /**
   * Update last message in conversation
   */
  async updateLastMessage(
    conversationId: string,
    userId: string,
    data: {
      message: string;
      direction: 'inbound' | 'outbound';
    }
  ): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    conversation.lastMessage = data.message;
    conversation.lastMessageTimestamp = new Date();
    conversation.lastMessageDirection = data.direction;

    return this.conversationRepository.save(conversation);
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    conversation.unreadCount = 0;
    return this.conversationRepository.save(conversation);
  }

  /**
   * Archive/Unarchive conversation
   */
  async toggleArchive(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    conversation.isArchived = !conversation.isArchived;
    return this.conversationRepository.save(conversation);
  }

  /**
   * Pin/Unpin conversation
   */
  async togglePin(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    conversation.isPinned = !conversation.isPinned;
    return this.conversationRepository.save(conversation);
  }

  /**
   * Mute/Unmute conversation
   */
  async toggleMute(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    conversation.isMuted = !conversation.isMuted;
    return this.conversationRepository.save(conversation);
  }

  /**
   * Search conversations
   */
  async searchConversations(userId: string, query: string): Promise<Conversation[]> {
    return this.conversationRepository
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .andWhere(
        'c.participantNames ILIKE :query OR c.lastMessage ILIKE :query',
        { query: `%${query}%` }
      )
      .orderBy('c.lastMessageTimestamp', 'DESC')
      .take(20)
      .getMany();
  }
}
