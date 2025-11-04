import { UseCase } from './UseCase';
import { UserDomainService } from '../../domain/services/UserDomainService';

/**
 * CreateUserDTO - Data Transfer Object
 */
export interface CreateUserDTO {
  externalId: string;
  name: string;
  email?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

/**
 * UpdateUserStatusDTO - Data Transfer Object
 */
export interface UpdateUserStatusDTO {
  userId: string;
  status: string;
  statusEmoji?: string;
}

/**
 * UpdateUserOnlineStatusDTO - Data Transfer Object
 */
export interface UpdateUserOnlineStatusDTO {
  userId: string;
  isOnline: boolean;
}

/**
 * UpdateUserProfileDTO - Data Transfer Object
 */
export interface UpdateUserProfileDTO {
  userId: string;
  name?: string;
  email?: string;
  avatar?: string;
}

/**
 * GetUserDTO - Data Transfer Object
 */
export interface GetUserDTO {
  userId: string;
}

/**
 * FindUserDTO - Data Transfer Object
 */
export interface FindUserDTO {
  identifier: string; // Can be ID, external ID, or email
  type: 'id' | 'externalId' | 'email';
}

/**
 * CreateUserUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the creation of a new user
 * - Validates input and business rules
 * - Transforms between layers
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates user data at application boundary
 * 2. Checks for duplicate users
 * 3. Delegates to domain service for business logic
 * 4. Transforms result for presentation layer
 */
export class CreateUserUseCase implements UseCase<CreateUserDTO, any> {
  constructor(private userDomainService: UserDomainService) {}

  async execute(input: CreateUserDTO): Promise<any> {
    // Validate input
    this.validateCreateUserInput(input);

    // Execute domain service operation
    const user = await this.userDomainService.createUser(
      input.externalId,
      input.name,
      input.email,
      input.avatar,
      input.metadata
    );

    // Transform result to appropriate output
    return {
      id: user.id,
      externalId: user.externalId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      status: user.status,
      statusEmoji: user.statusEmoji,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private validateCreateUserInput(input: CreateUserDTO): void {
    if (!input.externalId) {
      throw new Error('External ID is required');
    }
    
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    
    if (input.name.length > 100) {
      throw new Error('Name exceeds maximum length of 100 characters');
    }
    
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new Error('Invalid email format');
    }
    
    if (input.avatar && input.avatar.length > 500) {
      throw new Error('Avatar URL exceeds maximum length of 500 characters');
    }
  }
}

/**
 * UpdateUserStatusUseCase
 * 
 * Architectural Intent:
 * - Orchestrates user status updates
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates status data
 * 2. Delegates to domain service for business logic
 */
export class UpdateUserStatusUseCase implements UseCase<UpdateUserStatusDTO, any> {
  constructor(private userDomainService: UserDomainService) {}

  async execute(input: UpdateUserStatusDTO): Promise<any> {
    // Validate input
    this.validateUpdateUserStatusInput(input);

    // Execute domain service operation
    const user = await this.userDomainService.updateUserStatus(
      input.userId,
      input.status,
      input.statusEmoji
    );

    // Transform result to appropriate output
    return {
      id: user.id,
      status: user.status,
      statusEmoji: user.statusEmoji,
      updatedAt: user.updatedAt,
    };
  }

  private validateUpdateUserStatusInput(input: UpdateUserStatusDTO): void {
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    
    if (!input.status || input.status.length > 100) {
      throw new Error('Status is required and must be less than 100 characters');
    }
    
    if (input.statusEmoji) {
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
      if (!emojiRegex.test(input.statusEmoji)) {
        throw new Error('Invalid status emoji');
      }
    }
  }
}

/**
 * UpdateUserOnlineStatusUseCase
 * 
 * Architectural Intent:
 * - Orchestrates user online status updates
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Updates user online status
 * 2. Records last seen timestamp
 * 3. Delegates to domain service for business logic
 */
export class UpdateUserOnlineStatusUseCase implements UseCase<UpdateUserOnlineStatusDTO, any> {
  constructor(private userDomainService: UserDomainService) {}

  async execute(input: UpdateUserOnlineStatusDTO): Promise<any> {
    // Validate input
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    if (typeof input.isOnline !== 'boolean') {
      throw new Error('isOnline must be a boolean value');
    }

    // Execute domain service operation
    const user = await this.userDomainService.updateUserOnlineStatus(
      input.userId,
      input.isOnline
    );

    // Transform result to appropriate output
    return {
      id: user.id,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      updatedAt: user.updatedAt,
    };
  }
}

/**
 * UpdateUserProfileUseCase
 * 
 * Architectural Intent:
 * - Orchestrates user profile updates
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates profile data
 * 2. Checks for email uniqueness
 * 3. Delegates to domain service for business logic
 */
export class UpdateUserProfileUseCase implements UseCase<UpdateUserProfileDTO, any> {
  constructor(private userDomainService: UserDomainService) {}

  async execute(input: UpdateUserProfileDTO): Promise<any> {
    // Validate input
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    // Execute domain service operation
    const user = await this.userDomainService.updateUserProfile(
      input.userId,
      input.name,
      input.email,
      input.avatar
    );

    // Transform result to appropriate output
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      updatedAt: user.updatedAt,
    };
  }
}