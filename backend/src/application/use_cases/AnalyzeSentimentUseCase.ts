/**
 * AnalyzeSentimentUseCase
 * Application use case that orchestrates sentiment analysis of messages.
 * Uses the AI analysis port to determine emotional tone and sentiment of message content.
 */

import { MessageAnalysis } from '../../domain/valueObjects/MessageAnalysis';
import {
  AIAnalysisPort,
  SentimentAnalysisRequest,
} from '../../domain/ports/AIAnalysisPort';
import pino from 'pino';

export interface AnalyzeSentimentInput {
  messageId: string;
  content: string;
  conversationContext?: string;
  userId: string;
}

export interface AnalyzeSentimentOutput {
  messageId: string;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    overall: string;
    confidence: number;
  };
  keyInsights: string[];
  tone: string;
}

export class AnalyzeSentimentUseCase {
  private readonly aiAnalysisPort: AIAnalysisPort;
  private readonly logger: pino.Logger;

  constructor(aiAnalysisPort: AIAnalysisPort) {
    this.aiAnalysisPort = aiAnalysisPort;
    this.logger = pino();
  }

  async execute(input: AnalyzeSentimentInput): Promise<AnalyzeSentimentOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Check service health
      const isHealthy = await this.aiAnalysisPort.isHealthy();
      if (!isHealthy) {
        throw new Error('AI service is not available');
      }

      // Build request for AI service
      const request: SentimentAnalysisRequest = {
        messageId: input.messageId,
        content: input.content,
        conversationContext: input.conversationContext,
        userId: input.userId,
      };

      // Call AI service
      const analysis: MessageAnalysis = await this.aiAnalysisPort.analyzeSentiment(request);

      // Format output
      const output: AnalyzeSentimentOutput = {
        messageId: analysis.getMessageId(),
        sentiment: analysis.getSentiment(),
        keyInsights: analysis.getKeyInsights(),
        tone: analysis.getToneDescription(),
      };

      this.logger.info(
        { messageId: input.messageId, sentiment: output.sentiment.overall },
        'Sentiment analysis completed',
      );

      return output;
    } catch (error) {
      this.logger.error(
        { error, messageId: input.messageId },
        'Sentiment analysis failed',
      );
      throw error;
    }
  }

  private validateInput(input: AnalyzeSentimentInput): void {
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
  }
}
