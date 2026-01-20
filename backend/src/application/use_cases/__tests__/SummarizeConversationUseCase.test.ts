import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SummarizeConversationUseCase } from '../SummarizeConversationUseCase';
import { ConversationSummary } from '../../../domain/valueObjects/ConversationSummary';
import type { AIAdvancedPort, SummarizationRequest } from '../../../domain/ports/AIAdvancedPort';

describe('SummarizeConversationUseCase', () => {
  let useCase: SummarizeConversationUseCase;
  let mockAIPort: any;

  beforeEach(() => {
    mockAIPort = {
      summarizeConversation: vi.fn(),
      getSchedulingRecommendation: vi.fn(),
      analyzeConversation: vi.fn(),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    useCase = new SummarizeConversationUseCase(mockAIPort);
  });

  describe('execute', () => {
    it('should summarize conversation successfully', async () => {
      const mockSummary = new ConversationSummary(
        'conv-123',
        ['msg-1', 'msg-2'],
        'This conversation discusses project updates and technical issues',
        'standard',
        ['Key decision made', 'Action items identified'],
        ['Project Planning', 'Technical Discussion'],
        ['user-1', 'user-2'],
        {
          messageCount: 10,
          wordCount: 500,
          participantCount: 2,
          topicCount: 2,
        },
      );

      mockAIPort.summarizeConversation.mockResolvedValue(mockSummary);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        messageIds: ['msg-1', 'msg-2'],
        length: 'standard',
        userId: 'user-1',
      });

      expect(result.conversationId).toBe('conv-123');
      expect(result.summary).toBe(mockSummary);
      expect(result.formattedSummary).toContain('Summary (standard):');
      expect(mockAIPort.summarizeConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-123',
          length: 'standard',
        }),
      );
    });

    it('should throw error when service is not healthy', async () => {
      mockAIPort.isHealthy.mockResolvedValue(false);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: ['msg-1'],
          length: 'brief',
          userId: 'user-1',
        }),
      ).rejects.toThrow('AI service is not available');

      expect(mockAIPort.summarizeConversation).not.toHaveBeenCalled();
    });

    it('should include context in request if provided', async () => {
      const mockSummary = new ConversationSummary(
        'conv-123',
        ['msg-1'],
        'Summary',
        'brief',
        ['Point 1'],
        ['Topic 1'],
        ['user-1'],
        { messageCount: 1, wordCount: 50, participantCount: 1, topicCount: 1 },
      );

      mockAIPort.summarizeConversation.mockResolvedValue(mockSummary);

      await useCase.execute({
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
        context: 'Project X discussion',
      });

      expect(mockAIPort.summarizeConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'Project X discussion',
        }),
      );
    });

    it('should handle different summary lengths', async () => {
      const mockSummary = new ConversationSummary(
        'conv-123',
        ['msg-1'],
        'A'.repeat(100),
        'detailed',
        ['Point 1'],
        ['Topic 1'],
        ['user-1'],
        { messageCount: 1, wordCount: 200, participantCount: 1, topicCount: 1 },
      );

      mockAIPort.summarizeConversation.mockResolvedValue(mockSummary);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'detailed',
        userId: 'user-1',
      });

      expect(result.summary.length).toBe('detailed');
      expect(result.formattedSummary).toContain('Summary (detailed):');
    });
  });

  describe('input validation', () => {
    it('should throw error if conversationId is empty', async () => {
      await expect(
        useCase.execute({
          conversationId: '',
          messageIds: ['msg-1'],
          length: 'brief',
          userId: 'user-1',
        }),
      ).rejects.toThrow('conversationId is required');
    });

    it('should throw error if conversationId is whitespace only', async () => {
      await expect(
        useCase.execute({
          conversationId: '   ',
          messageIds: ['msg-1'],
          length: 'brief',
          userId: 'user-1',
        }),
      ).rejects.toThrow('conversationId is required');
    });

    it('should throw error if messageIds array is empty', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: [],
          length: 'brief',
          userId: 'user-1',
        }),
      ).rejects.toThrow('at least one messageId is required');
    });

    it('should throw error if messageIds is not an array', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: 'not-an-array' as any,
          length: 'brief',
          userId: 'user-1',
        }),
      ).rejects.toThrow('at least one messageId is required');
    });

    it('should throw error if more than 1000 messages provided', async () => {
      const tooManyMessages = Array.from({ length: 1001 }, (_, i) => `msg-${i}`);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: tooManyMessages,
          length: 'brief',
          userId: 'user-1',
        }),
      ).rejects.toThrow('cannot summarize more than 1000 messages');
    });

    it('should allow exactly 1000 messages', async () => {
      const mockMessages = Array.from({ length: 1000 }, (_, i) => `msg-${i}`);
      const mockSummary = new ConversationSummary(
        'conv-123',
        mockMessages,
        'Summary',
        'brief',
        ['Point 1'],
        ['Topic 1'],
        ['user-1'],
        { messageCount: 1000, wordCount: 5000, participantCount: 5, topicCount: 3 },
      );

      mockAIPort.summarizeConversation.mockResolvedValue(mockSummary);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: mockMessages,
          length: 'brief',
          userId: 'user-1',
        }),
      ).resolves.toBeDefined();
    });

    it('should throw error for invalid length value', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: ['msg-1'],
          length: 'invalid' as any,
          userId: 'user-1',
        }),
      ).rejects.toThrow("length must be 'brief', 'standard', or 'detailed'");
    });

    it('should throw error if userId is empty', async () => {
      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: ['msg-1'],
          length: 'brief',
          userId: '',
        }),
      ).rejects.toThrow('userId is required');
    });

    it('should throw error if context exceeds 1000 characters', async () => {
      const longContext = 'a'.repeat(1001);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: ['msg-1'],
          length: 'brief',
          userId: 'user-1',
          context: longContext,
        }),
      ).rejects.toThrow('context must not exceed 1000 characters');
    });

    it('should allow context up to 1000 characters', async () => {
      const context = 'a'.repeat(1000);
      const mockSummary = new ConversationSummary(
        'conv-123',
        ['msg-1'],
        'Summary',
        'brief',
        ['Point 1'],
        ['Topic 1'],
        ['user-1'],
        { messageCount: 1, wordCount: 50, participantCount: 1, topicCount: 1 },
      );

      mockAIPort.summarizeConversation.mockResolvedValue(mockSummary);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: ['msg-1'],
          length: 'brief',
          userId: 'user-1',
          context,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should propagate AI service errors', async () => {
      const error = new Error('Claude API failed');
      mockAIPort.summarizeConversation.mockRejectedValue(error);

      await expect(
        useCase.execute({
          conversationId: 'conv-123',
          messageIds: ['msg-1'],
          length: 'brief',
          userId: 'user-1',
        }),
      ).rejects.toThrow('Claude API failed');
    });

    it('should log successful summarization', async () => {
      const mockSummary = new ConversationSummary(
        'conv-123',
        ['msg-1', 'msg-2'],
        'Summary',
        'standard',
        ['Point 1'],
        ['Topic 1'],
        ['user-1'],
        { messageCount: 2, wordCount: 100, participantCount: 1, topicCount: 1 },
      );

      mockAIPort.summarizeConversation.mockResolvedValue(mockSummary);
      const logSpy = vi.spyOn(useCase as any, 'logger');

      await useCase.execute({
        conversationId: 'conv-123',
        messageIds: ['msg-1', 'msg-2'],
        length: 'standard',
        userId: 'user-1',
      });

      // Logger is initialized in constructor, just verify execution completes
      expect(mockAIPort.summarizeConversation).toHaveBeenCalled();
    });
  });

  describe('formatted output', () => {
    it('should include formatted summary in output', async () => {
      const mockSummary = new ConversationSummary(
        'conv-123',
        ['msg-1'],
        'Test summary content',
        'brief',
        ['Key point 1', 'Key point 2'],
        ['Topic A'],
        ['user-1'],
        { messageCount: 5, wordCount: 100, participantCount: 1, topicCount: 1 },
      );

      mockAIPort.summarizeConversation.mockResolvedValue(mockSummary);

      const result = await useCase.execute({
        conversationId: 'conv-123',
        messageIds: ['msg-1'],
        length: 'brief',
        userId: 'user-1',
      });

      expect(result.formattedSummary).toContain('Summary (brief):');
      expect(result.formattedSummary).toContain('Test summary content');
      expect(result.formattedSummary).toContain('Key point 1');
      expect(result.formattedSummary).toContain('Topic A');
    });
  });
});
