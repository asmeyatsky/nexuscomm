/**
 * AIAsyncController
 * Controllers for async AI analysis operations using job queues.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { getAIAnalysisQueue, AIJobType, AIJobData } from '@queue/AIAnalysisQueue';

/**
 * POST /api/ai/analyze-sentiment/async
 * Queue sentiment analysis job for async processing
 */
export const analyzeSentimentAsync = asyncHandler(
  async (req: Request, res: Response) => {
    const queue = getAIAnalysisQueue();

    const jobData: AIJobData = {
      type: AIJobType.ANALYZE_SENTIMENT,
      userId: req.userId!,
      messageId: req.body.messageId,
      content: req.body.content,
      conversationContext: req.body.conversationContext,
    };

    const job = await queue.enqueue(jobData);

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: 'queued',
        message: 'Sentiment analysis queued for processing',
      },
      timestamp: new Date(),
    });
  },
);

/**
 * POST /api/ai/categorize-message/async
 * Queue message categorization job for async processing
 */
export const categorizeMessageAsync = asyncHandler(
  async (req: Request, res: Response) => {
    const queue = getAIAnalysisQueue();

    const jobData: AIJobData = {
      type: AIJobType.CATEGORIZE_MESSAGE,
      userId: req.userId!,
      messageId: req.body.messageId,
      content: req.body.content,
      conversationContext: req.body.conversationContext,
    };

    const job = await queue.enqueue(jobData);

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: 'queued',
        message: 'Message categorization queued for processing',
      },
      timestamp: new Date(),
    });
  },
);

/**
 * POST /api/ai/reply-suggestions/async
 * Queue reply suggestions job for async processing
 */
export const generateReplySuggestionsAsync = asyncHandler(
  async (req: Request, res: Response) => {
    const queue = getAIAnalysisQueue();

    const jobData: AIJobData = {
      type: AIJobType.GENERATE_SUGGESTIONS,
      userId: req.userId!,
      messageId: req.body.messageId,
      conversationId: req.body.conversationId,
      content: req.body.content,
      conversationHistory: req.body.conversationHistory,
      tone: req.body.tone,
      conversationContext: req.body.conversationContext,
    };

    const job = await queue.enqueue(jobData);

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: 'queued',
        message: 'Reply suggestions queued for processing',
      },
      timestamp: new Date(),
    });
  },
);

/**
 * GET /api/ai/jobs/:jobId
 * Check status of an async AI job
 */
export const getJobStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const queue = getAIAnalysisQueue();
    const { jobId } = req.params;

    const status = await queue.getJobStatus(jobId);

    if (status.status === 'not_found') {
      res.status(404).json({
        success: false,
        error: 'Job not found',
        code: 'JOB_NOT_FOUND',
        timestamp: new Date(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: status,
      timestamp: new Date(),
    });
  },
);

/**
 * GET /api/ai/queue/stats
 * Get current queue statistics
 */
export const getQueueStats = asyncHandler(
  async (req: Request, res: Response) => {
    const queue = getAIAnalysisQueue();
    const stats = await queue.getStats();

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        message: 'AI analysis queue statistics',
      },
      timestamp: new Date(),
    });
  },
);
