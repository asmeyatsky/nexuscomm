import { UseCase } from './UseCase';
import { UpdateMessageDTO } from '../dtos/MessageDTOs';
import { MessageDomainService } from '../../domain/services/MessageDomainService';
import { MessageContent } from '../../domain/value_objects/MessageContent';

/**
 * UpdateMessageUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the update of an existing message
 * - Validates permissions and business rules
 * - Transforms DTO input to domain entity
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates that user owns the message
 * 2. Checks edit window constraints
 * 3. Transforms DTO to domain objects
 * 4. Delegates to domain service for business logic
 */
export class UpdateMessageUseCase implements UseCase<UpdateMessageDTO, any> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: UpdateMessageDTO): Promise<any> {
    // Validate input
    this.validateInput(input);

    // Transform DTO to domain objects
    const content = new MessageContent({
      text: input.content,
      html: input.html,
      entities: input.entities || [],
    });

    // Execute domain service operation
    const message = await this.messageDomainService.editMessage(
      input.userId,
      input.messageId,
      content
    );

    // Transform result to appropriate output
    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content.text,
      html: message.content.html,
      entities: message.content.entities,
      isEdited: message.isEdited,
      updatedAt: message.updatedAt,
      editHistory: message.editHistory,
    };
  }

  private validateInput(input: UpdateMessageDTO): void {
    if (!input.messageId) {
      throw new Error('Message ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.content || input.content.trim().length === 0) {
      throw new Error('Message content is required');
    }
    if (input.content.length > 10000) {
      throw new Error('Message content exceeds maximum length of 10,000 characters');
    }
  }
}