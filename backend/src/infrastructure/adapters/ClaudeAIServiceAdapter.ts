/**
 * ClaudeAIServiceAdapter
 * Infrastructure adapter implementing AIAnalysisPort using Anthropic's Claude API.
 * Handles sentiment analysis, categorization, suggestion generation, and semantic search.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AppDataSource } from '@config/database';
import { MessageAnalysis, SentimentScore, MessageCategory, MessageTheme } from '../../domain/valueObjects/MessageAnalysis';
import { MessageSuggestion, SuggestedReply } from '../../domain/valueObjects/MessageSuggestion';
import {
  AIAnalysisPort,
  AnalysisRequest,
  SentimentAnalysisRequest,
  CategorizationRequest,
  SuggestionRequest,
  SemanticSearchRequest,
  EmbeddingRequest,
  SemanticSearchResult,
} from '../../domain/ports/AIAnalysisPort';
import { AIUsageLogRepository, LogAIOperationInput } from '@infrastructure/repositories/AIUsageLogRepository';
import { AIAnalysisResultsRepository } from '@infrastructure/repositories/AIAnalysisResultsRepository';
import { PineconeVectorStoreAdapter } from './PineconeVectorStoreAdapter';
import pino from 'pino';

export class ClaudeAIServiceAdapter implements AIAnalysisPort {
  private client: Anthropic;
  private logger: pino.Logger;
  private usageLogRepository: AIUsageLogRepository;
  private analysisResultsRepository: AIAnalysisResultsRepository;
  private vectorStore: PineconeVectorStoreAdapter;
  private requestCount: number = 0;
  private tokenCount: number = 0;
  private costEstimate: number = 0;
  private readonly MODEL = 'claude-3-5-sonnet-20241022';
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_DELAY = 1000; // ms

  constructor(apiKey?: string, pineconeApiKey?: string, pineconeIndex?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.logger = pino();
    this.usageLogRepository = new AIUsageLogRepository(AppDataSource);
    this.analysisResultsRepository = new AIAnalysisResultsRepository(AppDataSource);
    this.vectorStore = new PineconeVectorStoreAdapter(pineconeApiKey, pineconeIndex);
  }

  async analyzeSentiment(
    request: SentimentAnalysisRequest,
  ): Promise<MessageAnalysis> {
    try {
      const prompt = this.buildSentimentPrompt(request);

      const response = await this.callClaudeWithRetry(prompt);
      const analysis = this.parseSentimentResponse(response, request.messageId);

      this.trackUsage(response);
      return analysis;
    } catch (error) {
      this.logger.error(
        { error, messageId: request.messageId },
        'Failed to analyze sentiment',
      );
      throw new Error(`Sentiment analysis failed: ${(error as Error).message}`);
    }
  }

  async categorizeMessage(
    request: CategorizationRequest,
  ): Promise<MessageAnalysis> {
    try {
      const prompt = this.buildCategorizationPrompt(request);

      const response = await this.callClaudeWithRetry(prompt);
      const analysis = this.parseCategorizationResponse(
        response,
        request.messageId,
      );

      this.trackUsage(response);
      return analysis;
    } catch (error) {
      this.logger.error(
        { error, messageId: request.messageId },
        'Failed to categorize message',
      );
      throw new Error(`Categorization failed: ${(error as Error).message}`);
    }
  }

  async generateSuggestions(
    request: SuggestionRequest,
  ): Promise<MessageSuggestion> {
    try {
      const prompt = this.buildSuggestionsPrompt(request);

      const response = await this.callClaudeWithRetry(prompt);
      const suggestions = this.parseSuggestionsResponse(
        response,
        request.messageId,
        request.conversationId,
      );

      this.trackUsage(response);
      return suggestions;
    } catch (error) {
      this.logger.error(
        { error, messageId: request.messageId },
        'Failed to generate suggestions',
      );
      throw new Error(
        `Suggestion generation failed: ${(error as Error).message}`,
      );
    }
  }

  async semanticSearch(
    request: SemanticSearchRequest,
  ): Promise<SemanticSearchResult[]> {
    try {
      // Validate request
      if (!request.query || request.query.trim().length === 0) {
        throw new Error('Query is required');
      }

      if (!request.userId || request.userId.trim().length === 0) {
        throw new Error('UserId is required');
      }

      // Perform semantic search using Pinecone
      const results = await this.vectorStore.search(
        request.query,
        request.userId,
        request.conversationIds,
        request.limit || 10,
      );

      this.logger.info(
        {
          query: request.query,
          userId: request.userId,
          resultCount: results.length,
        },
        'Semantic search completed successfully',
      );

      return results;
    } catch (error) {
      this.logger.error(
        { error, query: request.query },
        'Failed to perform semantic search',
      );
      throw new Error(
        `Semantic search failed: ${(error as Error).message}`,
      );
    }
  }

  async generateEmbedding(request: EmbeddingRequest): Promise<number[]> {
    try {
      // Claude API doesn't natively provide embeddings
      // We would use a dedicated embedding model like text-embedding-3-small
      // For now, return placeholder
      this.logger.info('Embeddings requested - external embedding model needed');
      return [];
    } catch (error) {
      this.logger.error({ error, type: request.type }, 'Failed to generate embedding');
      throw new Error(`Embedding generation failed: ${(error as Error).message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check by creating a minimal message
      const response = await this.client.messages.create({
        model: this.MODEL,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'ping',
          },
        ],
      });

      return response.stop_reason === 'end_turn';
    } catch (error) {
      this.logger.error({ error }, 'Health check failed');
      return false;
    }
  }

  async getUsageMetrics(): Promise<{
    requestsToday: number;
    tokensUsedToday: number;
    estimatedCostToday: number;
  }> {
    return {
      requestsToday: this.requestCount,
      tokensUsedToday: this.tokenCount,
      estimatedCostToday: this.costEstimate,
    };
  }

  // Private helper methods

  private buildSentimentPrompt(request: AnalysisRequest): string {
    const context = request.conversationContext
      ? `\nConversation context:\n${request.conversationContext}`
      : '';

    return `Analyze the sentiment of the following message and respond with ONLY valid JSON (no markdown, no explanation):

Message: "${request.content}"${context}

Respond with exactly this JSON structure:
{
  "positive": <number 0-1>,
  "neutral": <number 0-1>,
  "negative": <number 0-1>,
  "overall": "positive" | "neutral" | "negative",
  "confidence": <number 0-1>,
  "keyInsights": [<strings explaining sentiment>]
}`;
  }

  private buildCategorizationPrompt(request: CategorizationRequest): string {
    const existingCats = request.existingCategories
      ? `\nExisting categories to consider: ${request.existingCategories.join(', ')}`
      : '';

    return `Categorize the following message and respond with ONLY valid JSON (no markdown, no explanation):

Message: "${request.content}"${existingCats}

Respond with exactly this JSON structure:
{
  "primary": "<single category>",
  "secondary": ["<category1>", "<category2>"],
  "confidence": <number 0-1>,
  "themes": [{"name": "<theme>", "relevance": <number 0-1>}]
}`;
  }

  private buildSuggestionsPrompt(request: SuggestionRequest): string {
    const historyStr = request.conversationHistory
      ? request.conversationHistory
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n')
      : '';

    const toneStr = request.tone ? `\nRequested tone: ${request.tone}` : '';

    return `Generate 3 smart reply suggestions for this message and respond with ONLY valid JSON (no markdown, no explanation):

${historyStr}
user: "${request.content}"${toneStr}

Respond with exactly this JSON structure:
{
  "contextSummary": "<brief summary of conversation context>",
  "suggestions": [
    {
      "text": "<suggested reply>",
      "confidence": <number 0-1>,
      "tone": "professional" | "casual" | "empathetic" | "humorous",
      "lengthCategory": "short" | "medium" | "long",
      "rationale": "<why this suggestion works>"
    }
  ]
}`;
  }

  private async callClaudeWithRetry(
    prompt: string,
    retries: number = 0,
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      throw new Error('Unexpected response type from Claude');
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        // Exponential backoff
        const delay = this.RATE_LIMIT_DELAY * Math.pow(2, retries);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.callClaudeWithRetry(prompt, retries + 1);
      }

      throw error;
    }
  }

  private parseSentimentResponse(
    response: string,
    messageId: string,
  ): MessageAnalysis {
    const parsed = JSON.parse(response);

    const sentiment: SentimentScore = {
      positive: parsed.positive,
      neutral: parsed.neutral,
      negative: parsed.negative,
      overall: parsed.overall,
      confidence: parsed.confidence,
    };

    const categories: MessageCategory = {
      primary: 'sentiment-based',
      confidence: parsed.confidence,
    };

    const themes: MessageTheme[] = [];

    return new MessageAnalysis(
      messageId,
      sentiment,
      categories,
      themes,
      parsed.keyInsights || [],
    );
  }

  private parseCategorizationResponse(
    response: string,
    messageId: string,
  ): MessageAnalysis {
    const parsed = JSON.parse(response);

    const sentiment: SentimentScore = {
      positive: 0.33,
      neutral: 0.34,
      negative: 0.33,
      overall: 'neutral',
      confidence: 0.5,
    };

    const categories: MessageCategory = {
      primary: parsed.primary,
      secondary: parsed.secondary,
      confidence: parsed.confidence,
    };

    const themes: MessageTheme[] = parsed.themes || [];

    return new MessageAnalysis(
      messageId,
      sentiment,
      categories,
      themes,
      [],
    );
  }

  private parseSuggestionsResponse(
    response: string,
    messageId: string,
    conversationId: string,
  ): MessageSuggestion {
    const parsed = JSON.parse(response);

    const suggestions: SuggestedReply[] = (parsed.suggestions || []).map(
      (s: Partial<SuggestedReply>) => ({
        text: s.text || '',
        confidence: s.confidence || 0.5,
        tone: s.tone || 'professional',
        lengthCategory: s.lengthCategory || 'medium',
        rationale: s.rationale,
      }),
    );

    return new MessageSuggestion(
      messageId,
      conversationId,
      suggestions,
      parsed.contextSummary || 'Conversation context analyzed',
    );
  }

  private trackUsage(response: string): void {
    this.requestCount++;
    // Rough token estimation (Claude counts ~4 chars per token)
    const estimatedTokens = Math.ceil(response.length / 4);
    this.tokenCount += estimatedTokens;
    // Sonnet pricing: $3/1M input, $15/1M output tokens
    this.costEstimate += (estimatedTokens * 15) / 1000000;
  }

  /**
   * Log AI operation to database for audit and cost tracking
   */
  private async logAIOperation(
    userId: string,
    operation: string,
    status: 'success' | 'failure' | 'rate_limited',
    inputTokens: number,
    outputTokens: number,
    responseTimeMs: number,
    error?: Error,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const totalTokens = inputTokens + outputTokens;
      const estimatedCost = (totalTokens * 15) / 1000000; // Sonnet pricing

      const logInput: LogAIOperationInput = {
        userId,
        operation: operation as any,
        model: this.MODEL,
        status,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost,
        requestSize: 0, // Can be calculated from prompt
        responseSize: 0, // Can be calculated from response
        responseTimeMs,
        errorCode: error?.name,
        errorMessage: error?.message,
        metadata: metadata || {},
      };

      await this.usageLogRepository.logOperation(logInput);
    } catch (err) {
      this.logger.error(
        { error: err, userId, operation },
        'Failed to log AI operation',
      );
    }
  }

  /**
   * Save analysis results to database
   */
  private async saveAnalysisResults(
    messageId: string,
    userId: string,
    analysis: MessageAnalysis,
  ): Promise<void> {
    try {
      await this.analysisResultsRepository.saveAnalysis(messageId, userId, analysis);
    } catch (error) {
      this.logger.error(
        { error, messageId, userId },
        'Failed to save analysis results',
      );
      // Don't throw - analysis is still valid even if storage fails
    }
  }
}
