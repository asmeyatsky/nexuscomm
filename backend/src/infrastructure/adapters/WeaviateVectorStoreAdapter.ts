/**
 * Weaviate Vector Store Adapter
 * Open-source vector database for semantic search
 * Run locally: docker run -p 8080:8080 semitechnologies/weaviate
 */

import axios from 'axios';
import pino from 'pino';

export interface VectorEmbedding {
  id: string;
  values: number[];
  metadata: {
    messageId: string;
    userId: string;
    conversationId: string;
    content: string;
    sentiment?: string;
    category?: string;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export class WeaviateVectorStoreAdapter {
  private client: axios.AxiosInstance;
  private logger: pino.Logger;
  private indexName: string;

  constructor(
    private apiUrl: string = process.env.WEAVIATE_URL || 'http://localhost:8080',
    private apiKey: string = process.env.WEAVIATE_API_KEY || '',
    indexName: string = process.env.WEAVIATE_INDEX || 'NexusCommMessages'
  ) {
    this.indexName = indexName;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
      timeout: 30000,
    });
    this.logger = pino({ name: 'WeaviateVectorStore' });
  }

  async initialize(): Promise<void> {
    try {
      const schema = {
        class: this.indexName,
        description: 'NexusComm message embeddings for semantic search',
        vectorizer: 'text2vec-transformers',
        moduleConfig: {
          'text2vec-transformers': {
            vectorizeClassName: false,
          },
        },
        properties: [
          { name: 'messageId', dataType: ['text'] },
          { name: 'userId', dataType: ['text'] },
          { name: 'conversationId', dataType: ['text'] },
          { name: 'content', dataType: ['text'] },
          { name: 'sentiment', dataType: ['text'] },
          { name: 'category', dataType: ['text'] },
        ],
      };

      await this.client.post('/v1/schema', schema);
      this.logger.info({ index: this.indexName }, 'Weaviate index created');
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 422) {
        this.logger.info({ index: this.indexName }, 'Weaviate index already exists');
        return;
      }
      this.logger.error({ error }, 'Failed to initialize Weaviate index');
      throw error;
    }
  }

  async addVectors(embeddings: VectorEmbedding[]): Promise<void> {
    try {
      const objects = embeddings.map((embedding) => ({
        class: this.indexName,
        id: embedding.id,
        vector: embedding.values,
        properties: embedding.metadata,
      }));

      await this.client.post('/v1/batch/objects', { objects });
      this.logger.info({ count: embeddings.length }, 'Vectors added to Weaviate');
    } catch (error) {
      this.logger.error({ error }, 'Failed to add vectors to Weaviate');
      throw error;
    }
  }

  async searchVectors(queryVector: number[], limit: number = 10): Promise<SearchResult[]> {
    try {
      const response = await this.client.post('/v1/graphql', {
        query: `
          {
            Get {
              ${this.indexName}(
                nearVector: { vector: ${JSON.stringify(queryVector)} }
                limit: ${limit}
              ) {
                _additional {
                  id
                  certainty
                }
                messageId
                userId
                conversationId
                content
                sentiment
                category
              }
            }
          }
        `,
      });

      const results = response.data?.data?.Get?.[this.indexName] || [];
      return results.map((item: Record<string, unknown>) => ({
        id: item._additional?.id || '',
        score: item._additional?.certainty || 0,
        metadata: item,
      }));
    } catch (error) {
      this.logger.error({ error }, 'Failed to search vectors in Weaviate');
      throw error;
    }
  }

  async deleteVectors(ids: string[]): Promise<void> {
    try {
      for (const id of ids) {
        await this.client.delete(`/v1/objects/${this.indexName}/${id}`);
      }
      this.logger.info({ count: ids.length }, 'Vectors deleted from Weaviate');
    } catch (error) {
      this.logger.error({ error }, 'Failed to delete vectors from Weaviate');
      throw error;
    }
  }

  async getStats(): Promise<{ totalVectors: number }> {
    try {
      const response = await this.client.get(`/v1/schema/${this.indexName}`);
      return { totalVectors: 0 };
    } catch (error) {
      this.logger.error({ error }, 'Failed to get Weaviate stats');
      return { totalVectors: 0 };
    }
  }
}
