import axios, { AxiosInstance } from 'axios';
import { AppError } from '@middleware/errorHandler';

/**
 * Elasticsearch Search Service
 * Provides full-text search across messages, users, and conversations
 */

export interface SearchResult {
  id: string;
  type: 'message' | 'user' | 'conversation';
  title: string;
  excerpt: string;
  score: number;
  metadata: Record<string, any>;
}

export interface SearchOptions {
  query: string;
  filter?: {
    channelId?: string;
    userId?: string;
    dateRange?: { from: Date; to: Date };
    type?: string;
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export class SearchService {
  private client: AxiosInstance;
  private esUrl: string;

  constructor(esUrl: string = 'http://localhost:9200') {
    this.esUrl = esUrl;
    this.client = axios.create({
      baseURL: esUrl,
      timeout: 10000,
    });
  }

  /**
   * Index a message for search
   */
  async indexMessage(
    messageId: string,
    userId: string,
    conversationId: string,
    content: string,
    channel: string,
    timestamp: Date
  ): Promise<void> {
    try {
      await this.client.post(`/messages/_doc/${messageId}`, {
        userId,
        conversationId,
        content,
        channel,
        timestamp,
        indexed_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to index message:', error);
    }
  }

  /**
   * Update indexed message
   */
  async updateMessage(messageId: string, updates: any): Promise<void> {
    try {
      await this.client.post(`/messages/_update/${messageId}`, {
        doc: updates,
      });
    } catch (error) {
      console.error('Failed to update message index:', error);
    }
  }

  /**
   * Delete indexed message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.client.delete(`/messages/_doc/${messageId}`);
    } catch (error) {
      console.error('Failed to delete message from index:', error);
    }
  }

  /**
   * Full-text search across all messages
   */
  async searchMessages(options: SearchOptions): Promise<SearchResult[]> {
    const { query, filter = {}, pagination = { page: 1, limit: 50 } } = options;

    try {
      const must: any[] = [
        {
          multi_match: {
            query,
            fields: ['content^2', 'channel'],
            fuzziness: 'AUTO',
          },
        },
      ];

      if (filter.conversationId) {
        must.push({
          term: { conversationId: filter.conversationId },
        });
      }

      if (filter.userId) {
        must.push({
          term: { userId: filter.userId },
        });
      }

      if (filter.dateRange) {
        must.push({
          range: {
            timestamp: {
              gte: filter.dateRange.from.toISOString(),
              lte: filter.dateRange.to.toISOString(),
            },
          },
        });
      }

      const response = await this.client.post('/messages/_search', {
        query: {
          bool: {
            must,
          },
        },
        from: (pagination.page - 1) * pagination.limit,
        size: pagination.limit,
        highlight: {
          pre_tags: ['<em>'],
          post_tags: ['</em>'],
          fields: {
            content: {},
          },
        },
      });

      return response.data.hits.hits.map((hit: any) => ({
        id: hit._id,
        type: 'message',
        title: `Message from ${hit._source.channel}`,
        excerpt: hit.highlight?.content?.[0] || hit._source.content.substring(0, 200),
        score: hit._score,
        metadata: hit._source,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      throw new AppError(500, 'Search failed', 'SEARCH_ERROR');
    }
  }

  /**
   * Autocomplete search for quick results
   */
  async autocomplete(query: string, type: 'messages' | 'channels' | 'users'): Promise<any[]> {
    try {
      const response = await this.client.post(`/${type}/_search`, {
        query: {
          match_phrase_prefix: {
            name: {
              query,
            },
          },
        },
        size: 10,
      });

      return response.data.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Autocomplete failed:', error);
      return [];
    }
  }

  /**
   * Get trending search terms
   */
  async getTrendingSearches(): Promise<string[]> {
    try {
      const response = await this.client.post('/messages/_search', {
        aggs: {
          trending: {
            significant_text: {
              field: 'content',
              min_doc_count: 5,
            },
          },
        },
        size: 0,
      });

      return response.data.aggregations.trending.buckets
        .slice(0, 10)
        .map((bucket: any) => bucket.key);
    } catch (error) {
      console.error('Failed to get trending searches:', error);
      return [];
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/');
      return response.status === 200;
    } catch (error) {
      console.error('Elasticsearch health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const searchService = new SearchService(
  process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
);
