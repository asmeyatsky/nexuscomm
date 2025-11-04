import { UseCase } from '../use_cases/UseCase';
import { MessageDomainService } from '../../domain/services/MessageDomainService';
import { ConversationDomainService } from '../../domain/services/ConversationDomainService';
import { Message } from '../../domain/entities/Message';
import { MessageContent } from '../../domain/value_objects/MessageContent';

/**
 * Search and Intelligence Feature Use Cases
 * 
 * Architectural Intent:
 * - Implements advanced search and intelligence features
 * - Provides sophisticated search capabilities beyond basic text search
 * - Follows hexagonal architecture principles
 * 
 * Key Design Decisions:
 * 1. Implements complex search operations
 * 2. Provides analytics and intelligence features
 * 3. Maintains separation of concerns
 */

// DTOs for search and intelligence features

export interface AdvancedSearchDTO {
  userId: string;
  searchTerm: string;
  filters?: {
    conversationId?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    senderIds?: string[];
    channelTypes?: string[];
    hasAttachments?: boolean;
    isUnread?: boolean;
  };
  limit?: number;
  offset?: number;
}

export interface GetMessageContextDTO {
  messageId: string;
  userId: string;
  contextSize?: number; // Number of messages before and after
}

export interface GetConversationInsightsDTO {
  conversationId: string;
  userId: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface GetMessageTrendsDTO {
  userId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  granularity?: 'day' | 'week' | 'month';
}

// Use case implementations

export class AdvancedMessageSearchUseCase implements UseCase<AdvancedSearchDTO, any> {
  constructor(
    private messageDomainService: MessageDomainService,
    private conversationDomainService: ConversationDomainService
  ) {}

  async execute(input: AdvancedSearchDTO): Promise<any> {
    this.validateInput(input);

    // Verify user has access to the specified conversation if provided
    if (input.filters?.conversationId) {
      const conversation = await this.conversationDomainService['conversationRepository']
        .findById(input.filters.conversationId);
      
      if (!conversation || !conversation.isParticipant(input.userId)) {
        throw new Error('Access denied to conversation');
      }
    }

    // In a real implementation, this would interface with Elasticsearch
    // For now, we'll simulate using the message repository
    let messages: Message[] = [];
    
    if (input.filters?.conversationId) {
      // Search within a specific conversation
      messages = await this.messageDomainService['messageRepository']
        .findByConversationId(input.filters.conversationId);
    } else {
      // Search across all conversations for the user
      messages = await this.messageDomainService['messageRepository']
        .findByUserId(input.userId);
    }

    // Apply search term filter
    if (input.searchTerm) {
      const searchTerm = input.searchTerm.toLowerCase();
      messages = messages.filter(msg => 
        msg.content.text.toLowerCase().includes(searchTerm) ||
        (msg.content.html && msg.content.html.toLowerCase().includes(searchTerm))
      );
    }

    // Apply additional filters
    if (input.filters) {
      messages = this.applyFilters(messages, input.filters);
    }

    // Sort by date (most recent first)
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const total = messages.length;
    const start = input.offset || 0;
    const end = start + (input.limit || 50);
    const pagedMessages = messages.slice(start, end);

    return {
      messages: pagedMessages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        content: msg.content.text,
        contentData: {
          text: msg.content.text,
          html: msg.content.html,
          entities: msg.content.entities,
        },
        userId: msg.userId,
        senderName: msg.senderName,
        channelType: msg.channelType,
        direction: msg.direction,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
        attachments: msg.attachments,
        reactions: msg.reactions,
      })),
      total,
      limit: input.limit || 50,
      offset: input.offset || 0,
    };
  }

  private validateInput(input: AdvancedSearchDTO): void {
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.searchTerm || input.searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }
    if (input.limit && (input.limit <= 0 || input.limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (input.offset && input.offset < 0) {
      throw new Error('Offset must be non-negative');
    }
  }

  private applyFilters(messages: Message[], filters: AdvancedSearchDTO['filters']): Message[] {
    if (!filters) return messages;

    return messages.filter(message => {
      // Filter by date range
      if (filters.dateRange) {
        if (message.createdAt < filters.dateRange.start || 
            message.createdAt > filters.dateRange.end) {
          return false;
        }
      }

      // Filter by sender IDs
      if (filters.senderIds && filters.senderIds.length > 0) {
        if (!filters.senderIds.includes(message.userId)) {
          return false;
        }
      }

      // Filter by channel types
      if (filters.channelTypes && filters.channelTypes.length > 0) {
        if (!filters.channelTypes.includes(message.channelType)) {
          return false;
        }
      }

      // Filter by attachments
      if (filters.hasAttachments !== undefined) {
        if (filters.hasAttachments && message.attachments.length === 0) {
          return false;
        } else if (!filters.hasAttachments && message.attachments.length > 0) {
          return false;
        }
      }

      // Filter by read status
      if (filters.isUnread !== undefined) {
        if (filters.isUnread && message.isRead) {
          return false;
        } else if (!filters.isUnread && !message.isRead) {
          return false;
        }
      }

      return true;
    });
  }
}

export class GetMessageContextUseCase implements UseCase<GetMessageContextDTO, any> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: GetMessageContextDTO): Promise<any> {
    this.validateInput(input);

    // Find the target message
    const targetMessage = await this.messageDomainService['messageRepository']
      .findById(input.messageId);
    
    if (!targetMessage) {
      throw new Error('Message not found');
    }

    // For a real implementation, we'd need to get the conversation ID
    // and then fetch related messages. This is simplified for demonstration
    const contextSize = input.contextSize || 5;
    
    // In a real implementation, we'd fetch messages around the target message
    // This would require additional repository methods for proper implementation
    return {
      targetMessage: {
        id: targetMessage.id,
        content: targetMessage.content.text,
        senderName: targetMessage.senderName,
        createdAt: targetMessage.createdAt,
      },
      contextBefore: [], // Would contain messages before the target
      contextAfter: [],  // Would contain messages after the target
    };
  }

  private validateInput(input: GetMessageContextDTO): void {
    if (!input.messageId) {
      throw new Error('Message ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (input.contextSize && input.contextSize < 0) {
      throw new Error('Context size must be non-negative');
    }
  }
}

export class GetConversationInsightsUseCase implements UseCase<GetConversationInsightsDTO, any> {
  constructor(
    private messageDomainService: MessageDomainService,
    private conversationDomainService: ConversationDomainService
  ) {}

  async execute(input: GetConversationInsightsDTO): Promise<any> {
    this.validateInput(input);

    // Verify user has access to the conversation
    const conversation = await this.conversationDomainService['conversationRepository']
      .findById(input.conversationId);
    
    if (!conversation || !conversation.isParticipant(input.userId)) {
      throw new Error('Access denied to conversation');
    }

    // Get messages for the conversation
    const { messages } = await this.messageDomainService.getConversationHistory(
      input.conversationId,
      input.userId,
      1000  // Get all messages for analytics
    );

    // Calculate insights
    const insights = {
      totalMessages: messages.length,
      activeParticipants: this.calculateActiveParticipants(messages),
      peakActivityTime: this.calculatePeakActivityTime(messages),
      messageTypes: this.calculateMessageTypes(messages),
      topChatters: this.calculateTopChatters(messages),
      engagementMetrics: this.calculateEngagementMetrics(messages),
      sentimentTrends: this.calculateSentimentTrends(messages),
    };

    return insights;
  }

  private validateInput(input: GetConversationInsightsDTO): void {
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
  }

  private calculateActiveParticipants(messages: Message[]): any {
    const participantCounts: { [key: string]: number } = {};
    
    for (const message of messages) {
      participantCounts[message.userId] = (participantCounts[message.userId] || 0) + 1;
    }
    
    const entries = Object.entries(participantCounts);
    entries.sort((a, b) => b[1] - a[1]); // Sort by count, descending
    
    return {
      count: entries.length,
      topParticipants: entries.slice(0, 5).map(([userId, count]) => ({ userId, count }))
    };
  }

  private calculatePeakActivityTime(messages: Message[]): any {
    const hourCounts: { [key: string]: number } = {};
    
    for (const message of messages) {
      const hour = message.createdAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    
    let peakHour = 0;
    let maxCount = 0;
    
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (Number(count) > maxCount) {
        maxCount = Number(count);
        peakHour = Number(hour);
      }
    }
    
    return {
      hour: peakHour,
      count: maxCount,
      timeOfDay: peakHour < 12 ? 'Morning' : peakHour < 17 ? 'Afternoon' : 'Evening'
    };
  }

  private calculateMessageTypes(messages: Message[]): any {
    const typeCounts = {
      text: 0,
      withAttachments: 0,
      withReactions: 0,
      replies: 0,
      edited: 0
    };
    
    for (const message of messages) {
      typeCounts.text++;
      
      if (message.attachments.length > 0) {
        typeCounts.withAttachments++;
      }
      
      if (message.reactions.length > 0) {
        typeCounts.withReactions++;
      }
      
      if (message.parentId) {
        typeCounts.replies++;
      }
      
      if (message.isEdited) {
        typeCounts.edited++;
      }
    }
    
    return typeCounts;
  }

  private calculateTopChatters(messages: Message[]): any {
    const userCounts: { [key: string]: number } = {};
    
    for (const message of messages) {
      userCounts[message.userId] = (userCounts[message.userId] || 0) + 1;
    }
    
    const entries = Object.entries(userCounts);
    entries.sort((a, b) => b[1] - a[1]); // Sort by count, descending
    
    return entries.slice(0, 5).map(([userId, count]) => ({ userId, count }));
  }

  private calculateEngagementMetrics(messages: Message[]): any {
    const metrics = {
      totalReactions: 0,
      reactionRate: 0,
      replyRate: 0,
      readRate: 0
    };
    
    for (const message of messages) {
      metrics.totalReactions += message.reactions.length;
      
      if (message.reactions.length > 0) {
        metrics.reactionRate++;
      }
      
      if (message.parentId) {
        metrics.replyRate++;
      }
      
      if (message.isRead) {
        metrics.readRate++;
      }
    }
    
    metrics.reactionRate = messages.length > 0 ? metrics.reactionRate / messages.length : 0;
    metrics.replyRate = messages.length > 0 ? metrics.replyRate / messages.length : 0;
    metrics.readRate = messages.length > 0 ? metrics.readRate / messages.length : 0;
    
    return metrics;
  }

  private calculateSentimentTrends(messages: Message[]): any {
    // Simplified sentiment analysis - in reality, this would use AI/ML
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    // This is a very basic implementation - real sentiment analysis would use AI
    for (const message of messages) {
      const text = message.content.text.toLowerCase();
      
      if (text.includes('good') || text.includes('great') || text.includes('love')) {
        sentimentCounts.positive++;
      } else if (text.includes('bad') || text.includes('terrible') || text.includes('hate')) {
        sentimentCounts.negative++;
      } else {
        sentimentCounts.neutral++;
      }
    }
    
    return sentimentCounts;
  }
}

export class GetMessageTrendsUseCase implements UseCase<GetMessageTrendsDTO, any> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: GetMessageTrendsDTO): Promise<any> {
    this.validateInput(input);

    // Get all messages for the user within the date range
    // This would require a repository method that supports date filtering
    // For now, we'll use a simplified approach

    // In a real implementation, this would aggregate data by time periods
    // and provide trend analysis
    return {
      trends: {
        messagesPerDay: this.generateTimeSeriesData(input),
        channelUsage: this.getChannelUsageTrends(input),
        peakActivity: this.getPeakActivityTrends(input),
      },
      summary: {
        totalMessages: 0, // Would be calculated from the actual data
        trendDirection: 'neutral', // Would be calculated from the data
      }
    };
  }

  private validateInput(input: GetMessageTrendsDTO): void {
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.dateRange || !input.dateRange.start || !input.dateRange.end) {
      throw new Error('Valid date range is required');
    }
    if (input.dateRange.start > input.dateRange.end) {
      throw new Error('Start date must be before end date');
    }
    if (input.granularity && !['day', 'week', 'month'].includes(input.granularity)) {
      throw new Error('Granularity must be day, week, or month');
    }
  }

  private generateTimeSeriesData(input: GetMessageTrendsDTO): any {
    // Generate placeholder data for time series
    const data = [];
    const currentDate = new Date(input.dateRange.start);
    const endDate = new Date(input.dateRange.end);
    
    while (currentDate <= endDate) {
      data.push({
        date: currentDate.toISOString().split('T')[0],
        messageCount: Math.floor(Math.random() * 20) // Random placeholder data
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }

  private getChannelUsageTrends(input: GetMessageTrendsDTO): any {
    // Placeholder for channel usage trends
    return {
      whatsapp: Math.floor(Math.random() * 30),
      email: Math.floor(Math.random() * 25),
      sms: Math.floor(Math.random() * 15),
      internal: Math.floor(Math.random() * 30)
    };
  }

  private getPeakActivityTrends(input: GetMessageTrendsDTO): any {
    // Placeholder for peak activity trends
    return {
      morning: Math.floor(Math.random() * 25),
      afternoon: Math.floor(Math.random() * 35),
      evening: Math.floor(Math.random() * 40)
    };
  }
}