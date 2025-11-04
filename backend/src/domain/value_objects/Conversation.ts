/**
 * Conversation Value Object
 * 
 * Architectural Intent:
 * - Represents a conversation thread in the communication domain
 * - Immutable value object following DDD principles
 * - Encapsulates conversation metadata and properties
 * - Provides methods for conversation manipulation while maintaining integrity
 * 
 * Key Design Decisions:
 * 1. Immutable to prevent conversation corruption
 * 2. Encapsulates conversation validation rules
 * 3. Contains essential conversation metadata
 */
export interface ConversationProps {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'channel';
  participantIds: string[];
  isArchived?: boolean;
  isMuted?: boolean;
  unreadCount?: number;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

export class Conversation {
  public readonly id: string;
  public readonly name?: string;
  public readonly type: 'direct' | 'group' | 'channel';
  public readonly participantIds: string[];
  public readonly isArchived: boolean;
  public readonly isMuted: boolean;
  public readonly unreadCount: number;
  public readonly lastMessageAt?: Date;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly metadata: Record<string, any>;

  constructor(props: ConversationProps) {
    this.id = this.validateId(props.id);
    this.name = props.name;
    this.type = this.validateType(props.type);
    this.participantIds = this.validateParticipantIds(props.participantIds);
    this.isArchived = props.isArchived || false;
    this.isMuted = props.isMuted || false;
    this.unreadCount = props.unreadCount || 0;
    this.lastMessageAt = props.lastMessageAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt || new Date();
    this.metadata = props.metadata || {};
  }

  private validateId(id: string): string {
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('Conversation must have a valid ID');
    }
    return id;
  }

  private validateType(type: string): 'direct' | 'group' | 'channel' {
    const validTypes = ['direct', 'group', 'channel'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid conversation type: ${type}`);
    }
    return type as 'direct' | 'group' | 'channel';
  }

  private validateParticipantIds(participantIds: string[]): string[] {
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      throw new Error('Conversation must have at least one participant');
    }
    if (participantIds.length > 1000) { // Arbitrary limit for group size
      throw new Error('Conversation exceeds maximum participant count of 1000');
    }
    
    // Validate each participant ID
    for (const pid of participantIds) {
      if (typeof pid !== 'string' || pid.length === 0) {
        throw new Error('Invalid participant ID');
      }
    }
    
    return participantIds;
  }

  /**
   * Check if a user is a participant in this conversation
   */
  public isParticipant(userId: string): boolean {
    return this.participantIds.includes(userId);
  }

  /**
   * Check if conversation is a direct message
   */
  public isDirect(): boolean {
    return this.type === 'direct';
  }

  /**
   * Check if conversation is a group conversation
   */
  public isGroup(): boolean {
    return this.type === 'group';
  }

  /**
   * Check if conversation is a channel
   */
  public isChannel(): boolean {
    return this.type === 'channel';
  }

  /**
   * Get participant count
   */
  public getParticipantCount(): number {
    return this.participantIds.length;
  }

  /**
   * Archive conversation
   */
  public archive(): Conversation {
    return new Conversation({
      ...this,
      isArchived: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Unarchive conversation
   */
  public unarchive(): Conversation {
    return new Conversation({
      ...this,
      isArchived: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Mute conversation
   */
  public mute(): Conversation {
    return new Conversation({
      ...this,
      isMuted: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Unmute conversation
   */
  public unmute(): Conversation {
    return new Conversation({
      ...this,
      isMuted: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Add unread count
   */
  public addUnreadCount(count: number): Conversation {
    return new Conversation({
      ...this,
      unreadCount: Math.max(0, this.unreadCount + count),
      updatedAt: new Date(),
    });
  }

  /**
   * Reset unread count
   */
  public resetUnreadCount(): Conversation {
    return new Conversation({
      ...this,
      unreadCount: 0,
      updatedAt: new Date(),
    });
  }

  /**
   * Update last message timestamp
   */
  public updateLastMessageAt(timestamp: Date): Conversation {
    return new Conversation({
      ...this,
      lastMessageAt: timestamp,
      updatedAt: new Date(),
    });
  }

  /**
   * Add a participant to the conversation
   */
  public addParticipant(userId: string): Conversation {
    if (this.participantIds.includes(userId)) {
      return this; // User already in conversation
    }
    
    return new Conversation({
      ...this,
      participantIds: [...this.participantIds, userId],
      updatedAt: new Date(),
    });
  }

  /**
   * Remove a participant from the conversation
   */
  public removeParticipant(userId: string): Conversation {
    const newParticipantIds = this.participantIds.filter(id => id !== userId);
    
    if (newParticipantIds.length === 0) {
      throw new Error('Cannot remove all participants from conversation');
    }
    
    return new Conversation({
      ...this,
      participantIds: newParticipantIds,
      updatedAt: new Date(),
    });
  }
}