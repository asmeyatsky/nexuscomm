import { UseCase } from './UseCase';
import { MarkMessagesAsReadDTO } from '../dtos/MessageDTOs';
import { MessageDomainService } from '../../domain/services/MessageDomainService';

/**
 * MarkMessagesAsReadUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the marking of messages as read
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * - Returns appropriate output for presentation layer
 * 
 * Key Design Decisions:
 * 1. Validates that user has access to conversation
 * 2. Handles both individual message reads and all messages in conversation
 * 3. Delegates to domain service for business logic
 */
export class MarkMessagesAsReadUseCase implements UseCase<MarkMessagesAsReadDTO, void> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: MarkMessagesAsReadDTO): Promise<void> {
    // Validate input
    this.validateInput(input);

    if (input.messageIds && input.messageIds.length > 0) {
      // Mark specific messages as read
      await this.messageDomainService.markMessagesAsRead(
        input.userId,
        input.conversationId,
        input.messageIds
      );
    } else {
      // Mark all messages in conversation as read
      await this.messageDomainService.markAllMessagesAsRead(
        input.userId,
        input.conversationId
      );
    }
  }

  private validateInput(input: MarkMessagesAsReadDTO): void {
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    if (input.messageIds) {
      // If specific message IDs are provided, validate them
      if (!Array.isArray(input.messageIds) || input.messageIds.length === 0) {
        throw new Error('Message IDs must be a non-empty array or omitted for all messages');
      }
      
      // Validate each message ID
      for (const msgId of input.messageIds) {
        if (typeof msgId !== 'string' || msgId.trim().length === 0) {
          throw new Error('All message IDs must be non-empty strings');
        }
      }
    }
  }
}