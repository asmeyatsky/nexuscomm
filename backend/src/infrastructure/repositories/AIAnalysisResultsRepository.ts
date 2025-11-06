/**
 * AIAnalysisResultsRepository
 * Repository for storing and retrieving AI analysis results from database.
 */

import { DataSource, Repository } from 'typeorm';
import { MessageAnalysisResult } from '../../models/MessageAnalysisResult';
import { MessageAnalysis } from '../../domain/valueObjects/MessageAnalysis';
import pino from 'pino';

export class AIAnalysisResultsRepository {
  private repository: Repository<MessageAnalysisResult>;
  private logger: pino.Logger;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(MessageAnalysisResult);
    this.logger = pino();
  }

  /**
   * Save AI analysis results to database
   */
  async saveAnalysis(
    messageId: string,
    userId: string,
    analysis: MessageAnalysis,
  ): Promise<MessageAnalysisResult> {
    try {
      const sentiment = analysis.getSentiment();
      const categories = analysis.getCategories();
      const themes = analysis.getThemes();
      const insights = analysis.getKeyInsights();

      const result = this.repository.create({
        messageId,
        userId,
        sentimentPositive: sentiment.positive,
        sentimentNeutral: sentiment.neutral,
        sentimentNegative: sentiment.negative,
        sentiment: sentiment.overall,
        sentimentConfidence: sentiment.confidence,
        primaryCategory: categories.primary,
        secondaryCategories: categories.secondary || [],
        categoryConfidence: categories.confidence,
        themes,
        keyInsights: insights,
        summary: analysis.getSummary(),
        metadata: {
          analyzedAt: analysis.getAnalyzedAt(),
        },
      });

      const saved = await this.repository.save(result);
      this.logger.debug(
        { messageId, userId, analysisId: saved.id },
        'Analysis saved to database',
      );
      return saved;
    } catch (error) {
      this.logger.error(
        { error, messageId, userId },
        'Failed to save analysis to database',
      );
      throw new Error(`Failed to save analysis: ${(error as Error).message}`);
    }
  }

  /**
   * Get analysis results for a message
   */
  async getAnalysis(messageId: string): Promise<MessageAnalysisResult | null> {
    try {
      const result = await this.repository.findOne({
        where: { messageId },
      });
      return result || null;
    } catch (error) {
      this.logger.error(
        { error, messageId },
        'Failed to retrieve analysis from database',
      );
      throw error;
    }
  }

  /**
   * Get analysis results for all messages in conversation
   */
  async getConversationAnalyses(
    conversationId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<MessageAnalysisResult[]> {
    try {
      const results = await this.repository
        .createQueryBuilder('analysis')
        .innerJoin(
          'messages',
          'message',
          'message.id = analysis.messageId',
        )
        .where('message.conversationId = :conversationId', { conversationId })
        .orderBy('analysis.analyzedAt', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany();

      return results;
    } catch (error) {
      this.logger.error(
        { error, conversationId },
        'Failed to retrieve conversation analyses',
      );
      throw error;
    }
  }

  /**
   * Get user's analysis history
   */
  async getUserAnalysisHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<MessageAnalysisResult[]> {
    try {
      const results = await this.repository.find({
        where: { userId },
        order: { analyzedAt: 'DESC' },
        take: limit,
        skip: offset,
      });
      return results;
    } catch (error) {
      this.logger.error({ error, userId }, 'Failed to retrieve user analysis history');
      throw error;
    }
  }

  /**
   * Get sentiment statistics for a conversation
   */
  async getConversationSentimentStats(
    conversationId: string,
  ): Promise<{
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    averageConfidence: number;
  }> {
    try {
      const results = await this.repository
        .createQueryBuilder('analysis')
        .select('COUNT(*)', 'total')
        .addSelect(
          'SUM(CASE WHEN analysis.sentiment = :positive THEN 1 ELSE 0 END)',
          'positive',
        )
        .addSelect(
          'SUM(CASE WHEN analysis.sentiment = :neutral THEN 1 ELSE 0 END)',
          'neutral',
        )
        .addSelect(
          'SUM(CASE WHEN analysis.sentiment = :negative THEN 1 ELSE 0 END)',
          'negative',
        )
        .addSelect('AVG(analysis.sentimentConfidence)', 'averageConfidence')
        .innerJoin(
          'messages',
          'message',
          'message.id = analysis.messageId',
        )
        .where('message.conversationId = :conversationId', { conversationId })
        .setParameters({
          positive: 'positive',
          neutral: 'neutral',
          negative: 'negative',
        })
        .getRawOne();

      return {
        total: parseInt(results.total || 0),
        positive: parseInt(results.positive || 0),
        neutral: parseInt(results.neutral || 0),
        negative: parseInt(results.negative || 0),
        averageConfidence: parseFloat(results.averageConfidence || 0),
      };
    } catch (error) {
      this.logger.error(
        { error, conversationId },
        'Failed to get sentiment statistics',
      );
      throw error;
    }
  }

  /**
   * Get top categories for a conversation
   */
  async getTopCategories(
    conversationId: string,
    limit: number = 10,
  ): Promise<Array<{ category: string; count: number }>> {
    try {
      const results = await this.repository
        .createQueryBuilder('analysis')
        .select('analysis.primaryCategory', 'category')
        .addSelect('COUNT(*)', 'count')
        .innerJoin(
          'messages',
          'message',
          'message.id = analysis.messageId',
        )
        .where('message.conversationId = :conversationId', { conversationId })
        .groupBy('analysis.primaryCategory')
        .orderBy('count', 'DESC')
        .limit(limit)
        .getRawMany();

      return results.map((r) => ({
        category: r.category,
        count: parseInt(r.count),
      }));
    } catch (error) {
      this.logger.error(
        { error, conversationId },
        'Failed to get top categories',
      );
      throw error;
    }
  }

  /**
   * Delete old analysis results (for cleanup/retention policies)
   */
  async deleteOldAnalyses(beforeDate: Date): Promise<number> {
    try {
      const result = await this.repository.delete({
        analyzedAt: { $lt: beforeDate },
      } as any);
      this.logger.info(
        { deletedCount: result.affected },
        'Deleted old analysis results',
      );
      return result.affected || 0;
    } catch (error) {
      this.logger.error(
        { error, beforeDate },
        'Failed to delete old analyses',
      );
      throw error;
    }
  }
}
