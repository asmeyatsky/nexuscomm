/**
 * ConversationInsightRepository
 * Repository adapter for managing conversation insights and analytics.
 */

import { DataSource, Repository } from 'typeorm';
import { ConversationInsightResult } from '../../models/ConversationInsightResult';
import { ConversationInsight } from '../../domain/valueObjects/ConversationInsight';

export class ConversationInsightRepository {
  private repository: Repository<ConversationInsightResult>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(ConversationInsightResult);
  }

  /**
   * Save conversation insight
   */
  async saveInsight(
    conversationId: string,
    insight: ConversationInsight,
  ): Promise<ConversationInsightResult> {
    const result = this.repository.create({
      conversationId,
      periodStart: insight.periodStart,
      periodEnd: insight.periodEnd,
      totalMessages: insight.totalMessages,
      uniqueParticipants: insight.uniqueParticipants,
      averageResponseTimeMs: insight.averageResponseTime,
      averageSentiment: insight.averageSentiment,
      sentimentScore: insight.sentimentScore,
      healthScore: insight.conversationHealth.score,
      healthStatus: insight.conversationHealth.status,
      healthReasons: insight.conversationHealth.reasonsForScore as any,
      recommendations: insight.conversationHealth.recommendations as any,
      topTopics: JSON.stringify(insight.topTopics),
      participantStats: JSON.stringify(insight.participantStats),
      engagementTrend:
        insight.engagementTrends.length > 0 ? insight.engagementTrends[0].trend : 'stable',
      trendPercent:
        insight.engagementTrends.length > 0 ? insight.engagementTrends[0].trendPercent : 0,
    });

    return this.repository.save(result);
  }

  /**
   * Get latest insight for conversation
   */
  async getLatestInsight(conversationId: string): Promise<ConversationInsightResult | null> {
    return this.repository
      .createQueryBuilder('insight')
      .where('insight.conversationId = :conversationId', { conversationId })
      .orderBy('insight.periodEnd', 'DESC')
      .limit(1)
      .getOne();
  }

  /**
   * Get insights by conversation
   */
  async getConversationInsights(
    conversationId: string,
    limit: number = 10,
  ): Promise<ConversationInsightResult[]> {
    return this.repository
      .createQueryBuilder('insight')
      .where('insight.conversationId = :conversationId', { conversationId })
      .orderBy('insight.periodEnd', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get insights by period
   */
  async getInsightsByPeriod(
    conversationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ConversationInsightResult[]> {
    return this.repository
      .createQueryBuilder('insight')
      .where('insight.conversationId = :conversationId', { conversationId })
      .andWhere('insight.periodStart >= :startDate', { startDate })
      .andWhere('insight.periodEnd <= :endDate', { endDate })
      .orderBy('insight.periodStart', 'ASC')
      .getMany();
  }

  /**
   * Get unhealthy conversations
   */
  async getUnhealthyConversations(threshold: number = 50): Promise<ConversationInsightResult[]> {
    return this.repository
      .createQueryBuilder('insight')
      .where('insight.healthScore < :threshold', { threshold })
      .orderBy('insight.healthScore', 'ASC')
      .limit(20)
      .getMany();
  }

  /**
   * Get trending topics across conversations
   */
  async getTrendingTopics(limit: number = 20): Promise<Array<{ topic: string; count: number }>> {
    const results = await this.repository
      .query(`
      SELECT
        json_array_elements(top_topics)->>'topic' as topic,
        COUNT(*) as count
      FROM conversation_insights
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY topic
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);

    return results;
  }

  /**
   * Get insights statistics
   */
  async getStatistics(): Promise<{
    totalInsights: number;
    averageHealth: number;
    healthyConversations: number;
    unhealthyConversations: number;
  }> {
    const results = await this.repository
      .createQueryBuilder('insight')
      .select('COUNT(*)', 'totalInsights')
      .addSelect('AVG(insight.healthScore)', 'averageHealth')
      .getRawOne();

    const healthy = await this.repository
      .count({ where: { healthStatus: 'good' } });

    const unhealthy = await this.repository.count({
      where: { healthStatus: 'poor' },
    });

    return {
      totalInsights: results.totalInsights || 0,
      averageHealth: Math.round(parseFloat(results.averageHealth) || 0),
      healthyConversations: healthy,
      unhealthyConversations: unhealthy,
    };
  }

  /**
   * Delete insights by conversation
   */
  async deleteConversationInsights(conversationId: string): Promise<number> {
    const result = await this.repository.delete({ conversationId });
    return result.affected || 0;
  }

  /**
   * Clean up old insights (older than 1 year)
   */
  async cleanupOldInsights(daysOld: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoff', { cutoff: cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
