/**
 * SmartScheduleRecommendation
 * Immutable value object representing AI-recommended optimal send time for messages.
 */

export interface EngagementWindow {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hourStart: number; // 0-23
  hourEnd: number; // 0-23
  engagementScore: number; // 0-1
}

export interface ScheduleMetrics {
  avgResponseTimeMs: number;
  engagementRate: number; // 0-1
  peakHours: number[];
  quietHours: number[];
  timezone: string;
}

export class SmartScheduleRecommendation {
  readonly conversationId: string;
  readonly userId: string;
  readonly recommendedTime: Date;
  readonly engagementScore: number; // 0-1 confidence
  readonly reason: string;
  readonly alternativeWindows: EngagementWindow[];
  readonly metrics: ScheduleMetrics;
  readonly urgencyLevel: 'low' | 'medium' | 'high' | 'urgent'; // affects timing
  readonly generatedAt: Date;

  constructor(
    conversationId: string,
    userId: string,
    recommendedTime: Date,
    engagementScore: number,
    reason: string,
    alternativeWindows: EngagementWindow[],
    metrics: ScheduleMetrics,
    urgencyLevel: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    generatedAt: Date = new Date(),
  ) {
    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error('conversationId is required');
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error('userId is required');
    }

    if (engagementScore < 0 || engagementScore > 1) {
      throw new Error('engagementScore must be between 0 and 1');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('reason is required');
    }

    if (reason.length > 500) {
      throw new Error('reason must not exceed 500 characters');
    }

    if (recommendedTime <= new Date()) {
      throw new Error('recommendedTime must be in the future');
    }

    this.conversationId = conversationId;
    this.userId = userId;
    this.recommendedTime = new Date(recommendedTime);
    this.engagementScore = engagementScore;
    this.reason = reason;
    this.alternativeWindows = Object.freeze([...alternativeWindows]);
    this.metrics = Object.freeze({ ...metrics });
    this.urgencyLevel = urgencyLevel;
    this.generatedAt = new Date(generatedAt);
  }

  /**
   * Check if recommended time has passed
   */
  isExpired(): boolean {
    return new Date() > this.recommendedTime;
  }

  /**
   * Get time until recommended send
   */
  getTimeUntilSend(): number {
    return Math.max(0, this.recommendedTime.getTime() - new Date().getTime());
  }

  /**
   * Check if recommendation is high confidence
   */
  isHighConfidence(): boolean {
    return this.engagementScore >= 0.7;
  }

  /**
   * Get summary of recommendation
   */
  getSummary(): string {
    const timeStr = this.recommendedTime.toLocaleString();
    const confidence = Math.round(this.engagementScore * 100);
    return `Recommended: ${timeStr} (${confidence}% confidence) - ${this.reason}`;
  }

  /**
   * Adjust recommendation based on urgency
   */
  getAdjustedTime(): Date {
    const baseTime = this.recommendedTime.getTime();
    const now = new Date().getTime();

    // For urgent messages, recommend immediate send
    if (this.urgencyLevel === 'urgent') {
      return new Date(Math.max(now + 60000, baseTime)); // At least 1 min from now
    }

    // For high urgency, prefer closer to now
    if (this.urgencyLevel === 'high') {
      const adjustment = (this.recommendedTime.getTime() - now) * 0.5;
      return new Date(now + adjustment);
    }

    return this.recommendedTime;
  }
}
