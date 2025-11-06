/**
 * SummarizeConversationUseCase
 * Application use case that orchestrates conversation summarization.
 */

import {
  AIAdvancedPort,
  SummarizationRequest,
} from '../../domain/ports/AIAdvancedPort';
import { ConversationSummary } from '../../domain/valueObjects/ConversationSummary';
import pino from 'pino';

export interface SummarizeConversationInput {
  conversationId: string;
  messageIds: string[];
  length: 'brief' | 'standard' | 'detailed';
  userId: string;
  context?: string;
}

export interface SummarizeConversationOutput {
  conversationId: string;
  summary: ConversationSummary;
  formattedSummary: string;
}

export class SummarizeConversationUseCase {
  private readonly aiAdvancedPort: AIAdvancedPort;
  private readonly logger: pino.Logger;

  constructor(aiAdvancedPort: AIAdvancedPort) {
    this.aiAdvancedPort = aiAdvancedPort;
    this.logger = pino();
  }

  async execute(input: SummarizeConversationInput): Promise<SummarizeConversationOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Check service health
      const isHealthy = await this.aiAdvancedPort.isHealthy();
      if (!isHealthy) {
        throw new Error('AI service is not available');
      }

      // Build request for AI service
      const request: SummarizationRequest = {
        conversationId: input.conversationId,
        messageIds: input.messageIds,
        length: input.length,
        userId: input.userId,
        context: input.context,
      };

      // Perform summarization
      const summary: ConversationSummary =
        await this.aiAdvancedPort.summarizeConversation(request);

      this.logger.info(
        {
          conversationId: input.conversationId,
          messageCount: input.messageIds.length,
          length: input.length,
        },
        'Conversation summarized successfully',
      );

      return {
        conversationId: input.conversationId,
        summary,
        formattedSummary: summary.getFormattedSummary(),
      };
    } catch (error) {
      this.logger.error(
        { error, conversationId: input.conversationId },
        'Summarization failed',
      );
      throw error;
    }
  }

  private validateInput(input: SummarizeConversationInput): void {
    if (!input.conversationId || input.conversationId.trim().length === 0) {
      throw new Error('conversationId is required');
    }

    if (!Array.isArray(input.messageIds) || input.messageIds.length === 0) {
      throw new Error('at least one messageId is required');
    }

    if (input.messageIds.length > 1000) {
      throw new Error('cannot summarize more than 1000 messages');
    }

    if (!['brief', 'standard', 'detailed'].includes(input.length)) {
      throw new Error("length must be 'brief', 'standard', or 'detailed'");
    }

    if (!input.userId || input.userId.trim().length === 0) {
      throw new Error('userId is required');
    }

    if (input.context && input.context.length > 1000) {
      throw new Error('context must not exceed 1000 characters');
    }
  }
}
