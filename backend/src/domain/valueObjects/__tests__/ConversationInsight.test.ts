import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConversationInsight,
  type ParticipantStats,
  type EngagementTrend,
  type ConversationHealth,
  type TopicDistribution,
} from '../ConversationInsight';

describe('ConversationInsight', () => {
  let periodStart: Date;
  let periodEnd: Date;
  let participantStats: ParticipantStats[];
  let engagementTrends: EngagementTrend[];
  let health: ConversationHealth;
  let topTopics: TopicDistribution[];

  beforeEach(() => {
    periodStart = new Date('2025-01-01T00:00:00Z');
    periodEnd = new Date('2025-01-02T00:00:00Z');

    participantStats = [
      {
        userId: 'user-1',
        messageCount: 15,
        averageMessageLength: 120,
        responseTimeMs: 300000,
        sentimentTrend: 'improving',
        engagementLevel: 0.9,
      },
      {
        userId: 'user-2',
        messageCount: 12,
        averageMessageLength: 100,
        responseTimeMs: 450000,
        sentimentTrend: 'stable',
        engagementLevel: 0.8,
      },
    ];

    engagementTrends = [
      {
        period: '24h',
        messageCount: 50,
        activeParticipants: 2,
        trend: 'increasing',
        trendPercent: 25,
      },
    ];

    health = {
      score: 85,
      status: 'good',
      reasonsForScore: ['High engagement rate', 'Quick response times'],
      recommendations: ['Continue current pace', 'Monitor for fatigue'],
    };

    topTopics = [
      {
        topic: 'Project Updates',
        messageCount: 20,
        percentage: 40,
        sentiment: 'positive',
        trend: 'growing',
      },
      {
        topic: 'Technical Issues',
        messageCount: 15,
        percentage: 30,
        sentiment: 'neutral',
        trend: 'stable',
      },
    ];
  });

  describe('constructor', () => {
    it('should create a valid ConversationInsight', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      expect(insight.conversationId).toBe('conv-123');
      expect(insight.totalMessages).toBe(50);
      expect(insight.uniqueParticipants).toBe(2);
      expect(insight.averageSentiment).toBe('positive');
    });

    it('should throw error if conversationId is empty', () => {
      expect(() => {
        new ConversationInsight(
          '',
          periodStart,
          periodEnd,
          50,
          2,
          350000,
          participantStats,
          engagementTrends,
          health,
          topTopics,
          'positive',
          0.75,
        );
      }).toThrow('conversationId is required');
    });

    it('should throw error if periodEnd is not after periodStart', () => {
      const sametime = new Date(periodStart);
      expect(() => {
        new ConversationInsight(
          'conv-123',
          periodStart,
          sametime,
          50,
          2,
          350000,
          participantStats,
          engagementTrends,
          health,
          topTopics,
          'positive',
          0.75,
        );
      }).toThrow('periodEnd must be after periodStart');
    });

    it('should throw error if totalMessages is negative', () => {
      expect(() => {
        new ConversationInsight(
          'conv-123',
          periodStart,
          periodEnd,
          -1,
          2,
          350000,
          participantStats,
          engagementTrends,
          health,
          topTopics,
          'positive',
          0.75,
        );
      }).toThrow('totalMessages cannot be negative');
    });

    it('should throw error if uniqueParticipants is negative', () => {
      expect(() => {
        new ConversationInsight(
          'conv-123',
          periodStart,
          periodEnd,
          50,
          -1,
          350000,
          participantStats,
          engagementTrends,
          health,
          topTopics,
          'positive',
          0.75,
        );
      }).toThrow('uniqueParticipants cannot be negative');
    });

    it('should throw error if averageResponseTime is negative', () => {
      expect(() => {
        new ConversationInsight(
          'conv-123',
          periodStart,
          periodEnd,
          50,
          2,
          -1,
          participantStats,
          engagementTrends,
          health,
          topTopics,
          'positive',
          0.75,
        );
      }).toThrow('averageResponseTime cannot be negative');
    });

    it('should throw error if sentimentScore is below 0', () => {
      expect(() => {
        new ConversationInsight(
          'conv-123',
          periodStart,
          periodEnd,
          50,
          2,
          350000,
          participantStats,
          engagementTrends,
          health,
          topTopics,
          'positive',
          -0.1,
        );
      }).toThrow('sentimentScore must be between 0 and 1');
    });

    it('should throw error if sentimentScore is above 1', () => {
      expect(() => {
        new ConversationInsight(
          'conv-123',
          periodStart,
          periodEnd,
          50,
          2,
          350000,
          participantStats,
          engagementTrends,
          health,
          topTopics,
          'positive',
          1.5,
        );
      }).toThrow('sentimentScore must be between 0 and 1');
    });

    it('should throw error if health score is below 0', () => {
      const invalidHealth: ConversationHealth = {
        score: -1,
        status: 'poor',
        reasonsForScore: [],
        recommendations: [],
      };

      expect(() => {
        new ConversationInsight(
          'conv-123',
          periodStart,
          periodEnd,
          50,
          2,
          350000,
          participantStats,
          engagementTrends,
          invalidHealth,
          topTopics,
          'positive',
          0.75,
        );
      }).toThrow('health score must be between 0 and 100');
    });

    it('should throw error if health score is above 100', () => {
      const invalidHealth: ConversationHealth = {
        score: 101,
        status: 'excellent',
        reasonsForScore: [],
        recommendations: [],
      };

      expect(() => {
        new ConversationInsight(
          'conv-123',
          periodStart,
          periodEnd,
          50,
          2,
          350000,
          participantStats,
          engagementTrends,
          invalidHealth,
          topTopics,
          'positive',
          0.75,
        );
      }).toThrow('health score must be between 0 and 100');
    });

    it('should freeze arrays to prevent modification', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      expect(() => {
        (insight.participantStats as any).push({
          userId: 'user-3',
          messageCount: 0,
          averageMessageLength: 0,
          responseTimeMs: 0,
          sentimentTrend: 'stable',
          engagementLevel: 0,
        });
      }).toThrow();
    });
  });

  describe('getMostActiveParticipant', () => {
    it('should return participant with highest message count', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      const most = insight.getMostActiveParticipant();
      expect(most?.userId).toBe('user-1');
      expect(most?.messageCount).toBe(15);
    });

    it('should return null if no participants', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        0,
        0,
        0,
        [],
        engagementTrends,
        health,
        topTopics,
        'neutral',
        0.5,
      );

      const most = insight.getMostActiveParticipant();
      expect(most).toBeNull();
    });
  });

  describe('getOverallTrend', () => {
    it('should return trend for requested period', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      const trend = insight.getOverallTrend('24h');
      expect(trend).toBe('increasing');
    });

    it('should return null if period not found', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      const trend = insight.getOverallTrend('7d');
      expect(trend).toBeNull();
    });
  });

  describe('isHealthy', () => {
    it('should return true if health score >= 70', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      expect(insight.isHealthy()).toBe(true);
    });

    it('should return true for score exactly 70', () => {
      const healthScore70: ConversationHealth = {
        score: 70,
        status: 'good',
        reasonsForScore: [],
        recommendations: [],
      };

      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        healthScore70,
        topTopics,
        'positive',
        0.75,
      );

      expect(insight.isHealthy()).toBe(true);
    });

    it('should return false if health score < 70', () => {
      const unhealthy: ConversationHealth = {
        score: 65,
        status: 'fair',
        reasonsForScore: ['Low engagement'],
        recommendations: ['Increase interaction'],
      };

      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        unhealthy,
        topTopics,
        'negative',
        0.2,
      );

      expect(insight.isHealthy()).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return formatted summary with all metrics', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      const summary = insight.getSummary();

      expect(summary).toContain('Conversation Metrics');
      expect(summary).toContain('Total Messages: 50');
      expect(summary).toContain('Participants: 2');
      expect(summary).toContain('Avg per Participant: 25 messages');
      expect(summary).toContain('Avg Response Time: 5 minutes');
      expect(summary).toContain('Sentiment: positive');
      expect(summary).toContain('Health: GOOD (85/100)');
      expect(summary).toContain('Top Topic: Project Updates');
    });

    it('should calculate average per participant correctly', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        100,
        4,
        300000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      const summary = insight.getSummary();
      expect(summary).toContain('Avg per Participant: 25 messages');
    });

    it('should show period duration in hours', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-01T12:00:00Z');

      const insight = new ConversationInsight(
        'conv-123',
        start,
        end,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      const summary = insight.getSummary();
      expect(summary).toContain('(12h period)');
    });

    it('should handle no top topics gracefully', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        [],
        'positive',
        0.75,
      );

      const summary = insight.getSummary();
      expect(summary).toContain('Top Topic: N/A');
    });
  });

  describe('immutability', () => {
    it('should prevent modification of participantStats array', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      expect(() => {
        (insight.participantStats as any).push({
          userId: 'user-3',
          messageCount: 5,
          averageMessageLength: 100,
          responseTimeMs: 300000,
          sentimentTrend: 'stable',
          engagementLevel: 0.5,
        });
      }).toThrow();
    });

    it('should prevent modification of engagementTrends array', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      expect(() => {
        (insight.engagementTrends as any)[0].trend = 'decreasing';
      }).toThrow();
    });

    it('should prevent modification of health object', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      expect(() => {
        (insight.conversationHealth as any).score = 50;
      }).toThrow();
    });

    it('should prevent modification of topTopics array', () => {
      const insight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        350000,
        participantStats,
        engagementTrends,
        health,
        topTopics,
        'positive',
        0.75,
      );

      expect(() => {
        (insight.topTopics as any).push({
          topic: 'New Topic',
          messageCount: 10,
          percentage: 20,
          sentiment: 'neutral',
          trend: 'stable',
        });
      }).toThrow();
    });
  });
});
