import { Message } from '../entities/Message';
import { User } from '../value_objects/User';
import { Conversation } from '../value_objects/Conversation';

/**
 * MessageRepositoryPort Interface
 * 
 * Architectural Intent:
 * - Defines the contract for message data access operations
 * - Part of the domain layer, not tied to specific infrastructure
 * - Enables port/adapter pattern for testability and flexibility
 * - Supports the hexagonal architecture by defining domain-facing contracts
 * 
 * Key Design Decisions:
 * 1. Methods defined at domain level, not infrastructure level
 * 2. Return domain entities/value objects, not data transfer objects
 * 3. Support for various query patterns needed by domain services
 * 4. Follows interface segregation principle
 */
export interface MessageRepositoryPort {
  /**
   * Find a message by its ID
   */
  findById(id: string): Promise<Message | null>;

  /**
   * Save a message
   */
  save(message: Message): Promise<Message>;

  /**
   * Update a message
   */
  update(message: Message): Promise<Message>;

  /**
   * Delete a message
   */
  delete(id: string): Promise<void>;

  /**
   * Find messages by conversation ID with pagination
   */
  findByConversationId(
    conversationId: string, 
    limit?: number, 
    offset?: number,
    beforeDate?: Date,
    afterDate?: Date
  ): Promise<Message[]>;

  /**
   * Find messages by user ID with pagination
   */
  findByUserId(
    userId: string, 
    limit?: number, 
    offset?: number
  ): Promise<Message[]>;

  /**
   * Find messages by channel type
   */
  findByChannelType(
    channelType: string, 
    limit?: number, 
    offset?: number
  ): Promise<Message[]>;

  /**
   * Find messages with content matching search term
   */
  searchByContent(searchTerm: string): Promise<Message[]>;

  /**
   * Count messages for a conversation
   */
  countByConversationId(conversationId: string): Promise<number>;

  /**
   * Mark messages as read for a user in a conversation
   */
  markAsReadForUser(userId: string, conversationId: string, messageIds: string[]): Promise<void>;

  /**
   * Mark all messages as read for a user in a conversation
   */
  markAllAsReadForUser(userId: string, conversationId: string): Promise<void>;
}