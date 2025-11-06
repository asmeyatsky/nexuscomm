/**
 * GenerateReplySuggestionsUseCase
 * Application use case that orchestrates AI-powered reply suggestion generation.
 * Generates smart reply suggestions based on conversation context and message content.
 */

import { MessageSuggestion, SuggestedReply } from '../../domain/valueObjects/MessageSuggestion';
import {
  AIAnalysisPort,
  SuggestionRequest,
} from '../../domain/ports/AIAnalysisPort';
import pino from 'pino';

export interface GenerateReplySuggestionsInput {
  messageId: string;
  conversationId: string;
  content: string;
  userId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  tone?: 'professional' | 'casual' | 'empathetic' | 'humorous';
  conversationContext?: string;
}

export interface GenerateReplySuggestionsOutput {
  messageId: string;
  conversationId: string;
  suggestions: Array<{
    text: string;
    confidence: number;
    tone: string;
    lengthCategory: string;
    rationale?: string;
  }>;
  contextSummary: string;
  averageConfidence: number;
}

export class GenerateReplySuggestionsUseCase {
  private readonly aiAnalysisPort: AIAnalysisPort;
  private readonly logger: pino.Logger;

  constructor(aiAnalysisPort: AIAnalysisPort) {
    this.aiAnalysisPort = aiAnalysisPort;
    this.logger = pino();
  }

  async execute(
    input: GenerateReplySuggestionsInput,
  ): Promise<GenerateReplySuggestionsOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Check service health
      const isHealthy = await this.aiAnalysisPort.isHealthy();
      if (!isHealthy) {
        throw new Error('AI service is not available');
      }

      // Build request for AI service
      const request: SuggestionRequest = {
        messageId: input.messageId,
        conversationId: input.conversationId,
        content: input.content,
        userId: input.userId,
        conversationHistory: input.conversationHistory,
        tone: input.tone,
        conversationContext: input.conversationContext,
      };

      // Call AI service
      const suggestions: MessageSuggestion = await this.aiAnalysisPort.generateSuggestions(request);

      // Format output
      const suggestionsData = suggestions.getSuggestions();
      const output: GenerateReplySuggestionsOutput = {
        messageId: suggestions.getMessageId(),
        conversationId: suggestions.getConversationId(),
        suggestions: suggestionsData.map((s: SuggestedReply) => ({
          text: s.text,
          confidence: s.confidence,
          tone: s.tone,
          lengthCategory: s.lengthCategory,
          rationale: s.rationale,
        })),
        contextSummary: suggestions.getContextSummary(),
        averageConfidence: suggestions.getAverageConfidence(),
      };

      this.logger.info(
        {
          messageId: input.messageId,
          suggestionCount: output.suggestions.length,
          avgConfidence: output.averageConfidence,
        },
        'Reply suggestions generated',
      );

      return output;
    } catch (error) {
      this.logger.error(
        { error, messageId: input.messageId },
        'Reply suggestion generation failed',
      );
      throw error;
    }
  }

  private validateInput(input: GenerateReplySuggestionsInput): void {
    if (!input.messageId || input.messageId.trim().length === 0) {
      throw new Error('messageId is required');
    }

    if (!input.conversationId || input.conversationId.trim().length === 0) {
      throw new Error('conversationId is required');
    }

    if (!input.content || input.content.trim().length === 0) {
      throw new Error('content is required');
    }

    if (!input.userId || input.userId.trim().length === 0) {
      throw new Error('userId is required');
    }

    if (input.content.length > 5000) {
      throw new Error('content must be less than 5000 characters');
    }

    if (
      input.conversationHistory &&
      !Array.isArray(input.conversationHistory)
    ) {
      throw new Error('conversationHistory must be an array');
    }

    if (
      input.tone &&
      !['professional', 'casual', 'empathetic', 'humorous'].includes(
        input.tone,
      )
    ) {
      throw new Error('Invalid tone value');
    }
  }
}
