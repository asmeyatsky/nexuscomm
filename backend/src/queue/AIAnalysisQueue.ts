/**
 * AIAnalysisQueue
 * Bull queue for async AI analysis jobs (sentiment, categorization, suggestions).
 */

import Bull, { Queue, Job } from 'bull';
import pino from 'pino';
import { AnalyzeSentimentUseCase } from '@application/use_cases/AnalyzeSentimentUseCase';
import { CategorizeMessageUseCase } from '@application/use_cases/CategorizeMessageUseCase';
import { GenerateReplySuggestionsUseCase } from '@application/use_cases/GenerateReplySuggestionsUseCase';
import diConfig from '@infrastructure/config/DependencyInjectionConfig';

const logger = pino();

export enum AIJobType {
  ANALYZE_SENTIMENT = 'analyze_sentiment',
  CATEGORIZE_MESSAGE = 'categorize_message',
  GENERATE_SUGGESTIONS = 'generate_suggestions',
}

export interface AIJobData {
  type: AIJobType;
  userId: string;
  messageId: string;
  content: string;
  conversationContext?: string;
  conversationId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  tone?: 'professional' | 'casual' | 'empathetic' | 'humorous';
}

export class AIAnalysisQueue {
  private queue: Queue<AIJobData>;
  private analyzeSentimentUseCase: AnalyzeSentimentUseCase;
  private categorizeMessageUseCase: CategorizeMessageUseCase;
  private generateReplySuggestionsUseCase: GenerateReplySuggestionsUseCase;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://127.0.0.1:6379') {
    this.queue = new Bull<AIJobData>('ai-analysis', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    });

    this.analyzeSentimentUseCase = diConfig.getAnalyzeSentimentUseCase();
    this.categorizeMessageUseCase = diConfig.getCategorizeMessageUseCase();
    this.generateReplySuggestionsUseCase = diConfig.getGenerateReplySuggestionsUseCase();

    this.setupProcessors();
    this.setupEventHandlers();
  }

  /**
   * Queue a job for async processing
   */
  async enqueue(jobData: AIJobData): Promise<Job<AIJobData>> {
    try {
      const job = await this.queue.add(jobData, {
        jobId: `${jobData.type}-${jobData.messageId}-${Date.now()}`,
      });
      logger.debug(
        { jobId: job.id, type: jobData.type },
        'Enqueued AI analysis job',
      );
      return job;
    } catch (error) {
      logger.error(
        { error, type: jobData.type, messageId: jobData.messageId },
        'Failed to enqueue AI job',
      );
      throw error;
    }
  }

  /**
   * Setup job processors
   */
  private setupProcessors(): void {
    this.queue.process(async (job: Job<AIJobData>) => {
      const startTime = Date.now();
      const { type, userId, messageId, content, conversationContext } = job.data;

      try {
        logger.info({ jobId: job.id, type }, 'Processing AI job');

        let result;
        switch (type) {
          case AIJobType.ANALYZE_SENTIMENT:
            result = await this.analyzeSentimentUseCase.execute({
              messageId,
              content,
              userId,
              conversationContext,
            });
            break;

          case AIJobType.CATEGORIZE_MESSAGE:
            result = await this.categorizeMessageUseCase.execute({
              messageId,
              content,
              userId,
              conversationContext,
            });
            break;

          case AIJobType.GENERATE_SUGGESTIONS:
            result = await this.generateReplySuggestionsUseCase.execute({
              messageId,
              conversationId: job.data.conversationId!,
              content,
              userId,
              conversationHistory: job.data.conversationHistory,
              tone: job.data.tone,
              conversationContext,
            });
            break;

          default:
            throw new Error(`Unknown job type: ${type}`);
        }

        const processingTime = Date.now() - startTime;
        logger.info(
          { jobId: job.id, type, processingTime },
          'AI job completed',
        );

        return result;
      } catch (error) {
        logger.error(
          { error, jobId: job.id, type },
          'AI job processing failed',
        );
        throw error;
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.queue.on('completed', (job: Job<AIJobData>) => {
      logger.debug({ jobId: job.id, type: job.data.type }, 'AI job completed');
    });

    this.queue.on('failed', (job: Job<AIJobData>, err: Error) => {
      logger.error(
        { jobId: job.id, type: job.data.type, error: err },
        'AI job failed',
      );
    });

    this.queue.on('error', (error: Error) => {
      logger.error({ error }, 'Queue error');
    });

    this.queue.on('stalled', (job: Job<AIJobData>) => {
      logger.warn({ jobId: job.id, type: job.data.type }, 'Job stalled');
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    data?: any;
    error?: string;
  }> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return { status: 'not_found', progress: 0 };
      }

      const state = await job.getState();
      const progress = job.progress();
      const result = job.returnvalue;
      const failedReason = job.failedReason;

      return {
        status: state,
        progress,
        data: result,
        error: failedReason,
      };
    } catch (error) {
      logger.error({ error, jobId }, 'Failed to get job status');
      throw error;
    }
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const counts = await this.queue.getJobCounts();
      return {
        waiting: counts.wait,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get queue stats');
      throw error;
    }
  }

  /**
   * Clear completed/failed jobs (maintenance)
   */
  async cleanup(olderThan: number = 86400000): Promise<void> {
    try {
      await this.queue.clean(olderThan, 'completed');
      await this.queue.clean(olderThan, 'failed');
      logger.info('Queue cleanup completed');
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup queue');
      throw error;
    }
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
    logger.info('AI Analysis Queue closed');
  }
}

// Singleton instance
let aiAnalysisQueue: AIAnalysisQueue;

export const getAIAnalysisQueue = (): AIAnalysisQueue => {
  if (!aiAnalysisQueue) {
    aiAnalysisQueue = new AIAnalysisQueue();
  }
  return aiAnalysisQueue;
};
