import { UseCase } from './UseCase';
import { ConversationDomainService } from '../../domain/services/ConversationDomainService';
import { UserDomainService } from '../../domain/services/UserDomainService';

/**
 * CreateConversationDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for creating conversations between presentation and application layers
 * - Provides a contract for conversation creation requests
 * - Validates input at the application boundary
 */
export interface CreateConversationDTO {
  name?: string;
  type: 'direct' | 'group' | 'channel';
  participantIds: string[];
  creatorId: string;
  metadata?: Record<string, any>;
}

/**
 * AddParticipantDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for adding participants to conversations
 * - Provides a contract for participant addition requests
 */
export interface AddParticipantDTO {
  conversationId: string;
  participantId: string;
}

/**
 * RemoveParticipantDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for removing participants from conversations
 * - Provides a contract for participant removal requests
 */
export interface RemoveParticipantDTO {
  conversationId: string;
  participantId: string;
}

/**
 * ManageConversationDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for conversation management operations
 * - Provides a contract for conversation state changes
 */
export interface ManageConversationDTO {
  conversationId: string;
  userId: string;
  action: 'archive' | 'unarchive' | 'mute' | 'unmute';
}

/**
 * GetConversationsDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for retrieving conversations
 * - Provides a contract for conversation listing requests
 */
export interface GetConversationsDTO {
  userId: string;
  limit?: number;
  offset?: number;
}