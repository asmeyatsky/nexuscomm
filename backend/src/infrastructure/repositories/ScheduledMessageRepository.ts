/**
 * ScheduledMessageRepository
 * Repository adapter for managing scheduled messages.
 */

import { DataSource, Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import { ScheduledMessage } from '../../models/ScheduledMessage';

export interface ScheduledMessageInput {
  conversationId: string;
  userId: string;
  content: string;
  scheduledTime: Date;
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  engagementScore?: number;
  schedulingReason?: string;
  alternativeTimeWindows?: string[];
  metadata?: Record<string, any>;
}

export class ScheduledMessageRepository {
  private repository: Repository<ScheduledMessage>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(ScheduledMessage);
  }

  /**
   * Create a scheduled message
   */
  async createScheduledMessage(input: ScheduledMessageInput): Promise<ScheduledMessage> {
    const message = this.repository.create({
      conversationId: input.conversationId,
      userId: input.userId,
      content: input.content,
      scheduledTime: input.scheduledTime,
      urgency: input.urgency,
      engagementScore: input.engagementScore,
      schedulingReason: input.schedulingReason,
      alternativeTimeWindows: input.alternativeTimeWindows as any,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      status: 'pending',
      retryCount: 0,
    });

    return this.repository.save(message);
  }

  /**
   * Get scheduled message by ID
   */
  async getScheduledMessage(id: string): Promise<ScheduledMessage | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Get pending messages ready to send (scheduled time has passed)
   */
  async getPendingMessagesReadyToSend(
    limit: number = 100,
  ): Promise<ScheduledMessage[]> {
    return this.repository
      .createQueryBuilder('message')
      .where('message.status = :status', { status: 'pending' })
      .andWhere('message.scheduledTime <= :now', { now: new Date() })
      .orderBy('message.scheduledTime', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get scheduled messages for user
   */
  async getUserScheduledMessages(
    userId: string,
    status?: 'pending' | 'sent' | 'failed' | 'cancelled',
  ): Promise<ScheduledMessage[]> {
    const query = this.repository
      .createQueryBuilder('message')
      .where('message.userId = :userId', { userId });

    if (status) {
      query.andWhere('message.status = :status', { status });
    }

    return query.orderBy('message.scheduledTime', 'DESC').getMany();
  }

  /**
   * Get scheduled messages for conversation
   */
  async getConversationScheduledMessages(conversationId: string): Promise<ScheduledMessage[]> {
    return this.repository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .where('message.status IN (:...statuses)', { statuses: ['pending', 'sent'] })
      .orderBy('message.scheduledTime', 'DESC')
      .getMany();
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    id: string,
    status: 'sent' | 'failed' | 'cancelled',
    errorMessage?: string,
  ): Promise<ScheduledMessage | null> {
    const message = await this.repository.findOne({ where: { id } });
    if (!message) return null;

    message.status = status;
    if (status === 'sent') {
      message.sentAt = new Date();
    }
    if (errorMessage) {
      message.errorMessage = errorMessage;
    }

    return this.repository.save(message);
  }

  /**
   * Update retry count
   */
  async incrementRetryCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'retryCount', 1);
  }

  /**
   * Delete scheduled message
   */
  async deleteScheduledMessage(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  /**
   * Cancel all pending messages for user
   */
  async cancelUserPendingMessages(userId: string): Promise<number> {
    const result = await this.repository.update(
      { userId, status: 'pending' },
      { status: 'cancelled' },
    );
    return result.affected || 0;
  }

  /**
   * Clean up old messages (sent/failed/cancelled older than 30 days)
   */
  async cleanupOldMessages(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', { statuses: ['sent', 'failed', 'cancelled'] })
      .andWhere('updatedAt < :cutoff', { cutoff: cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    const query = this.repository.createQueryBuilder('message');

    if (userId) {
      query.where('message.userId = :userId', { userId });
    }

    const [total, pending, sent, failed, cancelled] = await Promise.all([
      query.clone().getCount(),
      query
        .clone()
        .where(`${userId ? 'message.userId = :userId AND ' : ''}message.status = :status`, {
          userId,
          status: 'pending',
        })
        .getCount(),
      query
        .clone()
        .where(`${userId ? 'message.userId = :userId AND ' : ''}message.status = :status`, {
          userId,
          status: 'sent',
        })
        .getCount(),
      query
        .clone()
        .where(`${userId ? 'message.userId = :userId AND ' : ''}message.status = :status`, {
          userId,
          status: 'failed',
        })
        .getCount(),
      query
        .clone()
        .where(`${userId ? 'message.userId = :userId AND ' : ''}message.status = :status`, {
          userId,
          status: 'cancelled',
        })
        .getCount(),
    ]);

    return { total, pending, sent, failed, cancelled };
  }
}
