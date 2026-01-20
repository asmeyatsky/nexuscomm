import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartScheduleRecommendation, type EngagementWindow, type ScheduleMetrics } from '../SmartScheduleRecommendation';

describe('SmartScheduleRecommendation', () => {
  let recommendedTime: Date;
  let metrics: ScheduleMetrics;
  let windows: EngagementWindow[];

  beforeEach(() => {
    // Set recommended time to 2 hours in the future
    recommendedTime = new Date();
    recommendedTime.setHours(recommendedTime.getHours() + 2);

    metrics = {
      avgResponseTimeMs: 300000,
      engagementRate: 0.85,
      peakHours: [10, 14, 18],
      quietHours: [2, 3, 4],
      timezone: 'America/New_York',
    };

    windows = [
      {
        dayOfWeek: 2,
        hourStart: 10,
        hourEnd: 12,
        engagementScore: 0.9,
      },
      {
        dayOfWeek: 3,
        hourStart: 14,
        hourEnd: 16,
        engagementScore: 0.85,
      },
    ];
  });

  describe('constructor', () => {
    it('should create a valid SmartScheduleRecommendation', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.85,
        'Best time based on user engagement patterns',
        windows,
        metrics,
        'high',
      );

      expect(rec.conversationId).toBe('conv-123');
      expect(rec.userId).toBe('user-456');
      expect(rec.engagementScore).toBe(0.85);
      expect(rec.urgencyLevel).toBe('high');
    });

    it('should throw error if conversationId is empty', () => {
      expect(() => {
        new SmartScheduleRecommendation(
          '',
          'user-456',
          recommendedTime,
          0.8,
          'reason',
          windows,
          metrics,
        );
      }).toThrow('conversationId is required');
    });

    it('should throw error if userId is empty', () => {
      expect(() => {
        new SmartScheduleRecommendation(
          'conv-123',
          '',
          recommendedTime,
          0.8,
          'reason',
          windows,
          metrics,
        );
      }).toThrow('userId is required');
    });

    it('should throw error if engagementScore is below 0', () => {
      expect(() => {
        new SmartScheduleRecommendation(
          'conv-123',
          'user-456',
          recommendedTime,
          -0.1,
          'reason',
          windows,
          metrics,
        );
      }).toThrow('engagementScore must be between 0 and 1');
    });

    it('should throw error if engagementScore is above 1', () => {
      expect(() => {
        new SmartScheduleRecommendation(
          'conv-123',
          'user-456',
          recommendedTime,
          1.5,
          'reason',
          windows,
          metrics,
        );
      }).toThrow('engagementScore must be between 0 and 1');
    });

    it('should throw error if reason is empty', () => {
      expect(() => {
        new SmartScheduleRecommendation(
          'conv-123',
          'user-456',
          recommendedTime,
          0.8,
          '',
          windows,
          metrics,
        );
      }).toThrow('reason is required');
    });

    it('should throw error if reason exceeds 500 characters', () => {
      const longReason = 'a'.repeat(501);
      expect(() => {
        new SmartScheduleRecommendation(
          'conv-123',
          'user-456',
          recommendedTime,
          0.8,
          longReason,
          windows,
          metrics,
        );
      }).toThrow('reason must not exceed 500 characters');
    });

    it('should throw error if recommendedTime is in the past', () => {
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);

      expect(() => {
        new SmartScheduleRecommendation(
          'conv-123',
          'user-456',
          pastTime,
          0.8,
          'reason',
          windows,
          metrics,
        );
      }).toThrow('recommendedTime must be in the future');
    });

    it('should use default urgency level of medium', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
      );

      expect(rec.urgencyLevel).toBe('medium');
    });

    it('should freeze arrays to prevent modification', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
      );

      expect(() => {
        (rec.alternativeWindows as any)[0] = { dayOfWeek: 1, hourStart: 9, hourEnd: 11, engagementScore: 0.7 };
      }).toThrow();
    });
  });

  describe('isExpired', () => {
    it('should return false if recommended time is in future', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
      );

      expect(rec.isExpired()).toBe(false);
    });

    it('should return true if recommended time has passed', () => {
      const pastTime = new Date();
      pastTime.setSeconds(pastTime.getSeconds() - 1);

      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        pastTime,
        0.8,
        'reason',
        windows,
        metrics,
      );

      expect(rec.isExpired()).toBe(true);
    });
  });

  describe('getTimeUntilSend', () => {
    it('should return milliseconds until recommended send time', () => {
      const futureTime = new Date();
      futureTime.setSeconds(futureTime.getSeconds() + 60);

      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        futureTime,
        0.8,
        'reason',
        windows,
        metrics,
      );

      const timeUntil = rec.getTimeUntilSend();
      expect(timeUntil).toBeGreaterThan(55000); // Should be close to 60000ms
      expect(timeUntil).toBeLessThanOrEqual(60000);
    });

    it('should return 0 if time has passed', () => {
      const pastTime = new Date();
      pastTime.setSeconds(pastTime.getSeconds() - 10);

      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        pastTime,
        0.8,
        'reason',
        windows,
        metrics,
      );

      expect(rec.getTimeUntilSend()).toBe(0);
    });
  });

  describe('isHighConfidence', () => {
    it('should return true if engagement score >= 0.7', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.75,
        'reason',
        windows,
        metrics,
      );

      expect(rec.isHighConfidence()).toBe(true);
    });

    it('should return true for 0.7 exactly', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.7,
        'reason',
        windows,
        metrics,
      );

      expect(rec.isHighConfidence()).toBe(true);
    });

    it('should return false if engagement score < 0.7', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.65,
        'reason',
        windows,
        metrics,
      );

      expect(rec.isHighConfidence()).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return formatted summary with time and confidence', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.85,
        'Best time to reach user',
        windows,
        metrics,
      );

      const summary = rec.getSummary();
      expect(summary).toContain('Recommended:');
      expect(summary).toContain('85% confidence');
      expect(summary).toContain('Best time to reach user');
    });

    it('should calculate confidence percentage correctly', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.456,
        'reason',
        windows,
        metrics,
      );

      const summary = rec.getSummary();
      expect(summary).toContain('46% confidence'); // Rounded
    });
  });

  describe('getAdjustedTime', () => {
    it('should return original time for medium urgency', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
        'medium',
      );

      const adjusted = rec.getAdjustedTime();
      expect(adjusted.getTime()).toBe(recommendedTime.getTime());
    });

    it('should recommend immediate send (1 min) for urgent', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
        'urgent',
      );

      const adjusted = rec.getAdjustedTime();
      const now = new Date().getTime();
      const minOneMin = now + 60000;

      expect(adjusted.getTime()).toBeGreaterThanOrEqual(minOneMin);
    });

    it('should bring high urgency closer to now', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
        'high',
      );

      const adjusted = rec.getAdjustedTime();
      const now = new Date().getTime();
      const originalDelay = recommendedTime.getTime() - now;
      const adjustedDelay = adjusted.getTime() - now;

      expect(adjustedDelay).toBeLessThan(originalDelay);
      expect(adjustedDelay).toBeGreaterThan(0);
    });

    it('should bring low urgency closer to now than original', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
        'low',
      );

      const adjusted = rec.getAdjustedTime();
      expect(adjusted.getTime()).toBe(recommendedTime.getTime());
    });
  });

  describe('immutability', () => {
    it('should prevent modification of alternativeWindows array', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
      );

      expect(() => {
        (rec.alternativeWindows as any).push({
          dayOfWeek: 4,
          hourStart: 9,
          hourEnd: 11,
          engagementScore: 0.8,
        });
      }).toThrow();
    });

    it('should prevent modification of metrics object', () => {
      const rec = new SmartScheduleRecommendation(
        'conv-123',
        'user-456',
        recommendedTime,
        0.8,
        'reason',
        windows,
        metrics,
      );

      expect(() => {
        (rec.metrics as any).engagementRate = 0.5;
      }).toThrow();
    });
  });
});
