/**
 * AIAdvancedController
 * HTTP controller for advanced AI features (summarization, scheduling, insights).
 */

import { Request, Response } from 'express';
import { SummarizeConversationUseCase } from '../application/use_cases/SummarizeConversationUseCase';
import { GetSmartScheduleRecommendationUseCase } from '../application/use_cases/GetSmartScheduleRecommendationUseCase';
import { GetConversationInsightsUseCase } from '../application/use_cases/GetConversationInsightsUseCase';
import pino from 'pino';

export class AIAdvancedController {
  private logger: pino.Logger;

  constructor(
    private summarizeUseCase: SummarizeConversationUseCase,
    private scheduleUseCase: GetSmartScheduleRecommendationUseCase,
    private insightsUseCase: GetConversationInsightsUseCase,
  ) {
    this.logger = pino();
  }

  /**
   * POST /api/ai/summarize
   * Summarize a conversation or thread
   */
  async summarizeConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, messageIds, length, context } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.summarizeUseCase.execute({
        conversationId,
        messageIds,
        length: length || 'standard',
        userId,
        context,
      });

      res.status(200).json({
        success: true,
        data: {
          conversationId: result.conversationId,
          summary: result.summary.summary,
          keyPoints: result.summary.keyPoints,
          mainTopics: result.summary.mainTopics,
          participants: result.summary.participants,
          formatted: result.formattedSummary,
        },
      });
    } catch (error) {
      this.logger.error({ error }, 'Summarization failed');
      res.status(500).json({
        error: `Summarization failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * POST /api/ai/schedule-recommendation
   * Get optimal send time for a message
   */
  async getSchedulingRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, participantIds, messagePreview, urgency, timezone, constraints } =
        req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.scheduleUseCase.execute({
        conversationId,
        userId,
        participantIds,
        messagePreview,
        urgency: urgency || 'medium',
        timezone,
        constraints,
      });

      res.status(200).json({
        success: true,
        data: {
          conversationId: result.conversationId,
          recommendedTime: result.recommendation.recommendedTime.toISOString(),
          engagementScore: result.recommendation.engagementScore,
          reason: result.recommendation.reason,
          summary: result.summary,
          alternatives: result.alternatives,
          urgency: result.recommendation.urgencyLevel,
        },
      });
    } catch (error) {
      this.logger.error({ error }, 'Scheduling recommendation failed');
      res.status(500).json({
        error: `Scheduling failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * GET /api/ai/insights/:conversationId
   * Get conversation insights and analytics
   */
  async getConversationInsights(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { periodStart, periodEnd, includePredictions } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!periodStart || !periodEnd) {
        res.status(400).json({ error: 'periodStart and periodEnd are required' });
        return;
      }

      const result = await this.insightsUseCase.execute({
        conversationId,
        periodStart: new Date(periodStart as string),
        periodEnd: new Date(periodEnd as string),
        includePredictions: includePredictions === 'true',
      });

      res.status(200).json({
        success: true,
        data: {
          conversationId: result.conversationId,
          summary: result.summary,
          metrics: {
            totalMessages: result.insights.totalMessages,
            uniqueParticipants: result.insights.uniqueParticipants,
            averageResponseTimeMs: result.insights.averageResponseTime,
            sentiment: result.insights.averageSentiment,
            sentimentScore: result.insights.sentimentScore,
          },
          health: {
            score: result.insights.conversationHealth.score,
            status: result.insights.conversationHealth.status,
            reasons: result.insights.conversationHealth.reasonsForScore,
          },
          topTopics: result.insights.topTopics,
          participants: result.insights.participantStats,
          recommendations: result.recommendations,
        },
      });
    } catch (error) {
      this.logger.error({ error }, 'Insights retrieval failed');
      res.status(500).json({
        error: `Insights failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * GET /api/ai/conversation-health/:conversationId
   * Quick health check for a conversation
   */
  async getConversationHealth(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get last 7 days of data
      const periodEnd = new Date();
      const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

      const result = await this.insightsUseCase.execute({
        conversationId,
        periodStart,
        periodEnd,
      });

      res.status(200).json({
        success: true,
        data: {
          conversationId: result.conversationId,
          health: {
            score: result.insights.conversationHealth.score,
            status: result.insights.conversationHealth.status,
            isHealthy: result.insights.isHealthy(),
          },
          sentiment: result.insights.averageSentiment,
          activeParticipants: result.insights.uniqueParticipants,
          messageCount: result.insights.totalMessages,
          recommendations: result.recommendations,
        },
      });
    } catch (error) {
      this.logger.error({ error }, 'Health check failed');
      res.status(500).json({
        error: `Health check failed: ${(error as Error).message}`,
      });
    }
  }
}
