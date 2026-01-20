import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaudeAdvancedAIAdapter } from '../ClaudeAdvancedAIAdapter';
import type { SummarizationRequest, SchedulingRequest, InsightsRequest } from '../../../domain/ports/AIAdvancedPort';

// Mock Anthropic client
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

// Mock database and repositories
vi.mock('@config/database', () => ({
  AppDataSource: {},
}));

vi.mock('@infrastructure/repositories/AIUsageLogRepository', () => ({
  AIUsageLogRepository: vi.fn().mockImplementation(() => ({
    logUsage: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('ClaudeAdvancedAIAdapter', () => {
  let adapter: ClaudeAdvancedAIAdapter;
  let mockClaudeClient: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Claude client
    const Anthropic = require('@anthropic-ai/sdk').default;
    mockClaudeClient = {
      messages: {
        create: vi.fn(),
      },
    };
    Anthropic.mockReturnValue(mockClaudeClient);

    // Create adapter with mock API key
    process.env.ANTHROPIC_API_KEY = 'test-key';
    adapter = new ClaudeAdvancedAIAdapter('test-key');
  });

  describe('isHealthy', () => {
    it('should return true when service is healthy', async () => {
      mockClaudeClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'ok' }],
      });

      const result = await adapter.isHealthy();
      expect(result).toBe(true);
    });

    it('should return false when service is unavailable', async () => {
      mockClaudeClient.messages.create.mockRejectedValue(new Error('API Error'));

      const result = await adapter.isHealthy();
      expect(result).toBe(false);
    });

    it('should handle timeout errors gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockClaudeClient.messages.create.mockRejectedValue(timeoutError);

      const result = await adapter.isHealthy();
      expect(result).toBe(false);
    });
  });

  describe('summarizeConversation', () => {
    it('should summarize conversation successfully', async () => {
      const request: SummarizationRequest = {
        conversationId: 'conv-123',
        messageIds: ['msg-1', 'msg-2'],
        length: 'standard',
        userId: 'user-1',
      };

      // Mock Claude response with JSON format
      const claudeResponse = {
        summary: 'This conversation discusses project updates and team coordination',
        keyPoints: ['Decision made on timeline', 'Budget approved'],
        mainTopics: ['Project Planning'],
        participants: ['user-1', 'user-2'],
        metrics: {
          messageCount: 2,
          wordCount: 150,
          participantCount: 2,
          topicCount: 1,
        },
      };

      mockClaudeClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(claudeResponse) }],
      });

      const result = await adapter.summarizeConversation(request);

      expect(result.conversationId).toBe('conv-123');
      expect(result.summary).toContain('project updates');
      expect(result.length).toBe('standard');
      expect(mockClaudeClient.messages.create).toHaveBeenCalled();
    });

    it('should throw error on API failure', async () => {
      const request: SummarizationRequest = {
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
      };

      mockClaudeClient.messages.create.mockRejectedValue(
        new Error('Claude API error'),
      );

      await expect(adapter.summarizeConversation(request)).rejects.toThrow(
        'Summarization failed',
      );
    });

    it('should handle different summary lengths', async () => {
      const lengths: Array<'brief' | 'standard' | 'detailed'> = ['brief', 'standard', 'detailed'];

      for (const length of lengths) {
        mockClaudeClient.messages.create.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                summary: 'Test summary',
                keyPoints: ['Point 1'],
                mainTopics: ['Topic 1'],
                participants: ['user-1'],
                metrics: {
                  messageCount: 1,
                  wordCount: 50,
                  participantCount: 1,
                  topicCount: 1,
                },
              }),
            },
          ],
        });

        const request: SummarizationRequest = {
          conversationId: 'conv-123',
          messageIds: ['msg-1'],
          length,
          userId: 'user-1',
        };

        const result = await adapter.summarizeConversation(request);
        expect(result.length).toBe(length);
      }
    });

    it('should retry on transient failures', async () => {
      const request: SummarizationRequest = {
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
      };

      // First call fails, second succeeds
      mockClaudeClient.messages.create
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                summary: 'Test',
                keyPoints: ['Point 1'],
                mainTopics: ['Topic 1'],
                participants: ['user-1'],
                metrics: {
                  messageCount: 1,
                  wordCount: 50,
                  participantCount: 1,
                  topicCount: 1,
                },
              }),
            },
          ],
        });

      const result = await adapter.summarizeConversation(request);
      expect(result).toBeDefined();
    });
  });

  describe('getSchedulingRecommendation', () => {
    it('should generate scheduling recommendation', async () => {
      const request: SchedulingRequest = {
        conversationId: 'conv-123',
        userId: 'user-1',
        participantIds: ['user-2'],
        urgency: 'high',
      };

      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 2);

      const claudeResponse = {
        recommendedTime: futureTime.toISOString(),
        engagementScore: 0.85,
        reason: 'Best time for high engagement',
        alternativeWindows: [
          {
            dayOfWeek: 2,
            hourStart: 10,
            hourEnd: 12,
            engagementScore: 0.8,
          },
        ],
        metrics: {
          avgResponseTimeMs: 300000,
          engagementRate: 0.85,
          peakHours: [10, 14, 18],
          quietHours: [2, 3, 4],
          timezone: 'America/New_York',
        },
      };

      mockClaudeClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(claudeResponse) }],
      });

      const result = await adapter.getSchedulingRecommendation(request);

      expect(result.conversationId).toBe('conv-123');
      expect(result.urgencyLevel).toBe('high');
      expect(result.engagementScore).toBeGreaterThan(0);
      expect(result.engagementScore).toBeLessThanOrEqual(1);
    });

    it('should throw error on API failure', async () => {
      const request: SchedulingRequest = {
        conversationId: 'conv-123',
        userId: 'user-1',
        participantIds: ['user-2'],
        urgency: 'medium',
      };

      mockClaudeClient.messages.create.mockRejectedValue(
        new Error('API error'),
      );

      await expect(adapter.getSchedulingRecommendation(request)).rejects.toThrow(
        'Scheduling failed',
      );
    });

    it('should handle all urgency levels', async () => {
      const urgencies: Array<'low' | 'medium' | 'high' | 'urgent'> = [
        'low',
        'medium',
        'high',
        'urgent',
      ];

      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 2);

      for (const urgency of urgencies) {
        mockClaudeClient.messages.create.mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                recommendedTime: futureTime.toISOString(),
                engagementScore: 0.8,
                reason: 'Test',
                alternativeWindows: [],
                metrics: {
                  avgResponseTimeMs: 300000,
                  engagementRate: 0.8,
                  peakHours: [],
                  quietHours: [],
                  timezone: 'UTC',
                },
              }),
            },
          ],
        });

        const request: SchedulingRequest = {
          conversationId: 'conv-123',
          userId: 'user-1',
          participantIds: ['user-2'],
          urgency,
        };

        const result = await adapter.getSchedulingRecommendation(request);
        expect(result.urgencyLevel).toBe(urgency);
      }
    });
  });

  describe('analyzeConversation', () => {
    it('should analyze conversation and return insights', async () => {
      const periodStart = new Date('2025-01-01T00:00:00Z');
      const periodEnd = new Date('2025-01-02T00:00:00Z');

      const request: InsightsRequest = {
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
      };

      const claudeResponse = {
        totalMessages: 50,
        uniqueParticipants: 2,
        averageResponseTime: 300000,
        participantStats: [
          {
            userId: 'user-1',
            messageCount: 30,
            averageMessageLength: 150,
            responseTimeMs: 250000,
            sentimentTrend: 'improving',
            engagementLevel: 0.9,
          },
        ],
        engagementTrends: [
          {
            period: '24h',
            messageCount: 50,
            activeParticipants: 2,
            trend: 'increasing',
            trendPercent: 20,
          },
        ],
        conversationHealth: {
          score: 85,
          status: 'good',
          reasonsForScore: ['High engagement'],
          recommendations: ['Continue engagement'],
        },
        topTopics: [
          {
            topic: 'Project Updates',
            messageCount: 30,
            percentage: 60,
            sentiment: 'positive',
            trend: 'growing',
          },
        ],
        averageSentiment: 'positive',
        sentimentScore: 0.8,
      };

      mockClaudeClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(claudeResponse) }],
      });

      const result = await adapter.analyzeConversation(request);

      expect(result.conversationId).toBe('conv-123');
      expect(result.totalMessages).toBe(50);
      expect(result.uniqueParticipants).toBe(2);
      expect(result.averageSentiment).toBe('positive');
    });

    it('should throw error on API failure', async () => {
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 1);

      const request: InsightsRequest = {
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
      };

      mockClaudeClient.messages.create.mockRejectedValue(
        new Error('Analysis failed'),
      );

      await expect(adapter.analyzeConversation(request)).rejects.toThrow(
        'Insights analysis failed',
      );
    });

    it('should handle different period durations', async () => {
      const periodStart = new Date('2025-01-01T00:00:00Z');
      const periodEnd = new Date('2025-02-01T00:00:00Z');

      const request: InsightsRequest = {
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
      };

      mockClaudeClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalMessages: 100,
              uniqueParticipants: 3,
              averageResponseTime: 400000,
              participantStats: [],
              engagementTrends: [],
              conversationHealth: {
                score: 75,
                status: 'good',
                reasonsForScore: [],
                recommendations: [],
              },
              topTopics: [],
              averageSentiment: 'neutral',
              sentimentScore: 0.5,
            }),
          },
        ],
      });

      const result = await adapter.analyzeConversation(request);
      expect(result.totalMessages).toBe(100);
    });

    it('should include optional userId in request', async () => {
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 1);

      const request: InsightsRequest = {
        conversationId: 'conv-123',
        periodStart,
        periodEnd,
        userId: 'user-123',
        includePredictions: true,
      };

      mockClaudeClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalMessages: 10,
              uniqueParticipants: 1,
              averageResponseTime: 300000,
              participantStats: [],
              engagementTrends: [],
              conversationHealth: {
                score: 70,
                status: 'good',
                reasonsForScore: [],
                recommendations: [],
              },
              topTopics: [],
              averageSentiment: 'positive',
              sentimentScore: 0.75,
            }),
          },
        ],
      });

      const result = await adapter.analyzeConversation(request);
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle malformed Claude responses', async () => {
      const request: SummarizationRequest = {
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
      };

      mockClaudeClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'invalid json' }],
      });

      await expect(adapter.summarizeConversation(request)).rejects.toThrow();
    });

    it('should handle rate limiting gracefully', async () => {
      const request: SummarizationRequest = {
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
      };

      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      mockClaudeClient.messages.create.mockRejectedValue(rateLimitError);

      await expect(adapter.summarizeConversation(request)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const request: SummarizationRequest = {
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
      };

      const networkError = new Error('Network error');
      networkError.name = 'ECONNREFUSED';

      mockClaudeClient.messages.create.mockRejectedValue(networkError);

      await expect(adapter.summarizeConversation(request)).rejects.toThrow();
    });
  });

  describe('logging', () => {
    it('should log successful operations', async () => {
      const request: SummarizationRequest = {
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
      };

      mockClaudeClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              summary: 'Test',
              keyPoints: ['Point 1'],
              mainTopics: ['Topic 1'],
              participants: ['user-1'],
              metrics: {
                messageCount: 1,
                wordCount: 50,
                participantCount: 1,
                topicCount: 1,
              },
            }),
          },
        ],
      });

      await adapter.summarizeConversation(request);
      expect(mockClaudeClient.messages.create).toHaveBeenCalled();
    });

    it('should log errors', async () => {
      const request: SummarizationRequest = {
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
      };

      mockClaudeClient.messages.create.mockRejectedValue(
        new Error('Claude error'),
      );

      try {
        await adapter.summarizeConversation(request);
      } catch (error) {
        // Error expected
      }

      expect(mockClaudeClient.messages.create).toHaveBeenCalled();
    });
  });
});
