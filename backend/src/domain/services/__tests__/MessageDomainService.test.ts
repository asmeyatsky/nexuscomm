/**
 * MessageDomainService Tests
 * 
 * Architectural Intent:
 * - Tests for the MessageDomainService
 * - Validates business logic and orchestration
 * - Ensures proper use of repositories
 * - Follows testing guidelines from skill.md
 * 
 * Key Design Decisions:
 * 1. Uses mocks for repository dependencies
 * 2. Tests all public methods
 * 3. Validates error conditions
 * 4. Verifies proper data flow between components
 */

import { MessageDomainService } from '@domain/services/MessageDomainService';
import { MessageRepositoryPort } from '@domain/ports/MessageRepositoryPort';
import { ConversationRepositoryPort } from '@domain/ports/ConversationRepositoryPort';
import { Message } from '@domain/entities/Message';
import { MessageContent } from '@domain/value_objects/MessageContent';
import { Conversation } from '@domain/value_objects/Conversation';
import { Reaction } from '@domain/value_objects/Reaction';

// Mock repositories
const createMockMessageRepository = (): jest.Mocked<MessageRepositoryPort> => ({
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByConversationId: jest.fn(),
  findByUserId: jest.fn(),
  findByChannelType: jest.fn(),
  searchByContent: jest.fn(),
  countByConversationId: jest.fn(),
  markAsReadForUser: jest.fn(),
  markAllAsReadForUser: jest.fn(),
});

const createMockConversationRepository = (): jest.Mocked<ConversationRepositoryPort> => ({
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByParticipantId: jest.fn(),
  findByParticipantIds: jest.fn(),
  findAllForUser: jest.fn(),
  countForUser: jest.fn(),
  findUnreadConversations: jest.fn(),
  updateLastMessageAt: jest.fn(),
  updateUnreadCount: jest.fn(),
});

describe('MessageDomainService', () => {
  let messageRepository: jest.Mocked<MessageRepositoryPort>;
  let conversationRepository: jest.Mocked<ConversationRepositoryPort>;
  let messageDomainService: MessageDomainService;

  beforeEach(() => {
    messageRepository = createMockMessageRepository();
    conversationRepository = createMockConversationRepository();
    messageDomainService = new MessageDomainService(
      messageRepository,
      conversationRepository
    );
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Arrange
      const conversation = new Conversation({
        id: 'conv-123',
        type: 'direct',
        participantIds: ['user-1', 'user-2'],
        createdAt: new Date(),
      });
      
      conversationRepository.findById.mockResolvedValue(conversation);
      conversationRepository.updateLastMessageAt.mockResolvedValue(conversation);
      
      const content = new MessageContent({ text: 'Hello!' });
      messageRepository.save.mockImplementation(async (message) => {
        // Return the message with an ID as would happen in real implementation
        return { ...message, id: 'msg-123' } as Message;
      });

      // Act
      const result = await messageDomainService.sendMessage(
        'user-1',
        'conv-123',
        content
      );

      // Assert
      expect(conversationRepository.findById).toHaveBeenCalledWith('conv-123');
      expect(messageRepository.save).toHaveBeenCalled();
      expect(conversationRepository.updateLastMessageAt).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if conversation does not exist', async () => {
      // Arrange
      conversationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        messageDomainService.sendMessage(
          'user-1',
          'non-existent-conv',
          new MessageContent({ text: 'Hello!' })
        )
      ).rejects.toThrow('Conversation non-existent-conv not found');
    });

    it('should throw error if user is not a participant', async () => {
      // Arrange
      const conversation = new Conversation({
        id: 'conv-123',
        type: 'direct',
        participantIds: ['user-2', 'user-3'], // user-1 is not a participant
        createdAt: new Date(),
      });
      
      conversationRepository.findById.mockResolvedValue(conversation);

      // Act & Assert
      await expect(
        messageDomainService.sendMessage(
          'user-1',
          'conv-123',
          new MessageContent({ text: 'Hello!' })
        )
      ).rejects.toThrow('User user-1 is not a participant in conversation conv-123');
    });
  });

  describe('editMessage', () => {
    it('should edit a message successfully', async () => {
      // Arrange
      const originalMessage = new Message({
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-1',
        senderExternalId: 'ext-1',
        senderName: 'User 1',
        content: new MessageContent({ text: 'Original content' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(Date.now() - 1000), // Within edit window
      });
      
      const newContent = new MessageContent({ text: 'Updated content' });
      
      messageRepository.findById.mockResolvedValue(originalMessage);
      messageRepository.update.mockResolvedValue({
        ...originalMessage,
        content: newContent,
        isEdited: true
      } as Message);

      // Act
      const result = await messageDomainService.editMessage(
        'user-1',
        'msg-123',
        newContent
      );

      // Assert
      expect(messageRepository.findById).toHaveBeenCalledWith('msg-123');
      expect(messageRepository.update).toHaveBeenCalled();
      expect(result.content.text).toBe('Updated content');
    });

    it('should throw error if user does not own the message', async () => {
      // Arrange
      const otherUsersMessage = new Message({
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-2', // Different user
        senderExternalId: 'ext-2',
        senderName: 'User 2',
        content: new MessageContent({ text: 'Original content' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(),
      });
      
      messageRepository.findById.mockResolvedValue(otherUsersMessage);

      // Act & Assert
      await expect(
        messageDomainService.editMessage(
          'user-1',
          'msg-123',
          new MessageContent({ text: 'Updated content' })
        )
      ).rejects.toThrow('User does not own this message');
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message successfully', async () => {
      // Arrange
      const message = new Message({
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-1',
        senderExternalId: 'ext-1',
        senderName: 'User 1',
        content: new MessageContent({ text: 'Content' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(),
      });
      
      messageRepository.findById.mockResolvedValue(message);
      messageRepository.update.mockResolvedValue({
        ...message,
        isDeleted: true,
        deletedAt: new Date()
      } as Message);

      // Act
      await messageDomainService.deleteMessage('user-1', 'msg-123');

      // Assert
      expect(messageRepository.findById).toHaveBeenCalledWith('msg-123');
      expect(messageRepository.update).toHaveBeenCalled();
    });

    it('should throw error if user does not own the message', async () => {
      // Arrange
      const otherUsersMessage = new Message({
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-2', // Different user
        senderExternalId: 'ext-2',
        senderName: 'User 2',
        content: new MessageContent({ text: 'Content' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(),
      });
      
      messageRepository.findById.mockResolvedValue(otherUsersMessage);

      // Act & Assert
      await expect(
        messageDomainService.deleteMessage('user-1', 'msg-123')
      ).rejects.toThrow('User does not own this message');
    });
  });

  describe('addReaction', () => {
    it('should add a reaction to a message successfully', async () => {
      // Arrange
      const message = new Message({
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-1',
        senderExternalId: 'ext-1',
        senderName: 'User 1',
        content: new MessageContent({ text: 'Content' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(),
      });
      
      messageRepository.findById.mockResolvedValue(message);
      messageRepository.update.mockResolvedValue(message);

      // Act
      const result = await messageDomainService.addReaction('user-2', 'msg-123', '👍');

      // Assert
      expect(messageRepository.findById).toHaveBeenCalledWith('msg-123');
      expect(messageRepository.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read successfully', async () => {
      // Arrange
      const conversation = new Conversation({
        id: 'conv-123',
        type: 'direct',
        participantIds: ['user-1', 'user-2'],
        createdAt: new Date(),
      });
      
      conversationRepository.findById.mockResolvedValue(conversation);
      messageRepository.markAsReadForUser.mockResolvedValue();

      // Act
      await messageDomainService.markMessagesAsRead('user-1', 'conv-123', ['msg-1', 'msg-2']);

      // Assert
      expect(conversationRepository.findById).toHaveBeenCalledWith('conv-123');
      expect(messageRepository.markAsReadForUser).toHaveBeenCalledWith(
        'user-1', 
        'conv-123', 
        ['msg-1', 'msg-2']
      );
    });

    it('should throw error if user is not a participant in conversation', async () => {
      // Arrange
      const conversation = new Conversation({
        id: 'conv-123',
        type: 'direct',
        participantIds: ['user-2', 'user-3'], // user-1 is not included
        createdAt: new Date(),
      });
      
      conversationRepository.findById.mockResolvedValue(conversation);

      // Act & Assert
      await expect(
        messageDomainService.markMessagesAsRead('user-1', 'conv-123', ['msg-1'])
      ).rejects.toThrow('User user-1 is not a participant in conversation conv-123');
    });
  });
});