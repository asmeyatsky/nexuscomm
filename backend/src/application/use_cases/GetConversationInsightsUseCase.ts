/**
 * GetConversationInsightsUseCase
 * Application use case for comprehensive conversation analytics and insights.
 */

import { AIAdvancedPort, InsightsRequest } from '../../domain/ports/AIAdvancedPort';
import { ConversationInsight } from '../../domain/valueObjects/ConversationInsight';
import pino from 'pino';

export interface GetConversationInsightsInput {
  conversationId: string;
  periodStart: Date;
  periodEnd: Date;
  userId?: string;
  includePredictions?: boolean;
}

export interface GetConversationInsightsOutput {
  conversationId: string;
  insights: ConversationInsight;
  summary: string;
  recommendations: string[];
}

export class GetConversationInsightsUseCase {
  private readonly aiAdvancedPort: AIAdvancedPort;
  private readonly logger: pino.Logger;

  constructor(aiAdvancedPort: AIAdvancedPort) {
    this.aiAdvancedPort = aiAdvancedPort;
    this.logger = pino();
  }

  async execute(input: GetConversationInsightsInput): Promise<GetConversationInsightsOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Check service health
      const isHealthy = await this.aiAdvancedPort.isHealthy();
      if (!isHealthy) {
        throw new Error('AI service is not available');
      }

      // Build request for AI service
      const request: InsightsRequest = {
        conversationId: input.conversationId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        userId: input.userId,
        includePredictions: input.includePredictions,
      };

      // Analyze conversation
      const insights: ConversationInsight = await this.aiAdvancedPort.analyzeConversation(
        request,
      );

      this.logger.info(
        {
          conversationId: input.conversationId,
          health: insights.conversationHealth.status,
          sentiment: insights.averageSentiment,
          participants: insights.uniqueParticipants,
        },
        'Conversation insights generated',
      );

      return {
        conversationId: input.conversationId,
        insights,
        summary: insights.getSummary(),
        recommendations: insights.conversationHealth.recommendations,
      };
    } catch (error) {
      this.logger.error(
        { error, conversationId: input.conversationId },
        'Failed to get conversation insights',
      );
      throw error;
    }
  }

  private validateInput(input: GetConversationInsightsInput): void {
    if (!input.conversationId || input.conversationId.trim().length === 0) {
      throw new Error('conversationId is required');
    }

    if (!input.periodStart || !(input.periodStart instanceof Date)) {
      throw new Error('periodStart must be a valid Date');
    }

    if (!input.periodEnd || !(input.periodEnd instanceof Date)) {
      throw new Error('periodEnd must be a valid Date');
    }

    if (input.periodEnd <= input.periodStart) {
      throw new Error('periodEnd must be after periodStart');
    }

    // Validate period is not too large (max 1 year)
    const maxPeriodMs = 365 * 24 * 60 * 60 * 1000;
    const periodDuration = input.periodEnd.getTime() - input.periodStart.getTime();
    if (periodDuration > maxPeriodMs) {
      throw new Error('period cannot exceed 1 year');
    }

    // Validate period is not too small (min 1 minute)
    const minPeriodMs = 60 * 1000;
    if (periodDuration < minPeriodMs) {
      throw new Error('period must be at least 1 minute');
    }

    if (input.userId && input.userId.trim().length === 0) {
      throw new Error('userId must not be empty if provided');
    }
  }
}
