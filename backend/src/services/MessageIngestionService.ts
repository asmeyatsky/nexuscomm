import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { ChannelType } from '@models/Account';
import pino from 'pino';

const logger = pino({ name: 'MessageIngestionService' });

/**
 * Normalized message format that all providers map to.
 */
export interface ExternalMessage {
  externalId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  direction: 'inbound' | 'outbound';
  mediaUrls?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Transforms external provider messages into internal Conversations + Messages.
 * Handles deduplication and conversation lookup/creation.
 */
export class MessageIngestionService {
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);

  /**
   * Find an existing conversation for this external sender, or create one.
   */
  async findOrCreateConversation(
    userId: string,
    externalSenderId: string,
    senderName: string,
    channelType: ChannelType,
    accountId: string
  ): Promise<Conversation> {
    // Look for an existing conversation with this participant on this channel
    const existing = await this.conversationRepository
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .andWhere(':senderId = ANY(c.participantIds)', { senderId: externalSenderId })
      .andWhere(':channel = ANY(c.channels)', { channel: channelType })
      .getOne();

    if (existing) {
      return existing;
    }

    const conversation = this.conversationRepository.create({
      userId,
      participantIds: [externalSenderId],
      participantNames: [senderName],
      participantAvatars: [],
      channels: [channelType],
      unreadCount: 0,
      metadata: { accountId },
    });

    return this.conversationRepository.save(conversation);
  }

  /**
   * Ingest a single external message into the system.
   * Skips duplicates based on externalId + channelType.
   */
  async ingestMessage(
    userId: string,
    accountId: string,
    channelType: ChannelType,
    externalMessage: ExternalMessage
  ): Promise<Message | null> {
    // Deduplication check
    const duplicate = await this.messageRepository
      .createQueryBuilder('m')
      .where('m.externalId = :externalId', { externalId: externalMessage.externalId })
      .andWhere('m.channelType = :channelType', { channelType })
      .andWhere('m.userId = :userId', { userId })
      .getOne();

    if (duplicate) {
      return null;
    }

    const conversation = await this.findOrCreateConversation(
      userId,
      externalMessage.senderId,
      externalMessage.senderName,
      channelType,
      accountId
    );

    const message = this.messageRepository.create({
      userId,
      conversationId: conversation.id,
      content: externalMessage.content,
      channelType,
      direction: externalMessage.direction,
      senderExternalId: externalMessage.senderId,
      senderName: externalMessage.senderName,
      externalId: externalMessage.externalId,
      mediaUrls: externalMessage.mediaUrls || [],
      senderAccountId: accountId,
      metadata: externalMessage.metadata || {},
      status: externalMessage.direction === 'outbound' ? 'sent' : 'delivered',
      isRead: externalMessage.direction === 'outbound',
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation with latest message info
    await this.conversationRepository.update(
      { id: conversation.id },
      {
        lastMessage: externalMessage.content,
        lastMessageTimestamp: externalMessage.timestamp,
        lastMessageDirection: externalMessage.direction,
        ...(externalMessage.direction === 'inbound' && {
          unreadCount: conversation.unreadCount + 1,
        }),
      }
    );

    return savedMessage;
  }

  /**
   * Bulk ingest messages from an initial sync.
   * Returns counts of created and skipped (duplicate) messages.
   */
  async ingestMessages(
    userId: string,
    accountId: string,
    channelType: ChannelType,
    externalMessages: ExternalMessage[]
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    // Sort by timestamp ascending so conversation state updates correctly
    const sorted = [...externalMessages].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (const msg of sorted) {
      try {
        const result = await this.ingestMessage(userId, accountId, channelType, msg);
        if (result) {
          created++;
        } else {
          skipped++;
        }
      } catch (error) {
        logger.error({ externalId: msg.externalId, error }, 'Failed to ingest message');
        skipped++;
      }
    }

    logger.info({ userId, accountId, channelType, created, skipped }, 'Bulk ingestion complete');
    return { created, skipped };
  }
}
