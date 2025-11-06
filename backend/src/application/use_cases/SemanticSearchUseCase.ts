/**
 * SemanticSearchUseCase
 * Application use case that orchestrates AI-powered semantic message search.
 * Finds semantically similar messages beyond keyword matching using embeddings.
 */

import {
  AIAnalysisPort,
  SemanticSearchRequest,
  SemanticSearchResult,
} from '../../domain/ports/AIAnalysisPort';
import pino from 'pino';

export interface SemanticSearchInput {
  query: string;
  userId: string;
  conversationIds?: string[];
  limit?: number;
}

export interface SemanticSearchOutput {
  query: string;
  results: Array<{
    messageId: string;
    conversationId: string;
    content: string;
    similarity: number;
    metadata?: Record<string, unknown>;
  }>;
  totalResults: number;
  executionTime: number;
}

export class SemanticSearchUseCase {
  private readonly aiAnalysisPort: AIAnalysisPort;
  private readonly logger: pino.Logger;

  constructor(aiAnalysisPort: AIAnalysisPort) {
    this.aiAnalysisPort = aiAnalysisPort;
    this.logger = pino();
  }

  async execute(input: SemanticSearchInput): Promise<SemanticSearchOutput> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(input);

      // Check service health
      const isHealthy = await this.aiAnalysisPort.isHealthy();
      if (!isHealthy) {
        throw new Error('AI service is not available');
      }

      // Build request for AI service
      const request: SemanticSearchRequest = {
        query: input.query,
        userId: input.userId,
        conversationIds: input.conversationIds,
        limit: input.limit || 10,
      };

      // Perform semantic search
      const results: SemanticSearchResult[] =
        await this.aiAnalysisPort.semanticSearch(request);

      // Format output
      const executionTime = Date.now() - startTime;
      const output: SemanticSearchOutput = {
        query: input.query,
        results: results.map((r) => ({
          messageId: r.messageId,
          conversationId: r.conversationId,
          content: r.content,
          similarity: r.similarity,
          metadata: r.metadata,
        })),
        totalResults: results.length,
        executionTime,
      };

      this.logger.info(
        {
          query: input.query,
          resultCount: output.totalResults,
          executionTime,
        },
        'Semantic search completed',
      );

      return output;
    } catch (error) {
      this.logger.error(
        { error, query: input.query },
        'Semantic search failed',
      );
      throw error;
    }
  }

  private validateInput(input: SemanticSearchInput): void {
    if (!input.query || input.query.trim().length === 0) {
      throw new Error('query is required');
    }

    if (!input.userId || input.userId.trim().length === 0) {
      throw new Error('userId is required');
    }

    if (input.query.length > 1000) {
      throw new Error('query must be less than 1000 characters');
    }

    if (input.conversationIds && !Array.isArray(input.conversationIds)) {
      throw new Error('conversationIds must be an array');
    }

    if (input.limit && input.limit < 1) {
      throw new Error('limit must be at least 1');
    }

    if (input.limit && input.limit > 100) {
      throw new Error('limit cannot exceed 100');
    }
  }
}
