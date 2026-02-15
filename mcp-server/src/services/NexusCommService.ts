/**
 * NexusComm Service Integration
 * Handles communication with the main NexusComm backend
 */

import axios, { AxiosInstance } from 'axios';
import pino from 'pino';
import { ConversationSummary } from '../types/index.js';

export class NexusCommService {
  private client: AxiosInstance;
  private logger: pino.Logger;
  private readonly _apiKey: string;

  constructor(
    apiUrl: string,
    apiKey: string,
    private userId: string
  ) {
    this._apiKey = apiKey;
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${this._apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.logger = pino({ name: 'NexusCommService' });
  }

  /**
   * Get conversations for the user
   */
  async getConversations(options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}): Promise<any[]> {
    try {
      const response = await this.client.get('/api/conversations', {
        params: options,
      });
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to get conversations');
      throw error;
    }
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
      before?: Date;
      after?: Date;
    } = {}
  ): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/api/messages/${conversationId}`,
        { params: options }
      );
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error, conversationId }, 'Failed to get messages');
      throw error;
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(params: {
    conversationId: string;
    content: string;
    channelType?: string;
    attachments?: Array<{
      type: string;
      url: string;
      name: string;
    }>;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/messages', {
        ...params,
        userId: this.userId,
      });
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error, params }, 'Failed to send message');
      throw error;
    }
  }

  /**
   * Analyze message sentiment using Claude AI
   */
  async analyzeSentiment(messageIds: string[]): Promise<any> {
    try {
      const response = await this.client.post('/api/ai/analyze-sentiment', {
        messageIds,
        userId: this.userId,
      });
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error, messageIds }, 'Failed to analyze sentiment');
      throw error;
    }
  }

  /**
   * Generate reply suggestions using Claude AI
   */
  async getReplySuggestions(params: {
    conversationId: string;
    messageId?: string;
    tone?: 'professional' | 'casual' | 'empathetic' | 'humorous';
    context?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/ai/reply-suggestions', {
        ...params,
        userId: this.userId,
      });
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error, params }, 'Failed to get reply suggestions');
      throw error;
    }
  }

  /**
   * Get conversation summary using AI
   */
  async getConversationSummary(params: {
    conversationId: string;
    messageIds?: string[];
    length?: 'brief' | 'standard' | 'detailed';
    context?: string;
  }): Promise<ConversationSummary> {
    try {
      const response = await this.client.post('/api/ai/summarize', {
        ...params,
        userId: this.userId,
      });
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error, params }, 'Failed to get conversation summary');
      throw error;
    }
  }

  /**
   * Search messages semantically
   */
  async semanticSearch(params: {
    query: string;
    conversationId?: string;
    limit?: number;
    filters?: {
      sender?: string;
      dateRange?: { start: Date; end: Date };
      sentiment?: string;
    };
  }): Promise<any[]> {
    try {
      const response = await this.client.post('/api/ai/search', {
        ...params,
        userId: this.userId,
      });
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error, params }, 'Failed to perform semantic search');
      throw error;
    }
  }

  /**
   * Get conversation insights and analytics
   */
  async getConversationInsights(params: {
    conversationId: string;
    periodStart: Date;
    periodEnd: Date;
    includePredictions?: boolean;
  }): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/ai/insights/${params.conversationId}`,
        { params }
      );
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error, params }, 'Failed to get conversation insights');
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(params: {
    conversationId?: string;
    messageIds?: string[];
  }): Promise<void> {
    try {
      if (params.conversationId) {
        await this.client.put(`/api/conversations/${params.conversationId}/read`);
      } else if (params.messageIds) {
        await Promise.all(
          params.messageIds.map(id =>
            this.client.put(`/api/messages/${id}/read`)
          )
        );
      }
    } catch (error) {
      this.logger.error({ error, params }, 'Failed to mark messages as read');
      throw error;
    }
  }

  /**
   * Get user profile and preferences
   */
  async getUserProfile(): Promise<any> {
    try {
      const response = await this.client.get('/api/users/profile');
      return response.data.data || response.data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to get user profile');
      throw error;
    }
  }

  /**
   * Test connection to NexusComm backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/health');
      return response.status === 200;
    } catch (error) {
      this.logger.error({ error }, 'Connection test failed');
      return false;
    }
  }
}