/**
 * GetSmartScheduleRecommendationUseCase
 * Application use case for AI-powered message scheduling recommendations.
 */

import {
  AIAdvancedPort,
  SchedulingRequest,
} from '../../domain/ports/AIAdvancedPort';
import { SmartScheduleRecommendation } from '../../domain/valueObjects/SmartScheduleRecommendation';
import pino from 'pino';

export interface GetSmartScheduleInput {
  conversationId: string;
  userId: string;
  participantIds: string[];
  messagePreview?: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  timezone?: string;
  constraints?: {
    notBefore?: Date;
    notAfter?: Date;
    preferredDays?: number[];
  };
}

export interface GetSmartScheduleOutput {
  conversationId: string;
  recommendation: SmartScheduleRecommendation;
  summary: string;
  alternatives: Array<{
    time: string;
    dayOfWeek: number;
    engagementScore: number;
  }>;
}

export class GetSmartScheduleRecommendationUseCase {
  private readonly aiAdvancedPort: AIAdvancedPort;
  private readonly logger: pino.Logger;

  constructor(aiAdvancedPort: AIAdvancedPort) {
    this.aiAdvancedPort = aiAdvancedPort;
    this.logger = pino();
  }

  async execute(input: GetSmartScheduleInput): Promise<GetSmartScheduleOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Check service health
      const isHealthy = await this.aiAdvancedPort.isHealthy();
      if (!isHealthy) {
        throw new Error('AI service is not available');
      }

      // Build request for AI service
      const request: SchedulingRequest = {
        conversationId: input.conversationId,
        userId: input.userId,
        participantIds: input.participantIds,
        messagePreview: input.messagePreview,
        urgency: input.urgency,
        timezone: input.timezone,
        constraints: input.constraints,
      };

      // Get scheduling recommendation
      const recommendation: SmartScheduleRecommendation =
        await this.aiAdvancedPort.getSchedulingRecommendation(request);

      // Adjust time based on urgency
      const adjustedTime = recommendation.getAdjustedTime();

      this.logger.info(
        {
          conversationId: input.conversationId,
          urgency: input.urgency,
          confidence: recommendation.engagementScore,
        },
        'Schedule recommendation generated',
      );

      return {
        conversationId: input.conversationId,
        recommendation,
        summary: recommendation.getSummary(),
        alternatives: recommendation.alternativeWindows.map((w) => ({
          time: this.formatWindowTime(w.dayOfWeek, w.hourStart, w.hourEnd),
          dayOfWeek: w.dayOfWeek,
          engagementScore: w.engagementScore,
        })),
      };
    } catch (error) {
      this.logger.error(
        { error, conversationId: input.conversationId },
        'Failed to get scheduling recommendation',
      );
      throw error;
    }
  }

  private validateInput(input: GetSmartScheduleInput): void {
    if (!input.conversationId || input.conversationId.trim().length === 0) {
      throw new Error('conversationId is required');
    }

    if (!input.userId || input.userId.trim().length === 0) {
      throw new Error('userId is required');
    }

    if (!Array.isArray(input.participantIds) || input.participantIds.length === 0) {
      throw new Error('at least one participantId is required');
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(input.urgency)) {
      throw new Error("urgency must be 'low', 'medium', 'high', or 'urgent'");
    }

    if (input.constraints?.notBefore && input.constraints?.notAfter) {
      if (input.constraints.notBefore >= input.constraints.notAfter) {
        throw new Error('notBefore must be before notAfter');
      }
    }

    if (input.constraints?.preferredDays) {
      if (!Array.isArray(input.constraints.preferredDays)) {
        throw new Error('preferredDays must be an array');
      }
      if (input.constraints.preferredDays.some((d) => d < 0 || d > 6)) {
        throw new Error('preferredDays must contain values 0-6');
      }
    }
  }

  private formatWindowTime(dayOfWeek: number, hourStart: number, hourEnd: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[dayOfWeek]} ${hourStart}:00-${hourEnd}:00`;
  }
}
