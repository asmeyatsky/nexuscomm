import { UseCase } from './UseCase';
import { CreateConversationDTO, AddParticipantDTO, RemoveParticipantDTO, ManageConversationDTO, GetConversationsDTO } from '../dtos/ConversationDTOs';
import { ConversationDomainService } from '../../domain/services/ConversationDomainService';
import { UserDomainService } from '../../domain/services/UserDomainService';

/**
 * CreateConversationUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the creation of a new conversation
 * - Transforms DTO input to domain entity
 * - Delegates to domain service for business logic
 * - Returns appropriate output for presentation layer
 * 
 * Key Design Decisions:
 * 1. Transforms DTO to domain objects
 * 2. Validates input at application boundary
 * 3. Delegates complex business logic to domain service
 * 4. Maintains clean separation between layers
 */
export class CreateConversationUseCase implements UseCase<CreateConversationDTO, any> {
  constructor(
    private conversationDomainService: ConversationDomainService,
    private userDomainService: UserDomainService
  ) {}

  async execute(input: CreateConversationDTO): Promise<any> {
    // Validate input
    this.validateCreateConversationInput(input);

    // Execute domain service operation
    const conversation = await this.conversationDomainService.createConversation(
      input.name,
      input.type,
      input.participantIds,
      input.creatorId,
      input.metadata
    );

    // Transform result to appropriate output
    return {
      id: conversation.id,
      name: conversation.name,
      type: conversation.type,
      participantIds: conversation.participantIds,
      isArchived: conversation.isArchived,
      isMuted: conversation.isMuted,
      unreadCount: conversation.unreadCount,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      metadata: conversation.metadata,
    };
  }

  private validateCreateConversationInput(input: CreateConversationDTO): void {
    if (!input.type) {
      throw new Error('Conversation type is required');
    }
    
    if (!['direct', 'group', 'channel'].includes(input.type)) {
      throw new Error('Invalid conversation type. Must be one of: direct, group, channel');
    }
    
    if (!Array.isArray(input.participantIds) || input.participantIds.length === 0) {
      throw new Error('At least one participant is required');
    }
    
    if (input.type === 'direct' && input.participantIds.length !== 2) {
      throw new Error('Direct conversations must have exactly 2 participants');
    }
    
    if (input.type === 'direct' && input.participantIds.length > 100) {
      throw new Error('Group/channel conversations cannot exceed 100 participants');
    }
    
    if (input.name && input.name.length > 100) {
      throw new Error('Conversation name exceeds maximum length of 100 characters');
    }
    
    if (input.participantIds.some(id => !id || typeof id !== 'string')) {
      throw new Error('All participant IDs must be valid non-empty strings');
    }
  }
}

/**
 * AddParticipantUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the addition of a participant to a conversation
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates that user can add participants
 * 2. Ensures participant exists before adding
 * 3. Delegates to domain service for business logic
 */
export class AddParticipantUseCase implements UseCase<AddParticipantDTO, any> {
  constructor(private conversationDomainService: ConversationDomainService) {}

  async execute(input: AddParticipantDTO): Promise<any> {
    // Validate input
    this.validateAddParticipantInput(input);

    // Execute domain service operation
    const conversation = await this.conversationDomainService.addParticipantToConversation(
      input.conversationId,
      input.participantId
    );

    // Transform result to appropriate output
    return {
      id: conversation.id,
      participantIds: conversation.participantIds,
      updatedAt: conversation.updatedAt,
    };
  }

  private validateAddParticipantInput(input: AddParticipantDTO): void {
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!input.participantId) {
      throw new Error('Participant ID is required');
    }
  }
}

/**
 * RemoveParticipantUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the removal of a participant from a conversation
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates that user can remove participants
 * 2. Prevents removal of the last participant
 * 3. Delegates to domain service for business logic
 */
export class RemoveParticipantUseCase implements UseCase<RemoveParticipantDTO, any> {
  constructor(private conversationDomainService: ConversationDomainService) {}

  async execute(input: RemoveParticipantDTO): Promise<any> {
    // Validate input
    this.validateRemoveParticipantInput(input);

    // Execute domain service operation
    const conversation = await this.conversationDomainService.removeParticipantFromConversation(
      input.conversationId,
      input.participantId
    );

    // Transform result to appropriate output
    return {
      id: conversation.id,
      participantIds: conversation.participantIds,
      updatedAt: conversation.updatedAt,
    };
  }

  private validateRemoveParticipantInput(input: RemoveParticipantDTO): void {
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!input.participantId) {
      throw new Error('Participant ID is required');
    }
  }
}

/**
 * ManageConversationUseCase
 * 
 * Architectural Intent:
 * - Orchestrates conversation management operations (archive, mute, etc.)
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates the management action
 * 2. Ensures user has permission to perform action
 * 3. Delegates to appropriate domain service method
 */
export class ManageConversationUseCase implements UseCase<ManageConversationDTO, any> {
  constructor(private conversationDomainService: ConversationDomainService) {}

  async execute(input: ManageConversationDTO): Promise<any> {
    // Validate input
    this.validateManageConversationInput(input);

    let conversation: any;
    
    switch (input.action) {
      case 'archive':
        conversation = await this.conversationDomainService.archiveConversation(input.conversationId);
        break;
      case 'unarchive':
        conversation = await this.conversationDomainService.unarchiveConversation(input.conversationId);
        break;
      case 'mute':
        conversation = await this.conversationDomainService.muteConversation(input.conversationId, input.userId);
        break;
      case 'unmute':
        conversation = await this.conversationDomainService.unmuteConversation(input.conversationId, input.userId);
        break;
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }

    // Transform result to appropriate output
    return {
      id: conversation.id,
      isArchived: conversation.isArchived,
      isMuted: conversation.isMuted,
      updatedAt: conversation.updatedAt,
    };
  }

  private validateManageConversationInput(input: ManageConversationDTO): void {
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.action) {
      throw new Error('Action is required');
    }
    
    const validActions = ['archive', 'unarchive', 'mute', 'unmute'];
    if (!validActions.includes(input.action)) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }
  }
}

/**
 * GetConversationsUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the retrieval of conversations for a user
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates input parameters
 * 2. Applies pagination constraints
 * 3. Delegates to domain service for business logic
 */
export class GetConversationsUseCase implements UseCase<GetConversationsDTO, any> {
  constructor(private conversationDomainService: ConversationDomainService) {}

  async execute(input: GetConversationsDTO): Promise<any> {
    // Validate input
    this.validateGetConversationsInput(input);

    // Set default pagination values
    const limit = input.limit && input.limit > 0 && input.limit <= 100 ? input.limit : 50; // Max 100 per page
    const offset = input.offset && input.offset >= 0 ? input.offset : 0;

    // Execute domain service operation
    const { conversations, total } = await this.conversationDomainService.getAllConversationsForUser(
      input.userId,
      limit,
      offset
    );

    // Transform result to appropriate output
    const result = {
      conversations: conversations.map(conv => ({
        id: conv.id,
        name: conv.name,
        type: conv.type,
        participantIds: conv.participantIds,
        isArchived: conv.isArchived,
        isMuted: conv.isMuted,
        unreadCount: conv.unreadCount,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      total,
      limit,
      offset,
    };

    return result;
  }

  private validateGetConversationsInput(input: GetConversationsDTO): void {
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    
    if (input.limit && (input.limit <= 0 || input.limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }
    
    if (input.offset && input.offset < 0) {
      throw new Error('Offset must be non-negative');
    }
  }
}