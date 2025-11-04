import { User } from '../value_objects/User';
import { UserRepositoryPort } from '../ports/UserRepositoryPort';

/**
 * UserDomainService
 * 
 * Architectural Intent:
 * - Contains complex business logic related to user operations
 * - Orchestrates operations across multiple entities and repositories
 * - Encapsulates business rules that don't fit within a single entity
 * - Maintains invariants across the user domain
 * 
 * Key Design Decisions:
 * 1. Pure business logic without infrastructure concerns
 * 2. Uses domain repositories (ports) for data access
 * 3. Operates on domain entities and value objects
 * 4. Maintains transaction boundaries where appropriate
 */
export class UserDomainService {
  constructor(
    private userRepository: UserRepositoryPort
  ) {}

  /**
   * Create a new user
   */
  async createUser(
    externalId: string,
    name: string,
    email?: string,
    avatar?: string,
    metadata?: Record<string, any>
  ): Promise<User> {
    // Check if user with externalId already exists
    const existingUser = await this.userRepository.findByExternalId(externalId);
    if (existingUser) {
      throw new Error(`User with externalId ${externalId} already exists`);
    }

    // Check if user with email already exists (if email is provided)
    if (email) {
      const userWithSameEmail = await this.userRepository.findByEmail(email);
      if (userWithSameEmail) {
        throw new Error(`User with email ${email} already exists`);
      }
    }

    // Create the user entity
    const user = new User({
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      externalId,
      name,
      email,
      avatar,
    });

    // Save the user
    return await this.userRepository.save(user);
  }

  /**
   * Update user's online status
   */
  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    let updatedUser: User;
    if (isOnline) {
      updatedUser = user.asOnline();
    } else {
      updatedUser = user.asOffline();
    }

    return await this.userRepository.update(updatedUser);
  }

  /**
   * Update user's status message
   */
  async updateUserStatus(userId: string, status: string, statusEmoji?: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const updatedUser = user.updateStatus(status, statusEmoji);
    return await this.userRepository.update(updatedUser);
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }

  /**
   * Find user by external ID
   */
  async findUserByExternalId(externalId: string): Promise<User | null> {
    return await this.userRepository.findByExternalId(externalId);
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    name?: string,
    email?: string,
    avatar?: string
  ): Promise<User> {
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error(`User ${userId} not found`);
    }

    // Check if new email is already used by another user
    if (email && email !== existingUser.email) {
      const userWithSameEmail = await this.userRepository.findByEmail(email);
      if (userWithSameEmail) {
        throw new Error(`User with email ${email} already exists`);
      }
    }

    const updatedUser = new User({
      ...existingUser,
      name: name || existingUser.name,
      email: email || existingUser.email,
      avatar: avatar || existingUser.avatar,
    });

    return await this.userRepository.update(updatedUser);
  }
}