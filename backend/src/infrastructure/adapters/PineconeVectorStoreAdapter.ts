/**
 * PineconeVectorStoreAdapter
 * Infrastructure adapter for Pinecone vector database.
 * Handles semantic search using message embeddings.
 */

import { Pinecone } from '@pinecone-database/pinecone';
import pino from 'pino';
import { encoding_for_model } from 'js-tiktoken';

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
    timestamp: string;
  };
}

export interface SemanticSearchResult {
  messageId: string;
  conversationId: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export class PineconeVectorStoreAdapter {
  private client: Pinecone;
  private indexName: string;
  private logger: pino.Logger;
  private tokenizer = encoding_for_model('gpt-3.5-turbo');
  private readonly EMBEDDING_DIM = 1536; // Pinecone default for text-embedding-3-small

  constructor(
    apiKey: string = process.env.PINECONE_API_KEY || '',
    indexName: string = process.env.PINECONE_INDEX || 'nexuscomm-messages',
  ) {
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is required');
    }

    this.client = new Pinecone({ apiKey });
    this.indexName = indexName;
    this.logger = pino();
  }

  /**
   * Generate embeddings for text
   * Uses a simple word frequency-based embedding for demo
   * In production, use OpenAI's text-embedding-3-small API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // For demo: use simple TF-IDF style embedding
      // In production, call OpenAI's embedding API:
      // const response = await openai.embeddings.create({
      //   model: 'text-embedding-3-small',
      //   input: text,
      // });
      // return response.data[0].embedding;

      // Simple embedding: word frequency with dimension 1536
      const embedding = new Array(this.EMBEDDING_DIM).fill(0);
      const words = text.toLowerCase().split(/\W+/);
      const wordMap = new Map<string, number>();

      // Calculate word frequencies
      for (const word of words) {
        if (word.length > 2) {
          wordMap.set(word, (wordMap.get(word) || 0) + 1);
        }
      }

      // Distribute word frequencies across embedding dimensions
      const sortedWords = Array.from(wordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);

      for (let i = 0; i < sortedWords.length; i++) {
        const [, freq] = sortedWords[i];
        const idx = (i * 13) % this.EMBEDDING_DIM; // Distribute across dimensions
        embedding[idx] = freq / (words.length || 1);
      }

      // Add text length as feature
      const lengthNormalized = Math.min(words.length / 100, 1);
      for (let i = 0; i < 10; i++) {
        embedding[i] = (embedding[i] + lengthNormalized) / 2;
      }

      // Normalize to unit vector
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0),
      );
      return magnitude > 0
        ? embedding.map((val) => val / magnitude)
        : embedding;
    } catch (error) {
      this.logger.error({ error, text: text.substring(0, 50) }, 'Failed to generate embedding');
      // Return zero vector on error
      return new Array(this.EMBEDDING_DIM).fill(0);
    }
  }

  /**
   * Store message embedding in Pinecone
   */
  async storeEmbedding(
    messageId: string,
    userId: string,
    conversationId: string,
    content: string,
    sentiment?: string,
    category?: string,
  ): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(content);
      const index = this.client.Index(this.indexName);

      const vector: VectorEmbedding = {
        id: messageId,
        values: embedding,
        metadata: {
          messageId,
          userId,
          conversationId,
          content: content.substring(0, 500), // Limit metadata size
          sentiment,
          category,
          timestamp: new Date().toISOString(),
        },
      };

      await index.upsert([vector]);
      this.logger.debug({ messageId }, 'Stored message embedding');
    } catch (error) {
      this.logger.error(
        { error, messageId },
        'Failed to store embedding in Pinecone',
      );
      // Don't throw - search can continue without this message
    }
  }

  /**
   * Search for semantically similar messages
   */
  async search(
    query: string,
    userId: string,
    conversationIds?: string[],
    limit: number = 10,
  ): Promise<SemanticSearchResult[]> {
    try {
      const index = this.client.Index(this.indexName);
      const queryEmbedding = await this.generateEmbedding(query);

      // Build filter for user and conversations if specified
      const filters: any = { userId };
      if (conversationIds && conversationIds.length > 0) {
        filters.conversationId = { $in: conversationIds };
      }

      const results = await index.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        filter: filters,
      });

      return results.matches
        .filter((match) => match.metadata)
        .map((match) => ({
          messageId: match.metadata!.messageId as string,
          conversationId: match.metadata!.conversationId as string,
          content: match.metadata!.content as string,
          similarity: match.score || 0,
          metadata: match.metadata,
        }));
    } catch (error) {
      this.logger.error(
        { error, query: query.substring(0, 50) },
        'Semantic search failed',
      );
      throw new Error(`Semantic search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Delete message embedding
   */
  async deleteEmbedding(messageId: string): Promise<void> {
    try {
      const index = this.client.Index(this.indexName);
      await index.deleteOne(messageId);
      this.logger.debug({ messageId }, 'Deleted message embedding');
    } catch (error) {
      this.logger.error({ error, messageId }, 'Failed to delete embedding');
      // Don't throw - continue even if deletion fails
    }
  }

  /**
   * Delete all embeddings for a conversation
   */
  async deleteConversationEmbeddings(conversationId: string): Promise<number> {
    try {
      const index = this.client.Index(this.indexName);
      // Note: Pinecone doesn't have bulk delete by metadata,
      // so this is a placeholder. In production, maintain a mapping
      // of conversationId -> messageIds
      this.logger.info({ conversationId }, 'Conversation embeddings deletion requested');
      return 0;
    } catch (error) {
      this.logger.error(
        { error, conversationId },
        'Failed to delete conversation embeddings',
      );
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<{
    vectorCount: number;
    indexSize: string;
    dimension: number;
  }> {
    try {
      const index = this.client.Index(this.indexName);
      const stats = await index.describeIndexStats();

      return {
        vectorCount: stats.totalVectorCount || 0,
        indexSize: `${((stats.totalVectorCount || 0) * 0.001).toFixed(2)} KB`,
        dimension: this.EMBEDDING_DIM,
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to get index statistics');
      throw error;
    }
  }

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    try {
      const index = this.client.Index(this.indexName);
      await index.describeIndexStats();
      return true;
    } catch (error) {
      this.logger.error({ error }, 'Vector store health check failed');
      return false;
    }
  }

  /**
   * Estimate tokens for text
   */
  private estimateTokens(text: string): number {
    try {
      const tokens = this.tokenizer.encode(text);
      return tokens.length;
    } catch {
      // Fallback: estimate ~4 chars per token
      return Math.ceil(text.length / 4);
    }
  }
}
