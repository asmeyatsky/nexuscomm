/**
 * User Value Object
 * 
 * Architectural Intent:
 * - Represents a user in the communication domain
 * - Immutable value object following DDD principles
 * - Encapsulates user data validation and metadata
 * - Provides methods for user manipulation while maintaining integrity
 * 
 * Key Design Decisions:
 * 1. Immutable to prevent user data corruption
 * 2. Encapsulates user validation rules
 * 3. Contains essential user identification data
 */
export interface UserProps {
  id: string;
  externalId: string;
  name: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  status?: string;
  statusEmoji?: string;
}

export class User {
  public readonly id: string;
  public readonly externalId: string;
  public readonly name: string;
  public readonly email?: string;
  public readonly avatar?: string;
  public readonly isOnline: boolean;
  public readonly lastSeen?: Date;
  public readonly status?: string;
  public readonly statusEmoji?: string;

  constructor(props: UserProps) {
    this.id = this.validateId(props.id);
    this.externalId = props.externalId;
    this.name = this.validateName(props.name);
    this.email = this.validateEmail(props.email);
    this.avatar = props.avatar;
    this.isOnline = props.isOnline || false;
    this.lastSeen = props.lastSeen;
    this.status = props.status;
    this.statusEmoji = props.statusEmoji;
  }

  private validateId(id: string): string {
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('User must have a valid ID');
    }
    return id;
  }

  private validateName(name: string): string {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('User name cannot be empty');
    }
    if (name.length > 100) {
      throw new Error('User name exceeds maximum length of 100 characters');
    }
    return name.trim();
  }

  private validateEmail(email?: string): string | undefined {
    if (!email) return email;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email;
  }

  /**
   * Check if user is currently online
   */
  public isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get user display name
   */
  public getDisplayName(): string {
    return this.name || this.email || this.id;
  }

  /**
   * Create user as online
   */
  public asOnline(): User {
    return new User({
      ...this,
      isOnline: true,
      lastSeen: new Date(),
    });
  }

  /**
   * Create user as offline
   */
  public asOffline(): User {
    return new User({
      ...this,
      isOnline: false,
      lastSeen: new Date(),
    });
  }

  /**
   * Update user status
   */
  public updateStatus(status: string, emoji?: string): User {
    return new User({
      ...this,
      status,
      statusEmoji: emoji,
    });
  }
}