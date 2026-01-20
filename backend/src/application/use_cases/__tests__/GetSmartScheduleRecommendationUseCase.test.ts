import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSmartScheduleRecommendationUseCase } from '../GetSmartScheduleRecommendationUseCase';
import { SmartScheduleRecommendation } from '../../../domain/valueObjects/SmartScheduleRecommendation';
import type { AIAdvancedPort } from '../../../domain/ports/AIAdvancedPort';

describe('GetSmartScheduleRecommendationUseCase', () => {
  let useCase: GetSmartScheduleRecommendationUseCase;
  let mockAIPort: any;

  beforeEach(() => {
    mockAIPort = {
      summarizeConversation: vi.fn(),
      getSchedulingRecommendation: vi.fn(),
      analyzeConversation: vi.fn(),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    useCase = new GetSmartScheduleRecommendationUseCase(mockAIPort);
  });

  describe('execute', () => {
    it('should generate schedule recommendation successfully', async () => {
      const recommendedTime = new Date();
      recommendedTime.setHours(recommendedTime.getHours() + 2);

      const mockRecommendation = new SmartScheduleRecommendation(
        'conv-123',
        'user-1',
        recommendedTime,
        0.85,
        'High engagement expected at this time',
        [
          {
            dayOfWeek: 2,
            hourStart: 10,
            hourEnd: 12,
            engagementScore: 0.9,
          },
        ],
        {
          avgResponseTimeMs: 300000,
          engagementRate: 0.85,
          peakHours: [10, 14, 18],
          quietHours: [2, 3, 4],
          timezone: 'America/New_York',
        },
        'high',
      );

      mockAIPort.getSchedulingRecommendation.mockResolvedValue(mockRecommendation);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-1',
        participantIds: ['user-2', 'user-3'],
        urgency: 'high',
      });

      expect(result.conversationId).toBe('conv-123');
      expect(result.recommendation).toBe(mockRecommendation);
      expect(result.summary).toContain('Recommended:');
      expect(result.alternatives).toHaveLength(1);
      expect(mockAIPort.getSchedulingRecommendation).toHaveBeenCalled();
    });

    it('should throw error when service is not healthy', async () => {
      mockAIPort.isHealthy.mockResolvedValue(false);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'medium',
        }),
      ).rejects.toThrow('AI service is not available');

      expect(mockAIPort.getSchedulingRecommendation).not.toHaveBeenCalled();
    });

    it('should include all optional parameters in request', async () => {
      const recommendedTime = new Date();
      recommendedTime.setHours(recommendedTime.getHours() + 2);

      const mockRecommendation = new SmartScheduleRecommendation(
        'conv-123',
        'user-1',
        recommendedTime,
        0.75,
        'Good time',
        [],
        {
          avgResponseTimeMs: 300000,
          engagementRate: 0.8,
          peakHours: [10, 14, 18],
          quietHours: [2, 3, 4],
          timezone: 'America/New_York',
        },
      );

      mockAIPort.getSchedulingRecommendation.mockResolvedValue(mockRecommendation);

      const notBefore = new Date();
      const notAfter = new Date();
      notAfter.setHours(notAfter.getHours() + 12);

      await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-1',
        participantIds: ['user-2'],
        messagePreview: 'Check your schedule',
        urgency: 'medium',
        timezone: 'America/Los_Angeles',
        constraints: {
          notBefore,
          notAfter,
          preferredDays: [1, 2, 3],
        },
      });

      expect(mockAIPort.getSchedulingRecommendation).toHaveBeenCalledWith(
        expect.objectContaining({
          messagePreview: 'Check your schedule',
          timezone: 'America/Los_Angeles',
          constraints: expect.objectContaining({
            preferredDays: [1, 2, 3],
          }),
        }),
      );
    });

    it('should format alternative windows correctly', async () => {
      const recommendedTime = new Date();
      recommendedTime.setHours(recommendedTime.getHours() + 2);

      const mockRecommendation = new SmartScheduleRecommendation(
        'conv-123',
        'user-1',
        recommendedTime,
        0.85,
        'Good time',
        [
          {
            dayOfWeek: 1, // Monday
            hourStart: 9,
            hourEnd: 11,
            engagementScore: 0.8,
          },
          {
            dayOfWeek: 3, // Wednesday
            hourStart: 14,
            hourEnd: 16,
            engagementScore: 0.75,
          },
        ],
        {
          avgResponseTimeMs: 300000,
          engagementRate: 0.85,
          peakHours: [10, 14, 18],
          quietHours: [2, 3, 4],
          timezone: 'America/New_York',
        },
      );

      mockAIPort.getSchedulingRecommendation.mockResolvedValue(mockRecommendation);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-1',
        participantIds: ['user-2'],
        urgency: 'medium',
      });

      expect(result.alternatives).toHaveLength(2);
      expect(result.alternatives[0].time).toBe('Mon 9:00-11:00');
      expect(result.alternatives[1].time).toBe('Wed 14:00-16:00');
      expect(result.alternatives[0].engagementScore).toBe(0.8);
      expect(result.alternatives[1].engagementScore).toBe(0.75);
    });
  });

  describe('input validation', () => {
    it('should throw error if conversationId is empty', async () => {
      await expect(
        useCase.execute({
          conversationId: '',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'medium',
        }),
      ).rejects.toThrow('conversationId is required');
    });

    it('should throw error if userId is empty', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: '',
          participantIds: ['user-2'],
          urgency: 'medium',
        }),
      ).rejects.toThrow('userId is required');
    });

    it('should throw error if participantIds is empty', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: [],
          urgency: 'medium',
        }),
      ).rejects.toThrow('at least one participantId is required');
    });

    it('should throw error if participantIds is not an array', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: 'user-2' as any,
          urgency: 'medium',
        }),
      ).rejects.toThrow('at least one participantId is required');
    });

    it('should throw error for invalid urgency value', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'critical' as any,
        }),
      ).rejects.toThrow("urgency must be 'low', 'medium', 'high', or 'urgent'");
    });

    it('should throw error if notBefore is not before notAfter', async () => {
      const time = new Date();

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'medium',
          constraints: {
            notBefore: time,
            notAfter: time,
          },
        }),
      ).rejects.toThrow('notBefore must be before notAfter');
    });

    it('should throw error if preferredDays contains invalid values', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'medium',
          constraints: {
            preferredDays: [7], // 0-6 are valid
          },
        }),
      ).rejects.toThrow('preferredDays must contain values 0-6');
    });

    it('should throw error if preferredDays contains negative values', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'medium',
          constraints: {
            preferredDays: [-1],
          },
        }),
      ).rejects.toThrow('preferredDays must contain values 0-6');
    });

    it('should throw error if preferredDays is not an array', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'medium',
          constraints: {
            preferredDays: 'monday' as any,
          },
        }),
      ).rejects.toThrow('preferredDays must be an array');
    });

    it('should allow all valid urgency levels', async () => {
      const recommendedTime = new Date();
      recommendedTime.setHours(recommendedTime.getHours() + 2);

      const mockRecommendation = new SmartScheduleRecommendation(
        'conv-123',
        'user-1',
        recommendedTime,
        0.75,
        'Good',
        [],
        {
          avgResponseTimeMs: 300000,
          engagementRate: 0.8,
          peakHours: [],
          quietHours: [],
          timezone: 'UTC',
        },
      );

      mockAIPort.getSchedulingRecommendation.mockResolvedValue(mockRecommendation);

      const urgencies: Array<'low' | 'medium' | 'high' | 'urgent'> = [
        'low',
        'medium',
        'high',
        'urgent',
      ];

      for (const urgency of urgencies) {
        const result = await useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency,
        });

        expect(result.recommendation.urgencyLevel).toBeDefined();
      }
    });

    it('should allow valid preferredDays values (0-6)', async () => {
      const recommendedTime = new Date();
      recommendedTime.setHours(recommendedTime.getHours() + 2);

      const mockRecommendation = new SmartScheduleRecommendation(
        'conv-123',
        'user-1',
        recommendedTime,
        0.75,
        'Good',
        [],
        {
          avgResponseTimeMs: 300000,
          engagementRate: 0.8,
          peakHours: [],
          quietHours: [],
          timezone: 'UTC',
        },
      );

      mockAIPort.getSchedulingRecommendation.mockResolvedValue(mockRecommendation);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'medium',
          constraints: {
            preferredDays: [0, 1, 2, 3, 4, 5, 6],
          },
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should propagate AI service errors', async () => {
      const error = new Error('Scheduling service unavailable');
      mockAIPort.getSchedulingRecommendation.mockRejectedValue(error);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency: 'medium',
        }),
      ).rejects.toThrow('Scheduling service unavailable');
    });
  });

  describe('output formatting', () => {
    it('should include summary in output', async () => {
      const recommendedTime = new Date();
      recommendedTime.setHours(recommendedTime.getHours() + 2);

      const mockRecommendation = new SmartScheduleRecommendation(
        'conv-123',
        'user-1',
        recommendedTime,
        0.85,
        'Best engagement window',
        [],
        {
          avgResponseTimeMs: 300000,
          engagementRate: 0.85,
          peakHours: [10, 14, 18],
          quietHours: [2, 3, 4],
          timezone: 'America/New_York',
        },
      );

      mockAIPort.getSchedulingRecommendation.mockResolvedValue(mockRecommendation);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        userId: 'user-1',
        participantIds: ['user-2'],
        urgency: 'high',
      });

      expect(result.summary).toContain('Recommended:');
      expect(result.summary).toContain('confidence');
      expect(result.summary).toContain('Best engagement window');
    });
  });
});
