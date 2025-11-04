import { User } from '../value_objects/User';

/**
 * UserRepositoryPort Interface
 * 
 * Architectural Intent:
 * - Defines the contract for user data access operations
 * - Part of the domain layer, not tied to specific infrastructure
 * - Enables port/adapter pattern for testability and flexibility
 * - Supports the hexagonal architecture by defining domain-facing contracts
 * 
 * Key Design Decisions:
 * 1. Methods defined at domain level, not infrastructure level
 * 2. Return domain entities/value objects, not data transfer objects
 * 3. Support for various user operations needed by domain services
 * 4. Follows interface segregation principle
 */
export interface UserRepositoryPort {
  /**
   * Find a user by its ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by external ID
   */
  findByExternalId(externalId: string): Promise<User | null>;

  /**
   * Find a user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Save a user
   */
  save(user: User): Promise<User>;

  /**
   * Update a user
   */
  update(user: User): Promise<User>;

  /**
   * Delete a user
   */
  delete(id: string): Promise<void>;

  /**
   * Find users by a list of IDs
   */
  findByIds(ids: string[]): Promise<User[]>;

  /**
   * Update user's online status
   */
  updateOnlineStatus(userId: string, isOnline: boolean, lastSeen?: Date): Promise<User>;

  /**
   * Update user's status message
   */
  updateStatus(userId: string, status: string, statusEmoji?: string): Promise<User>;
}