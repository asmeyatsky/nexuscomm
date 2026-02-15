import { DataSource, Repository } from 'typeorm';
import { MessageRepositoryPort } from '@domain/ports/MessageRepositoryPort';
import { Message } from '@domain/entities/Message';
import { MessageContent, MessageContentEntity } from '@domain/valueObjects/MessageContent';
import { Reaction } from '@domain/valueObjects/Reaction';
import { Message as MessageEntity } from '../../models/Message';

/**
 * TypeORMMessageRepositoryAdapter
 *
 * Architectural Intent:
 * - Implements the MessageRepositoryPort using TypeORM
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
export class TypeORMMessageRepositoryAdapter implements MessageRepositoryPort {
  private repository: Repository<MessageEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(MessageEntity);
  }

  async findById(id: string): Promise<Message | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async save(message: Message): Promise<Message> {
    const entity = this.toTypeORM(message);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(message: Message): Promise<Message> {
    const entity = this.toTypeORM(message);
    const updatedEntity = await this.repository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByConversationId(
    conversationId: string,
    limit?: number,
    offset?: number,
    beforeDate?: Date,
    afterDate?: Date
  ): Promise<Message[]> {
    const queryBuilder = this.repository.createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId });

    if (beforeDate) {
      queryBuilder.andWhere('message.createdAt < :beforeDate', { beforeDate });
    }
    if (afterDate) {
      queryBuilder.andWhere('message.createdAt > :afterDate', { afterDate });
    }

    if (limit) {
      queryBuilder.limit(limit);
    }
    if (offset) {
      queryBuilder.offset(offset);
    }

    const entities = await queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Message[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async findByChannelType(channelType: string, limit?: number, offset?: number): Promise<Message[]> {
    const entities = await this.repository.find({
      where: { channelType },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async searchByContent(searchTerm: string): Promise<Message[]> {
    const entities = await this.repository
      .createQueryBuilder('message')
      .where('message.content ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('message.createdAt', 'DESC')
      .limit(50) // Limit search results
      .getMany();

    return entities.map(entity => this.toDomain(entity));
  }

  async countByConversationId(conversationId: string): Promise<number> {
    return await this.repository.count({
      where: { conversationId },
    });
  }

  async markAsReadForUser(userId: string, conversationId: string, messageIds: string[]): Promise<void> {
    // Update messages to mark them as read
    await this.repository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where('id IN (:...messageIds)', { messageIds })
      .andWhere('conversationId = :conversationId', { conversationId })
      .andWhere('userId = :userId', { userId })
      .execute();
  }

  async markAllAsReadForUser(userId: string, conversationId: string): Promise<void> {
    // Update all messages in the conversation for the user to be marked as read
    await this.repository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('userId = :userId', { userId })
      .execute();
  }

  /**
   * Transform TypeORM entity to domain entity.
   * Maps from the DB schema (MessageEntity) to the domain Message.
   */
  private toDomain(entity: MessageEntity): Message {
    // Build MessageContent from the entity's content string and metadata
    const contentMetadata = entity.metadata?.contentData as
      | { text?: string; html?: string; entities?: MessageContentEntity[] }
      | undefined;

    let content: MessageContent;
    if (contentMetadata && typeof contentMetadata === 'object') {
      content = new MessageContent({
        text: contentMetadata.text || entity.content || '',
        html: contentMetadata.html,
        entities: contentMetadata.entities || [],
      });
    } else {
      content = new MessageContent({
        text: entity.content || '',
      });
    }

    // Build reactions from metadata if stored there
    const reactionsData = entity.metadata?.reactions as
      | Array<{ id: string; userId: string; emoji: string; messageId: string; createdAt: string | Date }>
      | undefined;
    const reactions = Array.isArray(reactionsData)
      ? reactionsData.map((r) => new Reaction({
          id: r.id || `reaction-${Date.now()}`,
          userId: r.userId,
          emoji: r.emoji,
          messageId: r.messageId || entity.id,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        }))
      : [];

    return new Message({
      id: entity.id,
      conversationId: entity.conversationId,
      userId: entity.userId,
      senderExternalId: entity.senderExternalId,
      senderName: entity.senderName,
      senderAvatar: entity.senderAvatar,
      content,
      channelType: entity.channelType,
      externalId: entity.externalId,
      externalThreadId: entity.externalThreadId || undefined,
      direction: entity.direction as 'inbound' | 'outbound',
      status: entity.status as 'sent' | 'delivered' | 'read' | 'failed' | 'queued' | 'pending',
      metadata: entity.metadata || {},
      isRead: entity.isRead || false,
      createdAt: entity.createdAt,
      reactions,
    });
  }

  /**
   * Transform domain entity to TypeORM entity for persistence.
   */
  private toTypeORM(domain: Message): MessageEntity {
    const entity = new MessageEntity();
    entity.id = domain.id;
    entity.conversationId = domain.conversationId;
    entity.userId = domain.userId;
    entity.senderExternalId = domain.senderExternalId;
    entity.senderName = domain.senderName;
    entity.senderAvatar = domain.senderAvatar || '';
    entity.content = domain.content.text;
    entity.channelType = domain.channelType;
    entity.externalId = domain.externalId;
    entity.externalThreadId = domain.externalThreadId || '';
    entity.direction = domain.direction;
    entity.status = domain.status as MessageEntity['status'];
    entity.isRead = domain.isRead;
    entity.readAt = domain.isRead ? new Date() : null as unknown as Date;
    entity.mediaUrls = domain.attachments.map(att => att.url);
    entity.metadata = {
      ...domain.metadata,
      contentData: {
        text: domain.content.text,
        html: domain.content.html,
        entities: domain.content.entities,
      },
      reactions: domain.reactions.map(r => ({
        id: r.id,
        userId: r.userId,
        emoji: r.emoji,
        messageId: r.messageId,
        createdAt: r.createdAt,
      })),
    };
    entity.createdAt = domain.createdAt;

    return entity;
  }
}