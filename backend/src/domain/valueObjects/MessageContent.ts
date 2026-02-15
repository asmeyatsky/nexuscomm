/**
 * MessageContent Value Object
 * 
 * Architectural Intent:
 * - Represents the content of a message with rich text capabilities
 * - Immutable value object following DDD principles
 * - Encapsulates content validation and formatting logic
 * - Provides methods for content manipulation while maintaining integrity
 * 
 * Key Design Decisions:
 * 1. Immutable to prevent content corruption
 * 2. Encapsulates content validation rules
 * 3. Supports rich formatting with entities
 */
export interface MessageContentEntity {
  type: 'mention' | 'hashtag' | 'code' | 'link';
  offset: number;
  length: number;
  data?: any;
}

export interface MessageContentProps {
  text: string;
  html?: string;
  entities?: MessageContentEntity[];
}

export class MessageContent {
  public readonly text: string;
  public readonly html?: string;
  public readonly entities: MessageContentEntity[];

  constructor(props: MessageContentProps) {
    this.text = this.validateText(props.text);
    this.html = props.html;
    this.entities = props.entities || [];
  }

  private validateText(text: string): string {
    if (typeof text !== 'string') {
      throw new Error('Message content must be a string');
    }
    if (text.length > 10000) {  // Max 10k characters
      throw new Error('Message content exceeds maximum length of 10,000 characters');
    }
    return text.trim();
  }

  /**
   * Get mentions from content
   */
  public getMentions(): MessageContentEntity[] {
    return this.entities.filter(entity => entity.type === 'mention');
  }

  /**
   * Get hashtags from content
   */
  public getHashtags(): MessageContentEntity[] {
    return this.entities.filter(entity => entity.type === 'hashtag');
  }

  /**
   * Get links from content
   */
  public getLinks(): MessageContentEntity[] {
    return this.entities.filter(entity => entity.type === 'link');
  }

  /**
   * Check if content is empty
   */
  public isEmpty(): boolean {
    return this.text.length === 0 && this.entities.length === 0;
  }

  /**
   * Get content length
   */
  public length(): number {
    return this.text.length;
  }

  /**
   * Create a copy with updated text
   */
  public withText(newText: string): MessageContent {
    return new MessageContent({
      ...this,
      text: newText,
    });
  }
}