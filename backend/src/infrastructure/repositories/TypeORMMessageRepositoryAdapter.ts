import { DataSource, Repository } from 'typeorm';
import { MessageRepositoryPort } from '../../domain/ports/MessageRepositoryPort';
import { Message } from '../../domain/entities/Message';
import { MessageContent } from '../../domain/value_objects/MessageContent';
import { Attachment } from '../../domain/value_objects/Attachment';
import { Reaction } from '../../domain/value_objects/Reaction';
import { Message as MessageEntity } from '../entities/Message'; // The TypeORM entity

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
    const messageEntity = await this.repository.findOne({
      where: { id },
    });

    return messageEntity ? this.toDomain(messageEntity) : null;
  }

  async save(message: Message): Promise<Message> {
    const messageEntity = this.toTypeORM(message);
    const savedEntity = await this.repository.save(messageEntity);
    return this.toDomain(savedEntity);
  }

  async update(message: Message): Promise<Message> {
    const messageEntity = this.toTypeORM(message);
    const updatedEntity = await this.repository.save(messageEntity);
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
    const whereClause: any = { conversationId };
    
    if (beforeDate) {
      whereClause.createdAt = { ...whereClause.createdAt, $lt: beforeDate };
    }
    if (afterDate) {
      whereClause.createdAt = { ...whereClause.createdAt, $gt: afterDate };
    }

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

    const messageEntities = await queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    return messageEntities.map(entity => this.toDomain(entity));
  }

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Message[]> {
    const messageEntities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return messageEntities.map(entity => this.toDomain(entity));
  }

  async findByChannelType(channelType: string, limit?: number, offset?: number): Promise<Message[]> {
    const messageEntities = await this.repository.find({
      where: { channelType },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return messageEntities.map(entity => this.toDomain(entity));
  }

  async searchByContent(searchTerm: string): Promise<Message[]> {
    const messageEntities = await this.repository
      .createQueryBuilder('message')
      .where('message.content ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orderBy('message.createdAt', 'DESC')
      .limit(50) // Limit search results
      .getMany();

    return messageEntities.map(entity => this.toDomain(entity));
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
        readAt: new Date() 
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
        readAt: new Date() 
      })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('userId = :userId', { userId })
      .execute();
  }

  /**
   * Transform TypeORM entity to domain entity
   */
  private toDomain(entity: MessageEntity): Message {
    // Transform content data from JSONB to MessageContent value object
    let content: MessageContent;
    if (typeof entity.contentData === 'object' && entity.contentData !== null) {
      content = new MessageContent({
        text: entity.contentData.text || entity.content || '',
        html: entity.contentData.html,
        entities: entity.contentData.entities || [],
      });
    } else {
      content = new MessageContent({
        text: entity.content || '',
      });
    }

    // Transform attachments
    const attachments = Array.isArray(entity.attachments) 
      ? entity.attachments.map(att => new Attachment({
          id: att.id || `att-${Date.now()}`,
          type: att.type,
          url: att.url,
          thumbnailUrl: att.thumbnailUrl,
          name: att.name,
          size: att.size,
          mimeType: att.mimeType,
          uploadDate: new Date(),
        }))
      : [];

    // Transform reactions
    const reactions = Array.isArray(entity.reactions) 
      ? entity.reactions.map((r: any) => new Reaction({
          id: r.id || `reaction-${Date.now()}`,
          userId: r.userId,
          emoji: r.emoji,
          messageId: r.messageId,
          createdAt: r.createdAt || new Date(),
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
      externalThreadId: entity.externalThreadId,
      parentId: entity.parentId,
      replyCount: entity.replyCount || 0,
      attachments,
      direction: entity.direction as 'inbound' | 'outbound',
      status: entity.status as 'sent' | 'delivered' | 'read' | 'failed' | 'queued' | 'pending',
      metadata: entity.metadata || {},
      isRead: entity.isRead || false,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      isEdited: entity.isEdited || false,
      isDeleted: entity.isDeleted || false,
      editHistory: Array.isArray(entity.editHistory) 
        ? entity.editHistory.map(eh => ({
            content: new MessageContent({ text: eh.content || '' }),
            editedAt: eh.editedAt || new Date(),
          }))
        : [],
      deletedAt: entity.deletedAt || undefined,
      reactions,
    });
  }

  /**
   * Transform domain entity to TypeORM entity
   */
  private toTypeORM(domain: Message): MessageEntity {
    const entity = new MessageEntity();
    entity.id = domain.id;
    entity.conversationId = domain.conversationId;
    entity.userId = domain.userId;
    entity.senderExternalId = domain.senderExternalId;
    entity.senderName = domain.senderName;
    entity.senderAvatar = domain.senderAvatar;
    entity.content = domain.content.text; // Store text as the primary content
    entity.contentData = {
      text: domain.content.text,
      html: domain.content.html,
      entities: domain.content.entities,
    };
    entity.channelType = domain.channelType;
    entity.externalId = domain.externalId;
    entity.externalThreadId = domain.externalThreadId;
    entity.parentId = domain.parentId;
    entity.replyCount = domain.replyCount;
    entity.attachments = domain.attachments.map(att => ({
      id: att.id,
      type: att.type,
      url: att.url,
      thumbnailUrl: att.thumbnailUrl,
      name: att.name,
      size: att.size,
      mimeType: att.mimeType,
    }));
    entity.direction = domain.direction;
    entity.status = domain.status;
    entity.metadata = domain.metadata;
    entity.isRead = domain.isRead;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.isEdited = domain.isEdited;
    entity.isDeleted = domain.isDeleted;
    entity.editHistory = Array.isArray(domain.editHistory) 
      ? domain.editHistory.map(eh => ({
          content: typeof eh.content === 'string' ? eh.content : eh.content.text,
          editedAt: eh.editedAt,
        }))
      : [];
    entity.deletedAt = domain.deletedAt;

    // Map reactions to a simplified format for storage
    entity.reactions = domain.reactions.map(r => ({
      id: r.id,
      userId: r.userId,
      emoji: r.emoji,
      messageId: r.messageId,
      createdAt: r.createdAt,
    }));

    return entity;
  }
}