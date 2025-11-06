/**
 * CategorizeMessageUseCase
 * Application use case that orchestrates automatic message categorization.
 * Categorizes messages by type, urgency, topic, and generates relevant tags.
 */

import { MessageAnalysis } from '../../domain/valueObjects/MessageAnalysis';
import {
  AIAnalysisPort,
  CategorizationRequest,
} from '../../domain/ports/AIAnalysisPort';
import pino from 'pino';

export interface CategorizeMessageInput {
  messageId: string;
  content: string;
  conversationContext?: string;
  userId: string;
  existingCategories?: string[];
}

export interface CategorizeMessageOutput {
  messageId: string;
  primaryCategory: string;
  secondaryCategories: string[];
  confidence: number;
  themes: Array<{
    name: string;
    relevance: number;
  }>;
}

export class CategorizeMessageUseCase {
  private readonly aiAnalysisPort: AIAnalysisPort;
  private readonly logger: pino.Logger;

  constructor(aiAnalysisPort: AIAnalysisPort) {
    this.aiAnalysisPort = aiAnalysisPort;
    this.logger = pino();
  }

  async execute(input: CategorizeMessageInput): Promise<CategorizeMessageOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Check service health
      const isHealthy = await this.aiAnalysisPort.isHealthy();
      if (!isHealthy) {
        throw new Error('AI service is not available');
      }

      // Build request for AI service
      const request: CategorizationRequest = {
        messageId: input.messageId,
        content: input.content,
        conversationContext: input.conversationContext,
        userId: input.userId,
        existingCategories: input.existingCategories,
      };

      // Call AI service
      const analysis: MessageAnalysis = await this.aiAnalysisPort.categorizeMessage(request);

      // Format output
      const categories = analysis.getCategories();
      const output: CategorizeMessageOutput = {
        messageId: analysis.getMessageId(),
        primaryCategory: categories.primary,
        secondaryCategories: categories.secondary || [],
        confidence: categories.confidence,
        themes: analysis.getThemes(),
      };

      this.logger.info(
        {
          messageId: input.messageId,
          primaryCategory: output.primaryCategory,
        },
        'Message categorization completed',
      );

      return output;
    } catch (error) {
      this.logger.error(
        { error, messageId: input.messageId },
        'Message categorization failed',
      );
      throw error;
    }
  }

  private validateInput(input: CategorizeMessageInput): void {
    if (!input.messageId || input.messageId.trim().length === 0) {
      throw new Error('messageId is required');
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

    if (input.existingCategories && !Array.isArray(input.existingCategories)) {
      throw new Error('existingCategories must be an array');
    }
  }
}
