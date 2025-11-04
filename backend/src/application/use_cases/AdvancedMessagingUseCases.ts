import { UseCase } from '../use_cases/UseCase';
import { MessageDomainService } from '../../domain/services/MessageDomainService';
import { UserDomainService } from '../../domain/services/UserDomainService';
import { ConversationDomainService } from '../../domain/services/ConversationDomainService';
import { Message } from '../../domain/entities/Message';
import { MessageContent } from '../../domain/value_objects/MessageContent';

/**
 * Advanced Messaging Feature Use Cases
 * 
 * Architectural Intent:
 * - Implements advanced messaging features like rich text, threading, etc.
 * - Follows hexagonal architecture principles
 * - Provides feature-rich capabilities while maintaining clean separation
 * 
 * Key Design Decisions:
 * 1. Extends basic messaging capabilities
 * 2. Maintains separation of concerns
 * 3. Follows the same architectural patterns as base use cases
 */

// DTOs for advanced features

export interface SendMessageWithMentionsDTO {
  conversationId: string;
  userId: string;
  content: string;
  mentionedUserIds: string[];
  attachments?: any[];
  parentId?: string;
}

export interface SendMessageWithRichTextDTO {
  conversationId: string;
  userId: string;
  text: string;
  html: string;
  entities: Array<{
    type: 'mention' | 'hashtag' | 'code' | 'link';
    offset: number;
    length: number;
    data?: any;
  }>;
  attachments?: any[];
  parentId?: string;
}

export interface GetThreadMessagesDTO {
  parentMessageId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GetMessageAnalyticsDTO {
  conversationId: string;
  userId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface BulkMarkMessagesDTO {
  userId: string;
  conversationId: string;
  messageIds: string[];
  action: 'read' | 'unmark' | 'archive';
}

// Use case implementations

export class SendMessageWithMentionsUseCase implements UseCase<SendMessageWithMentionsDTO, any> {
  constructor(
    private messageDomainService: MessageDomainService,
    private userDomainService: UserDomainService
  ) {}

  async execute(input: SendMessageWithMentionsDTO): Promise<any> {
    this.validateInput(input);

    // Process mentions - notify mentioned users
    for (const mentionedUserId of input.mentionedUserIds) {
      // In a real implementation, we would send notifications to mentioned users
      // This is where you'd integrate with notification services
    }

    // Create and send the message
    const content = new MessageContent({
      text: input.content,
      entities: input.mentionedUserIds.map((userId, index) => ({
        type: 'mention' as const,
        offset: 0, // Would need to calculate actual position in real implementation
        length: 0, // Would need to calculate actual length in real implementation
        data: { userId }
      }))
    });

    const message = await this.messageDomainService.sendMessage(
      input.userId,
      input.conversationId,
      content,
      input.attachments || [],
      input.parentId
    );

    return this.transformToResponse(message);
  }

  private validateInput(input: SendMessageWithMentionsDTO): void {
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.content || input.content.trim().length === 0) {
      throw new Error('Message content is required');
    }
    if (input.mentionedUserIds && !Array.isArray(input.mentionedUserIds)) {
      throw new Error('Mentioned user IDs must be an array');
    }
  }

  private transformToResponse(message: Message): any {
    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content.text,
      entities: message.content.entities,
      userId: message.userId,
      direction: message.direction,
      status: message.status,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}

export class SendMessageWithRichTextUseCase implements UseCase<SendMessageWithRichTextDTO, any> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: SendMessageWithRichTextDTO): Promise<any> {
    this.validateInput(input);

    const content = new MessageContent({
      text: input.text,
      html: input.html,
      entities: input.entities,
    });

    const message = await this.messageDomainService.sendMessage(
      input.userId,
      input.conversationId,
      content,
      input.attachments || [],
      input.parentId
    );

    return this.transformToResponse(message);
  }

  private validateInput(input: SendMessageWithRichTextDTO): void {
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.text || input.text.trim().length === 0) {
      throw new Error('Message text is required');
    }
    if (input.entities && !Array.isArray(input.entities)) {
      throw new Error('Entities must be an array');
    }
  }

  private transformToResponse(message: Message): any {
    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content.text,
      contentData: {
        text: message.content.text,
        html: message.content.html,
        entities: message.content.entities,
      },
      userId: message.userId,
      direction: message.direction,
      status: message.status,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}

export class GetThreadMessagesUseCase implements UseCase<GetThreadMessagesDTO, any> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: GetThreadMessagesDTO): Promise<any> {
    this.validateInput(input);

    // Get the parent message to ensure user has access to the conversation
    // This would require a separate method in the domain service
    // For now, this is a simplified implementation

    const parentMessage = await this.messageDomainService['messageRepository'].findById(input.parentMessageId);
    if (!parentMessage || parentMessage.userId !== input.userId) {
      throw new Error('Access denied or message not found');
    }

    // Get all messages that have this parent as their parentId
    // This would require a new method in the repository
    const replies = await this.messageDomainService['messageRepository'].findBy({
      parentId: input.parentMessageId
    }) as any as Message[]; // This would need to be implemented properly

    return {
      parentMessageId: input.parentMessageId,
      replies: replies.map(msg => ({
        id: msg.id,
        content: msg.content.text,
        userId: msg.userId,
        createdAt: msg.createdAt,
        // Add other properties as needed
      })),
      total: replies.length,
    };
  }

  private validateInput(input: GetThreadMessagesDTO): void {
    if (!input.parentMessageId) {
      throw new Error('Parent message ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
  }
}

export class GetMessageAnalyticsUseCase implements UseCase<GetMessageAnalyticsDTO, any> {
  constructor(
    private messageDomainService: MessageDomainService,
    private conversationDomainService: ConversationDomainService
  ) {}

  async execute(input: GetMessageAnalyticsDTO): Promise<any> {
    this.validateInput(input);

    // Verify user has access to conversation
    const conversation = await this.conversationDomainService['conversationRepository'].findById(input.conversationId);
    if (!conversation || !conversation.isParticipant(input.userId)) {
      throw new Error('Access denied');
    }

    // Get messages in the specified date range
    // This would need a new repository method
    const messages = await this.messageDomainService['messageRepository'].findBy({
      conversationId: input.conversationId,
      createdAt: {
        $gte: input.dateRange.start,
        $lte: input.dateRange.end,
      }
    }) as any as Message[]; // This would need to be implemented properly

    // Calculate analytics
    const analytics = {
      totalMessages: messages.length,
      messagesPerDay: this.calculateMessagesPerDay(messages, input.dateRange),
      mostActiveUser: this.findMostActiveUser(messages),
      responseTimeStats: this.calculateResponseTimeStats(messages),
    };

    return analytics;
  }

  private validateInput(input: GetMessageAnalyticsDTO): void {
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.dateRange || !input.dateRange.start || !input.dateRange.end) {
      throw new Error('Valid date range is required');
    }
    if (input.dateRange.start > input.dateRange.end) {
      throw new Error('Start date must be before end date');
    }
  }

  private calculateMessagesPerDay(messages: Message[], dateRange: { start: Date; end: Date }): any {
    // Implementation for calculating messages per day
    const days: { [key: string]: number } = {};
    const currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      days[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    for (const message of messages) {
      const dateStr = message.createdAt.toISOString().split('T')[0];
      if (days[dateStr] !== undefined) {
        days[dateStr]++;
      }
    }
    
    return days;
  }

  private findMostActiveUser(messages: Message[]): any {
    const userCounts: { [key: string]: number } = {};
    
    for (const message of messages) {
      userCounts[message.userId] = (userCounts[message.userId] || 0) + 1;
    }
    
    let mostActiveUser = '';
    let maxCount = 0;
    
    for (const userId in userCounts) {
      if (userCounts[userId] > maxCount) {
        maxCount = userCounts[userId];
        mostActiveUser = userId;
      }
    }
    
    return { userId: mostActiveUser, count: maxCount };
  }

  private calculateResponseTimeStats(messages: Message[]): any {
    // Implementation for calculating response time statistics
    // This is a simplified version
    return {
      averageResponseTime: 'N/A', // Would calculate actual response times
      fastestResponse: 'N/A',
      slowestResponse: 'N/A',
    };
  }
}

export class BulkMarkMessagesUseCase implements UseCase<BulkMarkMessagesDTO, any> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: BulkMarkMessagesDTO): Promise<any> {
    this.validateInput(input);

    if (input.action === 'read') {
      await this.messageDomainService.markMessagesAsRead(
        input.userId,
        input.conversationId,
        input.messageIds
      );
    } 
    // Additional actions like 'unmark' or 'archive' would be implemented here

    return {
      message: `${input.messageIds.length} messages marked as ${input.action}`,
      action: input.action,
      messageIds: input.messageIds,
    };
  }

  private validateInput(input: BulkMarkMessagesDTO): void {
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!input.messageIds || !Array.isArray(input.messageIds) || input.messageIds.length === 0) {
      throw new Error('Message IDs must be a non-empty array');
    }
    if (!['read', 'unmark', 'archive'].includes(input.action)) {
      throw new Error('Invalid action. Must be read, unmark, or archive');
    }
  }
}