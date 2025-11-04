import { UseCase } from './UseCase';
import { DeleteMessageDTO } from '../dtos/MessageDTOs';
import { MessageDomainService } from '../../domain/services/MessageDomainService';

/**
 * DeleteMessageUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the deletion of an existing message
 * - Validates permissions and business rules
 * - Delegates to domain service for business logic
 * - Returns appropriate output for presentation layer
 * 
 * Key Design Decisions:
 * 1. Validates that user owns the message
 * 2. Implements soft delete pattern
 * 3. Delegates to domain service for business logic
 */
export class DeleteMessageUseCase implements UseCase<DeleteMessageDTO, void> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: DeleteMessageDTO): Promise<void> {
    // Validate input
    this.validateInput(input);

    // Execute domain service operation
    await this.messageDomainService.deleteMessage(
      input.userId,
      input.messageId
    );
  }

  private validateInput(input: DeleteMessageDTO): void {
    if (!input.messageId) {
      throw new Error('Message ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
  }
}