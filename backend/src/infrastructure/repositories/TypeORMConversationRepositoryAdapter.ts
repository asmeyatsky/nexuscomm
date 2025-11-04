import { DataSource, Repository } from 'typeorm';
import { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort';
import { Conversation } from '../../domain/value_objects/Conversation';
import { Conversation as ConversationEntity } from '../entities/Conversation'; // The TypeORM entity

/**
 * TypeORMConversationRepositoryAdapter
 * 
 * Architectural Intent:
 * - Implements the ConversationRepositoryPort using TypeORM
 * - Acts as an adapter between domain and infrastructure layers
 * - Transforms between domain entities and TypeORM entities
 * - Provides infrastructure-specific implementation details
 * 
 * Key Design Decisions:
 * 1. Implements domain port interface
 * 2. Handles transformation between domain and data layer
 * 3. Uses TypeORM for database operations
 * 4. Maintains transaction boundaries where needed
 */
export class TypeORMConversationRepositoryAdapter implements ConversationRepositoryPort {
  private repository: Repository<ConversationEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ConversationEntity);
  }

  async findById(id: string): Promise<Conversation | null> {
    const conversationEntity = await this.repository.findOne({
      where: { id },
    });

    return conversationEntity ? this.toDomain(conversationEntity) : null;
  }

  async save(conversation: Conversation): Promise<Conversation> {
    const conversationEntity = this.toTypeORM(conversation);
    const savedEntity = await this.repository.save(conversationEntity);
    return this.toDomain(savedEntity);
  }

  async update(conversation: Conversation): Promise<Conversation> {
    const conversationEntity = this.toTypeORM(conversation);
    const updatedEntity = await this.repository.save(conversationEntity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByParticipantId(userId: string): Promise<Conversation[]> {
    const conversationEntities = await this.repository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participantIds)', { userId })
      .getMany();

    return conversationEntities.map(entity => this.toDomain(entity));
  }

  async findByParticipantIds(userIds: string[]): Promise<Conversation[]> {
    // Find conversations where all specified users are participants
    // For direct conversations, we'd match exactly 2 users
    if (userIds.length === 2) {
      const [user1, user2] = userIds;
      const conversationEntities = await this.repository
        .createQueryBuilder('conversation')
        .where(
          `(conversation.participantIds && ARRAY[:user1, :user2] 
            AND array_length(conversation.participantIds, 1) = 2)`,
          { user1, user2 }
        )
        .getMany();

      return conversationEntities.map(entity => this.toDomain(entity));
    }

    // For group conversations, we look for conversations containing all users
    const conversationEntities = await this.repository
      .createQueryBuilder('conversation')
      .where(
        `conversation.participantIds @> ARRAY[:...userIds]`,
        { userIds }
      )
      .getMany();

    return conversationEntities.map(entity => this.toDomain(entity));
  }

  async findAllForUser(userId: string, limit?: number, offset?: number): Promise<Conversation[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participantIds)', { userId })
      .orderBy('conversation.updatedAt', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }
    if (offset) {
      queryBuilder.offset(offset);
    }

    const conversationEntities = await queryBuilder.getMany();

    return conversationEntities.map(entity => this.toDomain(entity));
  }

  async countForUser(userId: string): Promise<number> {
    return await this.repository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participantIds)', { userId })
      .getCount();
  }

  async findUnreadConversations(userId: string): Promise<Conversation[]> {
    const conversationEntities = await this.repository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participantIds)', { userId })
      .andWhere('conversation.unreadCount > 0')
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();

    return conversationEntities.map(entity => this.toDomain(entity));
  }

  async updateLastMessageAt(conversationId: string, timestamp: Date): Promise<Conversation> {
    const result = await this.repository
      .createQueryBuilder()
      .update(ConversationEntity)
      .set({ lastMessageAt: timestamp, updatedAt: new Date() })
      .where('id = :conversationId', { conversationId })
      .returning('*')
      .execute();

    if (result.affected === 0) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // The returning clause might not work with all database types, so we fetch again
    const updatedEntity = await this.repository.findOne({ where: { id: conversationId } });
    if (!updatedEntity) {
      throw new Error(`Conversation ${conversationId} not found after update`);
    }

    return this.toDomain(updatedEntity);
  }

  async updateUnreadCount(conversationId: string, count: number): Promise<Conversation> {
    const result = await this.repository
      .createQueryBuilder()
      .update(ConversationEntity)
      .set({ unreadCount: count, updatedAt: new Date() })
      .where('id = :conversationId', { conversationId })
      .returning('*')
      .execute();

    if (result.affected === 0) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Fetch the updated entity
    const updatedEntity = await this.repository.findOne({ where: { id: conversationId } });
    if (!updatedEntity) {
      throw new Error(`Conversation ${conversationId} not found after update`);
    }

    return this.toDomain(updatedEntity);
  }

  /**
   * Transform TypeORM entity to domain entity
   */
  private toDomain(entity: ConversationEntity): Conversation {
    return new Conversation({
      id: entity.id,
      name: entity.name,
      type: entity.type as 'direct' | 'group' | 'channel',
      participantIds: entity.participantIds || [],
      isArchived: entity.isArchived || false,
      isMuted: entity.isMuted || false,
      unreadCount: entity.unreadCount || 0,
      lastMessageAt: entity.lastMessageAt || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      metadata: entity.metadata || {},
    });
  }

  /**
   * Transform domain entity to TypeORM entity
   */
  private toTypeORM(domain: Conversation): ConversationEntity {
    const entity = new ConversationEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.type = domain.type;
    entity.participantIds = domain.participantIds;
    entity.isArchived = domain.isArchived;
    entity.isMuted = domain.isMuted;
    entity.unreadCount = domain.unreadCount;
    entity.lastMessageAt = domain.lastMessageAt || null;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.metadata = domain.metadata;

    return entity;
  }
}