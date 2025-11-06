/**
 * UserAIQuotaRepository
 * Repository for managing user AI usage quotas and rate limiting.
 */

import { DataSource, Repository } from 'typeorm';
import { UserAIQuota } from '../../models/UserAIQuota';
import pino from 'pino';

export class UserAIQuotaRepository {
  private repository: Repository<UserAIQuota>;
  private logger: pino.Logger;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserAIQuota);
    this.logger = pino();
  }

  /**
   * Get or create AI quota for user
   */
  async getOrCreateQuota(userId: string): Promise<UserAIQuota> {
    try {
      let quota = await this.repository.findOne({ where: { userId } });

      if (!quota) {
        const now = new Date();
        quota = this.repository.create({
          userId,
          dayResetDate: this.getNextDayReset(now),
          monthResetDate: this.getNextMonthReset(now),
        });
        await this.repository.save(quota);
        this.logger.info({ userId }, 'Created new AI quota for user');
      }

      return quota;
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to get or create quota');
      throw error;
    }
  }

  /**
   * Check if user can make AI request (under quota)
   */
  async canMakeRequest(
    userId: string,
    estimatedTokens: number = 100,
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const quota = await this.getOrCreateQuota(userId);

      // Check if user is rate limited
      if (quota.isRateLimited) {
        if (quota.rateLimitResetAt && quota.rateLimitResetAt > new Date()) {
          return {
            allowed: false,
            reason: 'User is currently rate limited',
          };
        } else {
          // Reset rate limiting
          quota.isRateLimited = false;
          quota.rateLimitResetAt = null;
          await this.repository.save(quota);
        }
      }

      // Check if user is active
      if (!quota.isActive) {
        return {
          allowed: false,
          reason: `AI features disabled: ${quota.disabledReason}`,
        };
      }

      // Reset daily counters if needed
      if (new Date() > quota.dayResetDate) {
        quota.requestsToday = 0;
        quota.tokensUsedToday = 0;
        quota.costToday = 0;
        quota.dayResetDate = this.getNextDayReset(new Date());
      }

      // Reset monthly counters if needed
      if (new Date() > quota.monthResetDate) {
        quota.requestsThisMonth = 0;
        quota.tokensUsedThisMonth = 0;
        quota.costThisMonth = 0;
        quota.monthResetDate = this.getNextMonthReset(new Date());
      }

      // Check daily request limit
      if (quota.requestsToday >= quota.dailyRequestLimit) {
        return {
          allowed: false,
          reason: 'Daily request limit exceeded',
        };
      }

      // Check daily token limit
      if (quota.tokensUsedToday + estimatedTokens > quota.dailyTokenLimit) {
        return {
          allowed: false,
          reason: 'Daily token limit would be exceeded',
        };
      }

      // Check daily cost limit
      const estimatedCost = (estimatedTokens * 15) / 1000000; // Sonnet output pricing
      if (quota.costToday + estimatedCost > quota.dailyCostLimit) {
        return {
          allowed: false,
          reason: 'Daily cost limit would be exceeded',
        };
      }

      // Check monthly limits
      if (quota.requestsThisMonth >= quota.monthlyRequestLimit) {
        return {
          allowed: false,
          reason: 'Monthly request limit exceeded',
        };
      }

      if (
        quota.tokensUsedThisMonth + estimatedTokens >
        quota.monthlyTokenLimit
      ) {
        return {
          allowed: false,
          reason: 'Monthly token limit would be exceeded',
        };
      }

      if (quota.costThisMonth + estimatedCost > quota.monthlyCostLimit) {
        return {
          allowed: false,
          reason: 'Monthly cost limit would be exceeded',
        };
      }

      return { allowed: true };
    } catch (error) {
      this.logger.error(
        { error, userId },
        'Failed to check request eligibility',
      );
      throw error;
    }
  }

  /**
   * Record AI operation usage
   */
  async recordUsage(
    userId: string,
    tokensUsed: number,
    cost: number,
  ): Promise<void> {
    try {
      const quota = await this.getOrCreateQuota(userId);

      // Update daily counters
      quota.requestsToday += 1;
      quota.tokensUsedToday += tokensUsed;
      quota.costToday += cost;

      // Update monthly counters
      quota.requestsThisMonth += 1;
      quota.tokensUsedThisMonth += tokensUsed;
      quota.costThisMonth += cost;

      quota.updatedAt = new Date();

      await this.repository.save(quota);
      this.logger.debug(
        { userId, tokensUsed, cost },
        'Recorded AI usage',
      );
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to record usage');
      throw error;
    }
  }

  /**
   * Apply rate limiting to user
   */
  async rateLimit(userId: string, durationMs: number = 3600000): Promise<void> {
    try {
      const quota = await this.getOrCreateQuota(userId);
      quota.isRateLimited = true;
      quota.rateLimitResetAt = new Date(Date.now() + durationMs);
      await this.repository.save(quota);
      this.logger.warn({ userId, durationMs }, 'Applied rate limiting');
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to apply rate limiting');
      throw error;
    }
  }

  /**
   * Disable AI features for user
   */
  async disableAIFeatures(userId: string, reason: string): Promise<void> {
    try {
      const quota = await this.getOrCreateQuota(userId);
      quota.isActive = false;
      quota.disabledReason = reason;
      await this.repository.save(quota);
      this.logger.warn({ userId, reason }, 'Disabled AI features for user');
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to disable AI features');
      throw error;
    }
  }

  /**
   * Re-enable AI features for user
   */
  async enableAIFeatures(userId: string): Promise<void> {
    try {
      const quota = await this.getOrCreateQuota(userId);
      quota.isActive = true;
      quota.disabledReason = null;
      await this.repository.save(quota);
      this.logger.info({ userId }, 'Enabled AI features for user');
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to enable AI features');
      throw error;
    }
  }

  /**
   * Get user's current usage stats
   */
  async getUserUsageStats(userId: string): Promise<{
    todayRequests: number;
    todayTokens: number;
    todayCost: number;
    monthRequests: number;
    monthTokens: number;
    monthCost: number;
    dailyLimitRemaining: number;
    monthlyLimitRemaining: number;
  }> {
    try {
      const quota = await this.getOrCreateQuota(userId);
      return {
        todayRequests: quota.requestsToday,
        todayTokens: quota.tokensUsedToday,
        todayCost: quota.costToday,
        monthRequests: quota.requestsThisMonth,
        monthTokens: quota.tokensUsedThisMonth,
        monthCost: quota.costThisMonth,
        dailyLimitRemaining: Math.max(0, quota.dailyRequestLimit - quota.requestsToday),
        monthlyLimitRemaining: Math.max(
          0,
          quota.monthlyRequestLimit - quota.requestsThisMonth,
        ),
      };
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to get usage stats');
      throw error;
    }
  }

  /**
   * Update user's quotas
   */
  async updateQuotaLimits(
    userId: string,
    updates: Partial<UserAIQuota>,
  ): Promise<UserAIQuota> {
    try {
      const quota = await this.getOrCreateQuota(userId);
      Object.assign(quota, updates, { updatedAt: new Date() });
      const updated = await this.repository.save(quota);
      this.logger.info({ userId }, 'Updated quota limits');
      return updated;
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to update quota limits');
      throw error;
    }
  }

  // Helper methods

  private getNextDayReset(from: Date): Date {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  private getNextMonthReset(from: Date): Date {
    const next = new Date(from);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}
