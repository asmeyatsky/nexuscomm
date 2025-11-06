/**
 * MessageAIAnalysisHook
 * Hook that integrates AI analysis into the message creation lifecycle.
 * Automatically analyzes messages after creation based on configuration.
 */

import pino from 'pino';
import { MessageAIAnalysisService } from '@services/MessageAIAnalysisService';

export interface MessageCreatedEvent {
  id: string;
  userId: string;
  conversationId: string;
  content: string;
  conversationContext?: string;
}

export class MessageAIAnalysisHook {
  private logger: pino.Logger;
  private analysisService: MessageAIAnalysisService;

  constructor() {
    this.logger = pino();
    this.analysisService = new MessageAIAnalysisService();
  }

  /**
   * Process message after creation
   * Automatically analyzes the message with AI
   */
  async onMessageCreated(
    event: MessageCreatedEvent,
    options?: {
      analyzeSentiment?: boolean;
      categorizeMessage?: boolean;
      generateSuggestions?: boolean;
      async?: boolean;
      toneForSuggestions?: 'professional' | 'casual' | 'empathetic' | 'humorous';
    },
  ): Promise<void> {
    try {
      // Default: analyze sentiment and categorize asynchronously
      const config = {
        analyzeSentiment: options?.analyzeSentiment ?? true,
        categorizeMessage: options?.categorizeMessage ?? true,
        generateSuggestions: options?.generateSuggestions ?? false,
        async: options?.async ?? true, // Default to async for non-blocking
        toneForSuggestions: options?.toneForSuggestions,
      };

      const result = await this.analysisService.analyzeMessage(
        event.id,
        event.userId,
        event.content,
        event.conversationId,
        event.conversationContext,
        config,
      );

      if (!result.success) {
        this.logger.warn(
          { messageId: event.id, errors: result.errors },
          'AI analysis incomplete for message',
        );
        // Don't fail message creation if AI analysis fails
      } else {
        this.logger.debug(
          { messageId: event.id, jobIds: result.jobIds },
          'Message AI analysis queued',
        );
      }
    } catch (error) {
      this.logger.error(
        { error, messageId: event.id },
        'MessageAIAnalysisHook error - continuing without AI analysis',
      );
      // Never block message creation on AI analysis failure
    }
  }

  /**
   * Process multiple messages (batch operation)
   */
  async onMessagesBulkCreated(
    events: MessageCreatedEvent[],
    options?: {
      analyzeSentiment?: boolean;
      categorizeMessage?: boolean;
      async?: boolean;
    },
  ): Promise<void> {
    try {
      const config = {
        analyzeSentiment: options?.analyzeSentiment ?? true,
        categorizeMessage: options?.categorizeMessage ?? true,
        async: options?.async ?? true,
      };

      const result = await this.analysisService.analyzeMessages(events, config);

      this.logger.info(
        { analyzed: result.analyzed, failed: result.failed },
        'Bulk message AI analysis completed',
      );
    } catch (error) {
      this.logger.error(
        { error, count: events.length },
        'Bulk message analysis hook error',
      );
    }
  }
}

// Singleton instance
let messageAIAnalysisHook: MessageAIAnalysisHook;

export const getMessageAIAnalysisHook = (): MessageAIAnalysisHook => {
  if (!messageAIAnalysisHook) {
    messageAIAnalysisHook = new MessageAIAnalysisHook();
  }
  return messageAIAnalysisHook;
};
