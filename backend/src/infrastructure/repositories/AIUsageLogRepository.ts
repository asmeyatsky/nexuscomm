/**
 * AIUsageLogRepository
 * Repository for logging and auditing all AI service operations.
 */

import { DataSource, Repository } from 'typeorm';
import { AIUsageLog, AIOperation, AIOperationStatus } from '../../models/AIUsageLog';
import pino from 'pino';

export interface LogAIOperationInput {
  userId: string;
  operation: AIOperation;
  model: string;
  status: AIOperationStatus;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  requestSize: number;
  responseSize: number;
  responseTimeMs: number;
  errorCode?: string;
  errorMessage?: string;
  messageId?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export class AIUsageLogRepository {
  private repository: Repository<AIUsageLog>;
  private logger: pino.Logger;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(AIUsageLog);
    this.logger = pino();
  }

  /**
   * Log an AI operation
   */
  async logOperation(input: LogAIOperationInput): Promise<AIUsageLog> {
    try {
      const log = this.repository.create({
        userId: input.userId,
        operation: input.operation,
        model: input.model,
        status: input.status,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens,
        estimatedCost: input.estimatedCost,
        requestSize: input.requestSize,
        responseSize: input.responseSize,
        responseTimeMs: input.responseTimeMs,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        messageId: input.messageId,
        conversationId: input.conversationId,
        metadata: input.metadata || {},
      });

      const saved = await this.repository.save(log);
      this.logger.debug(
        {
          userId: input.userId,
          operation: input.operation,
          status: input.status,
          cost: input.estimatedCost,
        },
        'Logged AI operation',
      );
      return saved;
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId, operation: input.operation },
        'Failed to log operation',
      );
      throw error;
    }
  }

  /**
   * Get user's operation logs
   */
  async getUserLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<AIUsageLog[]> {
    try {
      return await this.repository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to get user logs');
      throw error;
    }
  }

  /**
   * Get logs for a specific operation type
   */
  async getOperationLogs(
    operation: AIOperation,
    limit: number = 100,
    offset: number = 0,
  ): Promise<AIUsageLog[]> {
    try {
      return await this.repository.find({
        where: { operation },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.logger.error(
        { error, operation },
        'Failed to get operation logs',
      );
      throw error;
    }
  }

  /**
   * Get daily statistics for a user
   */
  async getUserDailyStats(userId: string): Promise<{
    totalOperations: number;
    totalTokens: number;
    totalCost: number;
    successCount: number;
    failureCount: number;
    avgResponseTimeMs: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const results = await this.repository
        .createQueryBuilder('log')
        .select('COUNT(*)', 'totalOperations')
        .addSelect('SUM(log.totalTokens)', 'totalTokens')
        .addSelect('SUM(log.estimatedCost)', 'totalCost')
        .addSelect(
          'SUM(CASE WHEN log.status = :success THEN 1 ELSE 0 END)',
          'successCount',
        )
        .addSelect(
          'SUM(CASE WHEN log.status != :success THEN 1 ELSE 0 END)',
          'failureCount',
        )
        .addSelect('AVG(log.responseTimeMs)', 'avgResponseTimeMs')
        .where('log.userId = :userId', { userId })
        .andWhere('log.createdAt >= :today', { today })
        .setParameters({ success: 'success' })
        .getRawOne();

      return {
        totalOperations: parseInt(results.totalOperations || 0),
        totalTokens: parseInt(results.totalTokens || 0),
        totalCost: parseFloat(results.totalCost || 0),
        successCount: parseInt(results.successCount || 0),
        failureCount: parseInt(results.failureCount || 0),
        avgResponseTimeMs: parseFloat(results.avgResponseTimeMs || 0),
      };
    } catch (error) {
      this.logger.error(
        { error, userId },
        'Failed to get daily statistics',
      );
      throw error;
    }
  }

  /**
   * Get monthly statistics for a user
   */
  async getUserMonthlyStats(userId: string): Promise<{
    totalOperations: number;
    totalTokens: number;
    totalCost: number;
    successCount: number;
    failureCount: number;
    operationBreakdown: Record<AIOperation, number>;
  }> {
    try {
      const today = new Date();
      const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

      const results = await this.repository
        .createQueryBuilder('log')
        .select('COUNT(*)', 'totalOperations')
        .addSelect('SUM(log.totalTokens)', 'totalTokens')
        .addSelect('SUM(log.estimatedCost)', 'totalCost')
        .addSelect(
          'SUM(CASE WHEN log.status = :success THEN 1 ELSE 0 END)',
          'successCount',
        )
        .addSelect(
          'SUM(CASE WHEN log.status != :success THEN 1 ELSE 0 END)',
          'failureCount',
        )
        .where('log.userId = :userId', { userId })
        .andWhere('log.createdAt >= :monthAgo', { monthAgo })
        .setParameters({ success: 'success' })
        .getRawOne();

      // Get breakdown by operation
      const breakdown = await this.repository
        .createQueryBuilder('log')
        .select('log.operation', 'operation')
        .addSelect('COUNT(*)', 'count')
        .where('log.userId = :userId', { userId })
        .andWhere('log.createdAt >= :monthAgo', { monthAgo })
        .groupBy('log.operation')
        .getRawMany();

      const operationBreakdown: Record<AIOperation, number> = {} as any;
      for (const row of breakdown) {
        operationBreakdown[row.operation as AIOperation] = parseInt(row.count);
      }

      return {
        totalOperations: parseInt(results.totalOperations || 0),
        totalTokens: parseInt(results.totalTokens || 0),
        totalCost: parseFloat(results.totalCost || 0),
        successCount: parseInt(results.successCount || 0),
        failureCount: parseInt(results.failureCount || 0),
        operationBreakdown,
      };
    } catch (error) {
      this.logger.error(
        { error, userId },
        'Failed to get monthly statistics',
      );
      throw error;
    }
  }

  /**
   * Get failure logs (for debugging)
   */
  async getFailedOperations(
    userId?: string,
    limit: number = 50,
  ): Promise<AIUsageLog[]> {
    try {
      const query = this.repository
        .createQueryBuilder('log')
        .where('log.status != :success', { success: 'success' });

      if (userId) {
        query.andWhere('log.userId = :userId', { userId });
      }

      return await query
        .orderBy('log.createdAt', 'DESC')
        .limit(limit)
        .getMany();
    } catch (error) {
      this.logger.error(
        { error, userId },
        'Failed to get failed operations',
      );
      throw error;
    }
  }

  /**
   * Cleanup old logs (retention policy)
   */
  async cleanupOldLogs(beforeDate: Date): Promise<number> {
    try {
      const result = await this.repository.delete({
        createdAt: { $lt: beforeDate },
      } as any);
      this.logger.info(
        { deletedCount: result.affected },
        'Cleaned up old AI usage logs',
      );
      return result.affected || 0;
    } catch (error) {
      this.logger.error(
        { error, beforeDate },
        'Failed to cleanup old logs',
      );
      throw error;
    }
  }
}
