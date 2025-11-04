/**
 * CreateMessageUseCase Tests
 * 
 * Architectural Intent:
 * - Tests for the CreateMessageUseCase
 * - Validates input validation and transformation
 * - Ensures proper delegation to domain service
 * - Follows testing guidelines from skill.md
 * 
 * Key Design Decisions:
 * 1. Tests both successful and error scenarios
 * 2. Validates DTO transformation
 * 3. Verifies domain service interaction
 * 4. Tests edge cases and invalid inputs
 */

import { CreateMessageUseCase } from '@application/use_cases/CreateMessageUseCase';
import { MessageDomainService } from '@domain/services/MessageDomainService';
import { CreateMessageDTO } from '@application/dtos/MessageDTOs';
import { Message } from '@domain/entities/Message';
import { MessageContent } from '@domain/value_objects/MessageContent';

// Mock MessageDomainService
const createMockMessageDomainService = (): jest.Mocked<MessageDomainService> => {
  const mock = {
    sendMessage: jest.fn(),
    editMessage: jest.fn(),
    deleteMessage: jest.fn(),
    addReaction: jest.fn(),
    markMessagesAsRead: jest.fn(),
    markAllMessagesAsRead: jest.fn(),
    searchMessagesInConversation: jest.fn(),
    getConversationHistory: jest.fn(),
  };
  
  return mock as unknown as jest.Mocked<MessageDomainService>;
};

describe('CreateMessageUseCase', () => {
  let messageDomainService: jest.Mocked<MessageDomainService>;
  let createMessageUseCase: CreateMessageUseCase;

  beforeEach(() => {
    messageDomainService = createMockMessageDomainService();
    createMessageUseCase = new CreateMessageUseCase(messageDomainService);
  });

  describe('execute', () => {
    it('should create a message successfully', async () => {
      // Arrange
      const dto: CreateMessageDTO = {
        conversationId: 'conv-123',
        userId: 'user-123',
        content: 'Hello, world!',
        html: '<p>Hello, world!</p>',
        entities: [],
        channelType: 'internal',
      };

      const createdMessage = new Message({
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-123',
        senderExternalId: 'user-123',
        senderName: 'User-123',
        content: new MessageContent({ text: 'Hello, world!', html: '<p>Hello, world!</p>' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(),
      });

      messageDomainService.sendMessage.mockResolvedValue(createdMessage);

      // Act
      const result = await createMessageUseCase.execute(dto);

      // Assert
      expect(messageDomainService.sendMessage).toHaveBeenCalledWith(
        dto.userId,
        dto.conversationId,
        expect.any(MessageContent),
        [],
        undefined
      );
      expect(result).toBeDefined();
      expect(result.id).toBe('msg-123');
      expect(result.content).toBe('Hello, world!');
    });

    it('should handle attachments correctly', async () => {
      // Arrange
      const dto: CreateMessageDTO = {
        conversationId: 'conv-123',
        userId: 'user-123',
        content: 'Check out this image!',
        attachments: [
          {
            type: 'image',
            url: 'https://example.com/image.jpg',
            name: 'image.jpg',
            size: 102400,
            mimeType: 'image/jpeg'
          }
        ],
        channelType: 'internal',
      };

      const createdMessage = new Message({
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-123',
        senderExternalId: 'user-123',
        senderName: 'User-123',
        content: new MessageContent({ text: 'Check out this image!' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(),
      });

      messageDomainService.sendMessage.mockResolvedValue(createdMessage);

      // Act
      await createMessageUseCase.execute(dto);

      // Assert
      expect(messageDomainService.sendMessage).toHaveBeenCalledWith(
        dto.userId,
        dto.conversationId,
        expect.any(MessageContent),
        expect.arrayContaining([
          expect.objectContaining({
            type: 'image',
            url: 'https://example.com/image.jpg',
            name: 'image.jpg',
            size: 102400,
            mimeType: 'image/jpeg'
          })
        ]),
        undefined
      );
    });

    it('should validate required fields', async () => {
      // Arrange - missing conversationId
      const invalidDto1: CreateMessageDTO = {
        userId: 'user-123',
        content: 'Hello, world!',
        channelType: 'internal',
      } as any;

      // Act & Assert
      await expect(createMessageUseCase.execute(invalidDto1))
        .rejects.toThrow('Conversation ID is required');

      // Arrange - missing userId
      const invalidDto2: CreateMessageDTO = {
        conversationId: 'conv-123',
        content: 'Hello, world!',
        channelType: 'internal',
      } as any;

      // Act & Assert
      await expect(createMessageUseCase.execute(invalidDto2))
        .rejects.toThrow('User ID is required');

      // Arrange - missing content
      const invalidDto3: CreateMessageDTO = {
        conversationId: 'conv-123',
        userId: 'user-123',
        content: '', // Empty content
        channelType: 'internal',
      };

      // Act & Assert
      await expect(createMessageUseCase.execute(invalidDto3))
        .rejects.toThrow('Message content is required');
    });

    it('should validate content length', async () => {
      // Arrange
      const tooLongContent = 'a'.repeat(10001); // Exceeds max length
      const invalidDto: CreateMessageDTO = {
        conversationId: 'conv-123',
        userId: 'user-123',
        content: tooLongContent,
        channelType: 'internal',
      };

      // Act & Assert
      await expect(createMessageUseCase.execute(invalidDto))
        .rejects.toThrow('Message content exceeds maximum length of 10,000 characters');
    });
  });
});