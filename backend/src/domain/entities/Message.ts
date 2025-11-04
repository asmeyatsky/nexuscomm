import { v4 as uuidv4 } from 'uuid';
import { User } from '../value_objects/User';
import { Conversation } from '../value_objects/Conversation';
import { MessageContent } from '../value_objects/MessageContent';
import { Attachment } from '../value_objects/Attachment';
import { Reaction } from '../value_objects/Reaction';

/**
 * Message Domain Entity
 * 
 * Architectural Intent:
 * - This entity represents a message in the communication domain
 * - Following immutable domain model pattern to prevent accidental state corruption
 * - Contains business logic for message operations while maintaining invariants
 * - All state changes return new instances instead of mutating existing ones
 * 
 * Key Design Decisions:
 * 1. Messages are immutable to prevent state corruption during concurrent operations
 * 2. Rich value objects encapsulate complex data structures
 * 3. Business rules are enforced within the entity methods
 * 4. All changes follow functional update pattern (returning new instance)
 */
export interface MessageProps {
  id?: string;
  conversationId: string;
  userId: string;
  senderExternalId: string;
  senderName: string;
  senderAvatar?: string;
  content: MessageContent;
  channelType: string;
  externalId: string;
  externalThreadId?: string;
  parentId?: string;
  replyCount?: number;
  attachments?: Attachment[];
  direction: 'inbound' | 'outbound';
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'queued' | 'pending';
  metadata?: Record<string, any>;
  isRead?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
  isDeleted?: boolean;
  editHistory?: Array<{ content: MessageContent; editedAt: Date }>;
  deletedAt?: Date;
  reactions?: Reaction[];
}

export class Message {
  public readonly id: string;
  public readonly conversationId: string;
  public readonly userId: string;
  public readonly senderExternalId: string;
  public readonly senderName: string;
  public readonly senderAvatar?: string;
  public readonly content: MessageContent;
  public readonly channelType: string;
  public readonly externalId: string;
  public readonly externalThreadId?: string;
  public readonly parentId?: string;
  public replyCount: number;
  public readonly attachments: Attachment[];
  public readonly direction: 'inbound' | 'outbound';
  public status: 'sent' | 'delivered' | 'read' | 'failed' | 'queued' | 'pending';
  public readonly metadata: Record<string, any>;
  public isRead: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public isEdited: boolean;
  public isDeleted: boolean;
  public readonly editHistory: Array<{ content: MessageContent; editedAt: Date }>;
  public deletedAt?: Date;
  public reactions: Reaction[];

  constructor(props: MessageProps) {
    this.id = props.id || uuidv4();
    this.conversationId = props.conversationId;
    this.userId = props.userId;
    this.senderExternalId = props.senderExternalId;
    this.senderName = props.senderName;
    this.senderAvatar = props.senderAvatar;
    this.content = props.content;
    this.channelType = props.channelType;
    this.externalId = props.externalId;
    this.externalThreadId = props.externalThreadId;
    this.parentId = props.parentId;
    this.replyCount = props.replyCount || 0;
    this.attachments = props.attachments || [];
    this.direction = props.direction;
    this.status = props.status || 'sent';
    this.metadata = props.metadata || {};
    this.isRead = props.isRead || false;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt || new Date();
    this.isEdited = props.isEdited || false;
    this.isDeleted = props.isDeleted || false;
    this.editHistory = props.editHistory || [];
    this.reactions = props.reactions || [];
  }

  /**
   * Mark message as read
   */
  public markAsRead(): Message {
    return new Message({
      ...this,
      isRead: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Mark message as delivered
   */
  public markAsDelivered(): Message {
    return new Message({
      ...this,
      status: 'delivered',
      updatedAt: new Date(),
    });
  }

  /**
   * Mark message as read receipt
   */
  public markAsReadReceipt(): Message {
    return new Message({
      ...this,
      status: 'read',
      updatedAt: new Date(),
    });
  }

  /**
   * Update message content (with edit history)
   */
  public updateContent(newContent: MessageContent, maxEditWindowMs: number = 15 * 60 * 1000): Message {
    const timeSinceCreation = Date.now() - this.createdAt.getTime();
    
    if (timeSinceCreation > maxEditWindowMs) {
      throw new Error('Edit window has expired');
    }

    const newEditHistory = [
      ...this.editHistory,
      { content: this.content, editedAt: new Date() }
    ];

    return new Message({
      ...this,
      content: newContent,
      isEdited: true,
      editHistory: newEditHistory,
      updatedAt: new Date(),
    });
  }

  /**
   * Soft delete message
   */
  public softDelete(): Message {
    return new Message({
      ...this,
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Add reaction to message
   */
  public addReaction(reaction: Reaction): Message {
    const existingReactionIndex = this.reactions.findIndex(
      r => r.userId === reaction.userId && r.emoji === reaction.emoji
    );

    if (existingReactionIndex >= 0) {
      // Update existing reaction
      const updatedReactions = [...this.reactions];
      updatedReactions[existingReactionIndex] = reaction;
      return new Message({
        ...this,
        reactions: updatedReactions,
        updatedAt: new Date(),
      });
    }

    // Add new reaction
    return new Message({
      ...this,
      reactions: [...this.reactions, reaction],
      updatedAt: new Date(),
    });
  }

  /**
   * Remove reaction from message
   */
  public removeReaction(userId: string, emoji: string): Message {
    const filteredReactions = this.reactions.filter(
      r => !(r.userId === userId && r.emoji === emoji)
    );

    return new Message({
      ...this,
      reactions: filteredReactions,
      updatedAt: new Date(),
    });
  }

  /**
   * Add reply (increment reply count)
   */
  public addReply(): Message {
    return new Message({
      ...this,
      replyCount: this.replyCount + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Check if message is from the same user as specified id
   */
  public isFromUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if message can be edited (within time window)
   */
  public canBeEdited(maxEditWindowMs: number = 15 * 60 * 1000): boolean {
    const timeSinceCreation = Date.now() - this.createdAt.getTime();
    return !this.isDeleted && timeSinceCreation <= maxEditWindowMs;
  }
}