/**
 * AnalyzeSentimentUseCase Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyzeSentimentUseCase } from '../application/use_cases/AnalyzeSentimentUseCase';
import { AIAnalysisPort } from '../domain/ports/AIAnalysisPort';
import { MessageAnalysis } from '../domain/valueObjects/MessageAnalysis';

describe('AnalyzeSentimentUseCase', () => {
  let useCase: AnalyzeSentimentUseCase;
  let mockAIService: AIAnalysisPort;

  beforeEach(() => {
    mockAIService = {
      analyzeSentiment: vi.fn(),
      categorizeMessage: vi.fn(),
      generateSuggestions: vi.fn(),
      semanticSearch: vi.fn(),
      generateEmbedding: vi.fn(),
      isHealthy: vi.fn().mockResolvedValue(true),
      getUsageMetrics: vi.fn(),
    };

    useCase = new AnalyzeSentimentUseCase(mockAIService);
  });

  it('should analyze sentiment successfully', async () => {
    // Arrange
    const mockAnalysis = new MessageAnalysis(
      'msg-1',
      {
        positive: 0.8,
        neutral: 0.1,
        negative: 0.1,
        overall: 'positive',
        confidence: 0.95,
      },
      { primary: 'greeting', confidence: 0.9 },
      [],
      ['User is happy', 'Friendly tone'],
    );

    vi.mocked(mockAIService.analyzeSentiment).mockResolvedValue(mockAnalysis);

    // Act
    const result = await useCase.execute({
      messageId: 'msg-1',
      content: 'I am so happy with this product!',
      userId: 'user-1',
    });

    // Assert
    expect(result.messageId).toBe('msg-1');
    expect(result.sentiment.overall).toBe('positive');
    expect(result.sentiment.confidence).toBeGreaterThan(0.9);
    expect(result.keyInsights).toContain('User is happy');
  });

  it('should validate required fields', async () => {
    // Act & Assert
    await expect(
      useCase.execute({
        messageId: '',
        content: 'test',
        userId: 'user-1',
      }),
    ).rejects.toThrow('messageId is required');

    await expect(
      useCase.execute({
        messageId: 'msg-1',
        content: '',
        userId: 'user-1',
      }),
    ).rejects.toThrow('content is required');

    await expect(
      useCase.execute({
        messageId: 'msg-1',
        content: 'test',
        userId: '',
      }),
    ).rejects.toThrow('userId is required');
  });

  it('should reject content exceeding max length', async () => {
    // Act & Assert
    const longContent = 'a'.repeat(5001);
    await expect(
      useCase.execute({
        messageId: 'msg-1',
        content: longContent,
        userId: 'user-1',
      }),
    ).rejects.toThrow('content must be less than 5000 characters');
  });

  it('should throw when AI service is unavailable', async () => {
    // Arrange
    vi.mocked(mockAIService.isHealthy).mockResolvedValue(false);

    // Act & Assert
    await expect(
      useCase.execute({
        messageId: 'msg-1',
        content: 'test message',
        userId: 'user-1',
      }),
    ).rejects.toThrow('AI service is not available');
  });

  it('should handle different sentiment tones', async () => {
    const testCases = [
      {
        sentiment: { overall: 'positive' as const, confidence: 0.9 },
        content: 'Great job!',
      },
      {
        sentiment: { overall: 'negative' as const, confidence: 0.85 },
        content: 'This is terrible',
      },
      {
        sentiment: { overall: 'neutral' as const, confidence: 0.75 },
        content: 'The sky is blue',
      },
    ];

    for (const testCase of testCases) {
      const mockAnalysis = new MessageAnalysis(
        'msg-1',
        {
          positive: testCase.sentiment.overall === 'positive' ? 0.8 : 0.1,
          neutral: 0.1,
          negative: testCase.sentiment.overall === 'negative' ? 0.8 : 0.1,
          overall: testCase.sentiment.overall,
          confidence: testCase.sentiment.confidence,
        },
        { primary: 'text', confidence: 0.8 },
        [],
        [],
      );

      vi.mocked(mockAIService.analyzeSentiment).mockResolvedValue(mockAnalysis);

      const result = await useCase.execute({
        messageId: 'msg-1',
        content: testCase.content,
        userId: 'user-1',
      });

      expect(result.sentiment.overall).toBe(testCase.sentiment.overall);
    }
  });
});
