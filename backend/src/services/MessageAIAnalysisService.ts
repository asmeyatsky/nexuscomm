/**
 * MessageAIAnalysisService
 * Service that automatically analyzes messages with AI upon creation.
 * Orchestrates sentiment, categorization, and optional suggestions.
 */

import pino from 'pino';
import { getAIAnalysisQueue, AIJobType, AIJobData } from '@queue/AIAnalysisQueue';
import { UserAIQuotaRepository } from '@infrastructure/repositories/UserAIQuotaRepository';
import { AppDataSource } from '@config/database';

export interface MessageAIAnalysisConfig {
  analyzeSentiment?: boolean;
  categorizeMessage?: boolean;
  generateSuggestions?: boolean;
  async?: boolean; // If true, queue for background processing
  toneForSuggestions?: 'professional' | 'casual' | 'empathetic' | 'humorous';
}

export class MessageAIAnalysisService {
  private logger: pino.Logger;
  private queue = getAIAnalysisQueue();
  private quotaRepository: UserAIQuotaRepository;

  constructor() {
    this.logger = pino();
    this.quotaRepository = new UserAIQuotaRepository(AppDataSource);
  }

  /**
   * Analyze a newly created message
   */
  async analyzeMessage(
    messageId: string,
    userId: string,
    content: string,
    conversationId: string,
    conversationContext?: string,
    config: MessageAIAnalysisConfig = {
      analyzeSentiment: true,
      categorizeMessage: true,
      generateSuggestions: false, // Only on demand
      async: false,
    },
  ): Promise<{ success: boolean; jobIds?: string[]; errors?: string[] }> {
    try {
      const jobIds: string[] = [];
      const errors: string[] = [];

      // Check user has quota for AI operations
      const canMakeRequest = await this.quotaRepository.canMakeRequest(userId, 200);
      if (!canMakeRequest.allowed) {
        this.logger.warn(
          { userId, reason: canMakeRequest.reason },
          'Cannot analyze message - quota exceeded',
        );
        return {
          success: false,
          errors: [canMakeRequest.reason || 'Quota exceeded'],
        };
      }

      // Queue sentiment analysis
      if (config.analyzeSentiment) {
        try {
          const jobData: AIJobData = {
            type: AIJobType.ANALYZE_SENTIMENT,
            userId,
            messageId,
            content,
            conversationContext,
          };

          if (config.async) {
            const job = await this.queue.enqueue(jobData);
            jobIds.push(job.id!);
            this.logger.debug(
              { jobId: job.id, messageId },
              'Queued sentiment analysis',
            );
          }
        } catch (error) {
          errors.push(`Sentiment analysis failed: ${(error as Error).message}`);
          this.logger.error(
            { error, messageId },
            'Failed to queue sentiment analysis',
          );
        }
      }

      // Queue categorization
      if (config.categorizeMessage) {
        try {
          const jobData: AIJobData = {
            type: AIJobType.CATEGORIZE_MESSAGE,
            userId,
            messageId,
            content,
            conversationContext,
          };

          if (config.async) {
            const job = await this.queue.enqueue(jobData);
            jobIds.push(job.id!);
            this.logger.debug(
              { jobId: job.id, messageId },
              'Queued categorization',
            );
          }
        } catch (error) {
          errors.push(`Categorization failed: ${(error as Error).message}`);
          this.logger.error(
            { error, messageId },
            'Failed to queue categorization',
          );
        }
      }

      // Queue reply suggestions
      if (config.generateSuggestions) {
        try {
          const jobData: AIJobData = {
            type: AIJobType.GENERATE_SUGGESTIONS,
            userId,
            messageId,
            conversationId,
            content,
            tone: config.toneForSuggestions,
            conversationContext,
          };

          if (config.async) {
            const job = await this.queue.enqueue(jobData);
            jobIds.push(job.id!);
            this.logger.debug(
              { jobId: job.id, messageId },
              'Queued suggestion generation',
            );
          }
        } catch (error) {
          errors.push(`Suggestion generation failed: ${(error as Error).message}`);
          this.logger.error(
            { error, messageId },
            'Failed to queue suggestion generation',
          );
        }
      }

      const success = jobIds.length > 0 && errors.length === 0;
      return {
        success,
        jobIds: jobIds.length > 0 ? jobIds : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(
        { error, messageId, userId },
        'Message analysis service error',
      );
      return {
        success: false,
        errors: ['Internal error during message analysis'],
      };
    }
  }

  /**
   * Batch analyze multiple messages
   */
  async analyzeMessages(
    messages: Array<{
      id: string;
      userId: string;
      content: string;
      conversationId: string;
      conversationContext?: string;
    }>,
    config?: MessageAIAnalysisConfig,
  ): Promise<{ analyzed: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let analyzed = 0;
    let failed = 0;

    for (const msg of messages) {
      try {
        const result = await this.analyzeMessage(
          msg.id,
          msg.userId,
          msg.content,
          msg.conversationId,
          msg.conversationContext,
          config,
        );

        if (result.success) {
          analyzed++;
        } else {
          failed++;
          if (result.errors) {
            errors.push(...result.errors);
          }
        }
      } catch (error) {
        failed++;
        errors.push(`Failed to analyze message ${msg.id}`);
      }
    }

    this.logger.info(
      { analyzed, failed, totalMessages: messages.length },
      'Batch message analysis completed',
    );

    return { analyzed, failed, errors };
  }

  /**
   * Get analysis status for a message
   */
  async getMessageAnalysisStatus(
    jobIds: string[],
  ): Promise<Array<{ jobId: string; status: string; progress: number }>> {
    const statuses = [];

    for (const jobId of jobIds) {
      try {
        const status = await this.queue.getJobStatus(jobId);
        statuses.push({
          jobId,
          status: status.status,
          progress: status.progress,
        });
      } catch (error) {
        this.logger.error({ error, jobId }, 'Failed to get job status');
      }
    }

    return statuses;
  }
}
