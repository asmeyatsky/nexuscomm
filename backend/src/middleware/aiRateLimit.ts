/**
 * AI Rate Limiting Middleware
 * Checks user AI quotas and enforces rate limiting before operations.
 */

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@config/database';
import { UserAIQuotaRepository } from '@infrastructure/repositories/UserAIQuotaRepository';
import pino from 'pino';

const logger = pino();

/**
 * AI rate limit middleware
 * Check if user can make AI requests based on quotas
 */
export const aiRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const quotaRepository = new UserAIQuotaRepository(AppDataSource);
    const canMakeRequest = await quotaRepository.canMakeRequest(userId, 100); // Default estimate

    if (!canMakeRequest.allowed) {
      logger.warn(
        { userId, reason: canMakeRequest.reason },
        'AI request denied due to quota',
      );

      res.status(429).json({
        success: false,
        error: canMakeRequest.reason || 'Rate limited',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date(),
      });
      return;
    }

    // Attach quota repository to request for use in controllers
    (req as any).quotaRepository = quotaRepository;

    next();
  } catch (error) {
    logger.error({ error }, 'Error in AI rate limit middleware');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date(),
    });
  }
};

/**
 * Helper function to record AI usage
 */
export const recordAIUsage = async (
  userId: string,
  tokensUsed: number,
  cost: number,
): Promise<void> => {
  try {
    const quotaRepository = new UserAIQuotaRepository(AppDataSource);
    await quotaRepository.recordUsage(userId, tokensUsed, cost);
  } catch (error) {
    logger.error(
      { error, userId, tokensUsed, cost },
      'Failed to record AI usage',
    );
    // Don't throw - log but continue
  }
};

/**
 * Get user's AI usage stats
 */
export const getAIUsageStats = async (userId: string) => {
  try {
    const quotaRepository = new UserAIQuotaRepository(AppDataSource);
    return await quotaRepository.getUserUsageStats(userId);
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get AI usage stats');
    throw error;
  }
};
