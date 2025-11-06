/**
 * ConversationSummaryRepository
 * Repository adapter for managing conversation summaries.
 */

import { DataSource, Repository } from 'typeorm';
import { ConversationSummaryResult } from '../../models/ConversationSummaryResult';
import { ConversationSummary } from '../../domain/valueObjects/ConversationSummary';

export class ConversationSummaryRepository {
  private repository: Repository<ConversationSummaryResult>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(ConversationSummaryResult);
  }

  /**
   * Save a conversation summary
   */
  async saveSummary(
    conversationId: string,
    userId: string,
    summary: ConversationSummary,
  ): Promise<ConversationSummaryResult> {
    const existing = await this.repository.findOne({
      where: {
        conversationId,
        userId,
        summaryLength: summary.length,
      },
      order: { createdAt: 'DESC' },
    });

    if (existing) {
      existing.summary = summary.summary;
      existing.keyPoints = summary.keyPoints as any;
      existing.mainTopics = summary.mainTopics as any;
      existing.updatedAt = new Date();
      return this.repository.save(existing);
    }

    const result = this.repository.create({
      conversationId,
      userId,
      messageIds: summary.messageIds as any,
      summaryLength: summary.length,
      summary: summary.summary,
      keyPoints: summary.keyPoints as any,
      mainTopics: summary.mainTopics as any,
      participants: summary.participants as any,
      messageCount: summary.metrics.messageCount,
      wordCount: summary.metrics.wordCount,
      participantCount: summary.metrics.participantCount,
      topicCount: summary.metrics.topicCount,
      ttlMinutes: 1440, // 24 hours default
      expiresAt: summary.expiresAt,
    });

    return this.repository.save(result);
  }

  /**
   * Get latest summary for a conversation
   */
  async getLatestSummary(
    conversationId: string,
    length?: 'brief' | 'standard' | 'detailed',
  ): Promise<ConversationSummaryResult | null> {
    const query = this.repository
      .createQueryBuilder('summary')
      .where('summary.conversationId = :conversationId', { conversationId });

    if (length) {
      query.andWhere('summary.summaryLength = :length', { length });
    }

    return query
      .orderBy('summary.createdAt', 'DESC')
      .addOrderBy('summary.id', 'DESC')
      .limit(1)
      .getOne();
  }

  /**
   * Get summaries by conversation
   */
  async getSummariesByConversation(
    conversationId: string,
    limit: number = 10,
  ): Promise<ConversationSummaryResult[]> {
    return this.repository
      .createQueryBuilder('summary')
      .where('summary.conversationId = :conversationId', { conversationId })
      .andWhere('summary.expiresAt IS NULL OR summary.expiresAt > :now', { now: new Date() })
      .orderBy('summary.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get summaries by user
   */
  async getSummariesByUser(userId: string, limit: number = 20): Promise<ConversationSummaryResult[]> {
    return this.repository
      .createQueryBuilder('summary')
      .where('summary.userId = :userId', { userId })
      .orderBy('summary.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Delete expired summaries
   */
  async deleteExpiredSummaries(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('expiresAt IS NOT NULL AND expiresAt < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  /**
   * Delete summary by ID
   */
  async deleteSummary(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }
}
