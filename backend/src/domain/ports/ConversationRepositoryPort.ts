import { Conversation } from '../value_objects/Conversation';
import { User } from '../value_objects/User';

/**
 * ConversationRepositoryPort Interface
 * 
 * Architectural Intent:
 * - Defines the contract for conversation data access operations
 * - Part of the domain layer, not tied to specific infrastructure
 * - Enables port/adapter pattern for testability and flexibility
 * - Supports the hexagonal architecture by defining domain-facing contracts
 * 
 * Key Design Decisions:
 * 1. Methods defined at domain level, not infrastructure level
 * 2. Return domain entities/value objects, not data transfer objects
 * 3. Support for various conversation operations needed by domain services
 * 4. Follows interface segregation principle
 */
export interface ConversationRepositoryPort {
  /**
   * Find a conversation by its ID
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Save a conversation
   */
  save(conversation: Conversation): Promise<Conversation>;

  /**
   * Update a conversation
   */
  update(conversation: Conversation): Promise<Conversation>;

  /**
   * Delete a conversation
   */
  delete(id: string): Promise<void>;

  /**
   * Find conversations by participant ID
   */
  findByParticipantId(userId: string): Promise<Conversation[]>;

  /**
   * Find conversations by participant IDs (for direct messages)
   */
  findByParticipantIds(userIds: string[]): Promise<Conversation[]>;

  /**
   * Find all conversations for a user with pagination
   */
  findAllForUser(
    userId: string, 
    limit?: number, 
    offset?: number
  ): Promise<Conversation[]>;

  /**
   * Count conversations for a user
   */
  countForUser(userId: string): Promise<number>;

  /**
   * Find unread conversations for a user
   */
  findUnreadConversations(userId: string): Promise<Conversation[]>;

  /**
   * Update last message timestamp for a conversation
   */
  updateLastMessageAt(conversationId: string, timestamp: Date): Promise<Conversation>;

  /**
   * Update unread count for a conversation
   */
  updateUnreadCount(conversationId: string, count: number): Promise<Conversation>;
}