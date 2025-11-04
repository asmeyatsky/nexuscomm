/**
 * TypeORMMessageRepositoryAdapter Tests
 * 
 * Architectural Intent:
 * - Tests for the TypeORMMessageRepositoryAdapter
 * - Validates implementation of MessageRepositoryPort
 * - Ensures proper data transformation between layers
 * - Follows testing guidelines from skill.md
 * 
 * Key Design Decisions:
 * 1. Uses mocked TypeORM DataSource
 * 2. Tests all repository methods
 * 3. Validates transformation between domain and infrastructure
 * 4. Tests error conditions and edge cases
 */

import { DataSource, Repository } from 'typeorm';
import { TypeORMMessageRepositoryAdapter } from '@infrastructure/repositories/TypeORMMessageRepositoryAdapter';
import { Message } from '@domain/entities/Message';
import { MessageContent } from '@domain/value_objects/MessageContent';
import { Message as MessageEntity } from '@models/Message';

// Mock TypeORM DataSource
const createMockDataSource = (): jest.Mocked<DataSource> => {
  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getCount: jest.fn(),
      update: jest.fn(() => ({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn(),
        returning: jest.fn().mockReturnThis(),
      })),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  } as unknown as jest.Mocked<Repository<MessageEntity>>;

  return {
    getRepository: jest.fn(() => mockRepository),
  } as unknown as jest.Mocked<DataSource>;
};

describe('TypeORMMessageRepositoryAdapter', () => {
  let dataSource: jest.Mocked<DataSource>;
  let repository: TypeORMMessageRepositoryAdapter;
  let mockRepository: jest.Mocked<Repository<MessageEntity>>;

  beforeEach(() => {
    dataSource = createMockDataSource();
    mockRepository = dataSource.getRepository(MessageEntity as any) as jest.Mocked<Repository<MessageEntity>>;
    repository = new TypeORMMessageRepositoryAdapter(dataSource);
  });

  describe('findById', () => {
    it('should return null if message does not exist', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' }
      });
    });

    it('should return a domain Message entity if it exists', async () => {
      // Arrange
      const messageEntity = {
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-123',
        senderExternalId: 'ext-123',
        senderName: 'Test User',
        content: 'Hello, world!',
        contentData: {
          text: 'Hello, world!',
          html: '<p>Hello, world!</p>',
          entities: []
        },
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        status: 'sent',
        metadata: {},
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        isDeleted: false,
        editHistory: [],
        attachments: [],
        reactions: [],
      };

      mockRepository.findOne.mockResolvedValue(messageEntity);

      // Act
      const result = await repository.findById('msg-123');

      // Assert
      expect(result).toBeInstanceOf(Message);
      expect(result?.id).toBe('msg-123');
      expect(result?.content.text).toBe('Hello, world!');
    });
  });

  describe('save', () => {
    it('should save a domain Message entity', async () => {
      // Arrange
      const domainMessage = new Message({
        conversationId: 'conv-123',
        userId: 'user-123',
        senderExternalId: 'ext-123',
        senderName: 'Test User',
        content: new MessageContent({ text: 'Hello, world!' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(),
      });

      const savedEntity = {
        ...domainMessage,
        id: 'msg-123',
      } as any as MessageEntity;

      mockRepository.save.mockResolvedValue(savedEntity);

      // Act
      const result = await repository.save(domainMessage);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        conversationId: 'conv-123',
        userId: 'user-123',
        content: 'Hello, world!',
        contentData: { text: 'Hello, world!' }
      }));
      expect(result.id).toBe('msg-123');
    });
  });

  describe('update', () => {
    it('should update a domain Message entity', async () => {
      // Arrange
      const domainMessage = new Message({
        id: 'msg-123',
        conversationId: 'conv-123',
        userId: 'user-123',
        senderExternalId: 'ext-123',
        senderName: 'Test User',
        content: new MessageContent({ text: 'Updated content!' }),
        channelType: 'internal',
        externalId: 'ext-123',
        direction: 'outbound',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedEntity = {
        ...domainMessage,
        id: 'msg-123',
      } as any as MessageEntity;

      mockRepository.save.mockResolvedValue(updatedEntity);

      // Act
      const result = await repository.update(domainMessage);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'msg-123',
        content: 'Updated content!'
      }));
      expect(result.content.text).toBe('Updated content!');
    });
  });

  describe('delete', () => {
    it('should delete a message by ID', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue({} as any);

      // Act
      await repository.delete('msg-123');

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith('msg-123');
    });
  });

  describe('findByConversationId', () => {
    it('should find messages by conversation ID', async () => {
      // Arrange
      const entities = [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          userId: 'user-1',
          senderExternalId: 'ext-1',
          senderName: 'User 1',
          content: 'Message 1',
          contentData: { text: 'Message 1' },
          channelType: 'internal',
          externalId: 'ext-1',
          direction: 'outbound',
          status: 'sent',
          metadata: {},
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false,
          isDeleted: false,
          editHistory: [],
          attachments: [],
          reactions: [],
        }
      ];

      mockRepository.createQueryBuilder.mockReturnThis();
      (mockRepository.createQueryBuilder as any).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(entities),
      });

      // Act
      const results = await repository.findByConversationId('conv-123');

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Message);
      expect(results[0].id).toBe('msg-1');
    });
  });
});