/**
 * ConversationInsight
 * Immutable value object representing analytics and insights about a conversation.
 */

export interface ParticipantStats {
  userId: string;
  messageCount: number;
  averageMessageLength: number;
  responseTimeMs: number; // Average time to respond
  sentimentTrend: 'improving' | 'declining' | 'stable';
  engagementLevel: number; // 0-1
}

export interface EngagementTrend {
  period: '1h' | '24h' | '7d' | '30d';
  messageCount: number;
  activeParticipants: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercent: number; // -100 to 100
}

export interface ConversationHealth {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor';
  reasonsForScore: string[];
  recommendations: string[];
}

export interface TopicDistribution {
  topic: string;
  messageCount: number;
  percentage: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative';
  trend: 'growing' | 'declining' | 'stable';
}

export class ConversationInsight {
  readonly conversationId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly totalMessages: number;
  readonly uniqueParticipants: number;
  readonly averageResponseTime: number; // milliseconds
  readonly participantStats: ParticipantStats[];
  readonly engagementTrends: EngagementTrend[];
  readonly conversationHealth: ConversationHealth;
  readonly topTopics: TopicDistribution[];
  readonly averageSentiment: 'positive' | 'neutral' | 'negative';
  readonly sentimentScore: number; // 0-1
  readonly generatedAt: Date;

  constructor(
    conversationId: string,
    periodStart: Date,
    periodEnd: Date,
    totalMessages: number,
    uniqueParticipants: number,
    averageResponseTime: number,
    participantStats: ParticipantStats[],
    engagementTrends: EngagementTrend[],
    conversationHealth: ConversationHealth,
    topTopics: TopicDistribution[],
    averageSentiment: 'positive' | 'neutral' | 'negative',
    sentimentScore: number,
    generatedAt: Date = new Date(),
  ) {
    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error('conversationId is required');
    }

    if (periodEnd <= periodStart) {
      throw new Error('periodEnd must be after periodStart');
    }

    if (totalMessages < 0) {
      throw new Error('totalMessages cannot be negative');
    }

    if (uniqueParticipants < 0) {
      throw new Error('uniqueParticipants cannot be negative');
    }

    if (averageResponseTime < 0) {
      throw new Error('averageResponseTime cannot be negative');
    }

    if (sentimentScore < 0 || sentimentScore > 1) {
      throw new Error('sentimentScore must be between 0 and 1');
    }

    if (conversationHealth.score < 0 || conversationHealth.score > 100) {
      throw new Error('health score must be between 0 and 100');
    }

    this.conversationId = conversationId;
    this.periodStart = new Date(periodStart);
    this.periodEnd = new Date(periodEnd);
    this.totalMessages = totalMessages;
    this.uniqueParticipants = uniqueParticipants;
    this.averageResponseTime = averageResponseTime;
    this.participantStats = Object.freeze([...participantStats]);
    this.engagementTrends = Object.freeze([...engagementTrends]);
    this.conversationHealth = Object.freeze({ ...conversationHealth });
    this.topTopics = Object.freeze([...topTopics]);
    this.averageSentiment = averageSentiment;
    this.sentimentScore = sentimentScore;
    this.generatedAt = new Date(generatedAt);
  }

  /**
   * Get most active participant
   */
  getMostActiveParticipant(): ParticipantStats | null {
    return this.participantStats.length > 0
      ? this.participantStats.reduce((prev, current) =>
          prev.messageCount > current.messageCount ? prev : current,
        )
      : null;
  }

  /**
   * Get trend direction from engagement trends
   */
  getOverallTrend(period: '1h' | '24h' | '7d' | '30d'): 'increasing' | 'decreasing' | 'stable' | null {
    const trend = this.engagementTrends.find((t) => t.period === period);
    return trend ? trend.trend : null;
  }

  /**
   * Check if conversation is healthy
   */
  isHealthy(): boolean {
    return this.conversationHealth.score >= 70;
  }

  /**
   * Get key metrics summary
   */
  getSummary(): string {
    const duration = Math.round(
      (this.periodEnd.getTime() - this.periodStart.getTime()) / (1000 * 60 * 60),
    ); // hours
    const avgPerParticipant = Math.round(this.totalMessages / Math.max(1, this.uniqueParticipants));
    const avgResponseMin = Math.round(this.averageResponseTime / 60000);

    return (
      `Conversation Metrics (${duration}h period):\n` +
      `- Total Messages: ${this.totalMessages}\n` +
      `- Participants: ${this.uniqueParticipants}\n` +
      `- Avg per Participant: ${avgPerParticipant} messages\n` +
      `- Avg Response Time: ${avgResponseMin} minutes\n` +
      `- Sentiment: ${this.averageSentiment} (${(this.sentimentScore * 100).toFixed(0)}%)\n` +
      `- Health: ${this.conversationHealth.status.toUpperCase()} (${this.conversationHealth.score}/100)\n` +
      `- Top Topic: ${this.topTopics[0]?.topic || 'N/A'}`
    );
  }
}
