import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetConversationInsightsUseCase } from '../GetConversationInsightsUseCase';
import { ConversationInsight } from '../../../domain/valueObjects/ConversationInsight';
import type { AIAdvancedPort } from '../../../domain/ports/AIAdvancedPort';

describe('GetConversationInsightsUseCase', () => {
  let useCase: GetConversationInsightsUseCase;
  let mockAIPort: any;
  let periodStart: Date;
  let periodEnd: Date;

  beforeEach(() => {
    periodStart = new Date('2025-01-01T00:00:00Z');
    periodEnd = new Date('2025-01-02T00:00:00Z');

    mockAIPort = {
      summarizeConversation: vi.fn(),
      getSchedulingRecommendation: vi.fn(),
      analyzeConversation: vi.fn(),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    useCase = new GetConversationInsightsUseCase(mockAIPort);
  });

  describe('execute', () => {
    it('should generate conversation insights successfully', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        300000,
        [
          {
            userId: 'user-1',
            messageCount: 30,
            averageMessageLength: 150,
            responseTimeMs: 250000,
            sentimentTrend: 'improving',
            engagementLevel: 0.9,
          },
        ],
        [
          {
            period: '24h',
            messageCount: 50,
            activeParticipants: 2,
            trend: 'increasing',
            trendPercent: 20,
          },
        ],
        {
          score: 85,
          status: 'good',
          reasonsForScore: ['High engagement'],
          recommendations: ['Continue engagement'],
        },
        [
          {
            topic: 'Project Updates',
            messageCount: 30,
            percentage: 60,
            sentiment: 'positive',
            trend: 'growing',
          },
        ],
        'positive',
        0.8,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
      });

      expect(result.conversationId).toBe('conv-123');
      expect(result.insights).toBe(mockInsight);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toEqual(['Continue engagement']);
      expect(mockAIPort.analyzeConversation).toHaveBeenCalled();
    });

    it('should throw error when service is not healthy', async () => {
      mockAIPort.isHealthy.mockResolvedValue(false);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd,
        }),
      ).rejects.toThrow('AI service is not available');

      expect(mockAIPort.analyzeConversation).not.toHaveBeenCalled();
    });

    it('should include optional userId in request', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        10,
        1,
        300000,
        [],
        [],
        { score: 75, status: 'good', reasonsForScore: [], recommendations: [] },
        [],
        'neutral',
        0.5,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      await useCase.execute({
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
        userId: 'user-123',
        includePredictions: true,
      });

      expect(mockAIPort.analyzeConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          includePredictions: true,
        }),
      );
    });
  });

  describe('input validation', () => {
    it('should throw error if conversationId is empty', async () => {
      await expect(
        useCase.execute({
          conversationId: '',
          periodStart,
          periodEnd,
        }),
      ).rejects.toThrow('conversationId is required');
    });

    it('should throw error if conversationId is whitespace', async () => {
      await expect(
        useCase.execute({
          conversationId: '   ',
          periodStart,
          periodEnd,
        }),
      ).rejects.toThrow('conversationId is required');
    });

    it('should throw error if periodStart is not a Date', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart: 'not-a-date' as any,
          periodEnd,
        }),
      ).rejects.toThrow('periodStart must be a valid Date');
    });

    it('should throw error if periodStart is null', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart: null as any,
          periodEnd,
        }),
      ).rejects.toThrow('periodStart must be a valid Date');
    });

    it('should throw error if periodEnd is not a Date', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: 'not-a-date' as any,
        }),
      ).rejects.toThrow('periodEnd must be a valid Date');
    });

    it('should throw error if periodEnd is not after periodStart', async () => {
      const same = new Date(periodStart);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: same,
        }),
      ).rejects.toThrow('periodEnd must be after periodStart');
    });

    it('should throw error if periodEnd is before periodStart', async () => {
      const before = new Date(periodStart);
      before.setDate(before.getDate() - 1);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: before,
        }),
      ).rejects.toThrow('periodEnd must be after periodStart');
    });

    it('should throw error if period exceeds 1 year', async () => {
      const tooFar = new Date(periodStart);
      tooFar.setFullYear(tooFar.getFullYear() + 2);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: tooFar,
        }),
      ).rejects.toThrow('period cannot exceed 1 year');
    });

    it('should allow period of exactly 1 year', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        0,
        0,
        0,
        [],
        [],
        { score: 50, status: 'fair', reasonsForScore: [], recommendations: [] },
        [],
        'neutral',
        0.5,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      const oneYearLater = new Date(periodStart);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: oneYearLater,
        }),
      ).resolves.toBeDefined();
    });

    it('should throw error if period is less than 1 minute', async () => {
      const tooSoon = new Date(periodStart);
      tooSoon.setSeconds(tooSoon.getSeconds() + 30);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: tooSoon,
        }),
      ).rejects.toThrow('period must be at least 1 minute');
    });

    it('should allow period of exactly 1 minute', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        0,
        0,
        0,
        [],
        [],
        { score: 50, status: 'fair', reasonsForScore: [], recommendations: [] },
        [],
        'neutral',
        0.5,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      const oneMinLater = new Date(periodStart);
      oneMinLater.setMinutes(oneMinLater.getMinutes() + 1);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: oneMinLater,
        }),
      ).resolves.toBeDefined();
    });

    it('should throw error if userId is empty string when provided', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd,
          userId: '',
        }),
      ).rejects.toThrow('userId must not be empty if provided');
    });

    it('should throw error if userId is whitespace', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd,
          userId: '   ',
        }),
      ).rejects.toThrow('userId must not be empty if provided');
    });

    it('should allow undefined userId', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        10,
        1,
        300000,
        [],
        [],
        { score: 75, status: 'good', reasonsForScore: [], recommendations: [] },
        [],
        'neutral',
        0.5,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should propagate AI service errors', async () => {
      const error = new Error('Analysis service error');
      mockAIPort.analyzeConversation.mockRejectedValue(error);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd,
        }),
      ).rejects.toThrow('Analysis service error');
    });
  });

  describe('output generation', () => {
    it('should extract health recommendations for output', async () => {
      const recommendations = ['Increase engagement', 'Monitor sentiment trends', 'Schedule follow-up'];
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        3,
        300000,
        [],
        [],
        {
          score: 65,
          status: 'fair',
          reasonsForScore: ['Declining engagement'],
          recommendations,
        },
        [],
        'neutral',
        0.5,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
      });

      expect(result.recommendations).toEqual(recommendations);
    });

    it('should generate summary from insight', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        50,
        2,
        300000,
        [
          {
            userId: 'user-1',
            messageCount: 30,
            averageMessageLength: 150,
            responseTimeMs: 250000,
            sentimentTrend: 'improving',
            engagementLevel: 0.9,
          },
        ],
        [],
        {
          score: 85,
          status: 'good',
          reasonsForScore: ['High engagement'],
          recommendations: [],
        },
        [],
        'positive',
        0.8,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
      });

      expect(result.summary).toContain('Conversation Metrics');
      expect(result.summary).toContain('Total Messages: 50');
      expect(result.summary).toContain('Participants: 2');
    });

    it('should include conversation health status in summary', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        100,
        5,
        500000,
        [],
        [],
        {
          score: 95,
          status: 'excellent',
          reasonsForScore: ['High engagement', 'Positive sentiment'],
          recommendations: ['Continue current engagement pattern'],
        },
        [],
        'positive',
        0.9,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
      });

      expect(result.summary).toContain('EXCELLENT (95/100)');
    });
  });

  describe('period validation edge cases', () => {
    it('should allow very large valid periods (less than 1 year)', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        0,
        0,
        0,
        [],
        [],
        { score: 50, status: 'fair', reasonsForScore: [], recommendations: [] },
        [],
        'neutral',
        0.5,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      const almostOneYear = new Date(periodStart);
      almostOneYear.setDate(almostOneYear.getDate() + 364);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: almostOneYear,
        }),
      ).resolves.toBeDefined();
    });

    it('should handle very precise date comparisons', async () => {
      const mockInsight = new ConversationInsight(
        'conv-123',
        periodStart,
        periodEnd,
        0,
        0,
        0,
        [],
        [],
        { score: 50, status: 'fair', reasonsForScore: [], recommendations: [] },
        [],
        'neutral',
        0.5,
      );

      mockAIPort.analyzeConversation.mockResolvedValue(mockInsight);

      const almostSame = new Date(periodStart);
      almostSame.setMilliseconds(almostSame.getMilliseconds() + 60001); // Just over 1 minute

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          periodStart,
          periodEnd: almostSame,
        }),
      ).resolves.toBeDefined();
    });
  });
});
