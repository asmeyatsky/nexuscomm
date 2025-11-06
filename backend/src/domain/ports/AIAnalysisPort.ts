/**
 * AIAnalysisPort
 * Port defining the contract for AI analysis services.
 * Implementations should handle sentiment analysis, categorization, suggestions, and semantic search.
 */

import { MessageAnalysis, SentimentScore, MessageCategory, MessageTheme } from '../valueObjects/MessageAnalysis';
import { MessageSuggestion, SuggestedReply } from '../valueObjects/MessageSuggestion';

export interface AnalysisRequest {
  messageId: string;
  content: string;
  conversationContext?: string;
  userId: string;
}

export interface SentimentAnalysisRequest extends AnalysisRequest {
  // Content and context from parent interface
}

export interface CategorizationRequest extends AnalysisRequest {
  existingCategories?: string[];
}

export interface SuggestionRequest extends AnalysisRequest {
  conversationId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  tone?: 'professional' | 'casual' | 'empathetic' | 'humorous';
}

export interface SemanticSearchRequest {
  query: string;
  conversationIds?: string[];
  userId: string;
  limit?: number;
}

export interface EmbeddingRequest {
  text: string;
  type: 'message' | 'query';
}

export interface SemanticSearchResult {
  messageId: string;
  conversationId: string;
  content: string;
  similarity: number; // 0-1 score
  metadata?: Record<string, unknown>;
}

export interface AIAnalysisPort {
  /**
   * Analyze sentiment of message content
   */
  analyzeSentiment(request: SentimentAnalysisRequest): Promise<MessageAnalysis>;

  /**
   * Categorize message by type, urgency, topic, etc.
   */
  categorizeMessage(request: CategorizationRequest): Promise<MessageAnalysis>;

  /**
   * Generate reply suggestions based on conversation context
   */
  generateSuggestions(request: SuggestionRequest): Promise<MessageSuggestion>;

  /**
   * Perform semantic search across messages
   */
  semanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResult[]>;

  /**
   * Generate embeddings for semantic search
   */
  generateEmbedding(request: EmbeddingRequest): Promise<number[]>;

  /**
   * Check if service is available
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get usage/cost metrics
   */
  getUsageMetrics(): Promise<{
    requestsToday: number;
    tokensUsedToday: number;
    estimatedCostToday: number;
  }>;
}
