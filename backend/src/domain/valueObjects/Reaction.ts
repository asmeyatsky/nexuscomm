/**
 * Reaction Value Object
 * 
 * Architectural Intent:
 * - Represents a reaction (emoji) on a message
 * - Immutable value object following DDD principles
 * - Encapsulates reaction validation and metadata
 * - Provides methods for reaction manipulation while maintaining integrity
 * 
 * Key Design Decisions:
 * 1. Immutable to prevent reaction corruption
 * 2. Encapsulates emoji validation rules
 * 3. Links to user who added the reaction
 */
export interface ReactionProps {
  id: string;
  userId: string;
  emoji: string;
  messageId: string;
  createdAt: Date;
}

export class Reaction {
  public readonly id: string;
  public readonly userId: string;
  public readonly emoji: string;
  public readonly messageId: string;
  public readonly createdAt: Date;

  constructor(props: ReactionProps) {
    this.id = props.id;
    this.userId = this.validateUserId(props.userId);
    this.emoji = this.validateEmoji(props.emoji);
    this.messageId = this.validateMessageId(props.messageId);
    this.createdAt = props.createdAt || new Date();
  }

  private validateUserId(userId: string): string {
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new Error('Reaction must have a valid user ID');
    }
    return userId;
  }

  private validateEmoji(emoji: string): string {
    // Basic emoji validation - could be enhanced with more sophisticated validation
    if (typeof emoji !== 'string' || emoji.length === 0) {
      throw new Error('Reaction must have a valid emoji');
    }
    
    // Check if it's a valid emoji by checking for unicode characters
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    if (!emojiRegex.test(emoji)) {
      throw new Error('Invalid emoji provided for reaction');
    }
    
    return emoji;
  }

  private validateMessageId(messageId: string): string {
    if (typeof messageId !== 'string' || messageId.length === 0) {
      throw new Error('Reaction must have a valid message ID');
    }
    return messageId;
  }

  /**
   * Check if this reaction is from a specific user
   */
  public isFromUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Get emoji character
   */
  public getEmoji(): string {
    return this.emoji;
  }
}