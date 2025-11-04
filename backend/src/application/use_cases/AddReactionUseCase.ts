import { UseCase } from './UseCase';
import { AddReactionDTO } from '../dtos/MessageDTOs';
import { MessageDomainService } from '../../domain/services/MessageDomainService';

/**
 * AddReactionUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the addition of a reaction to a message
 * - Validates input and permissions
 * - Transforms DTO input to domain entity
 * - Delegates to domain service for business logic
 * 
 * Key Design Decisions:
 * 1. Validates emoji format
 * 2. Transforms DTO to domain objects
 * 3. Delegates to domain service for business logic
 */
export class AddReactionUseCase implements UseCase<AddReactionDTO, any> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: AddReactionDTO): Promise<any> {
    // Validate input
    this.validateInput(input);

    // Execute domain service operation
    const message = await this.messageDomainService.addReaction(
      input.userId,
      input.messageId,
      input.emoji
    );

    // Transform result to appropriate output (in a real implementation, this would be a DTO)
    return {
      id: message.id,
      reactions: message.reactions.map(r => ({
        id: r.id,
        userId: r.userId,
        emoji: r.emoji,
        createdAt: r.createdAt,
      })),
    };
  }

  private validateInput(input: AddReactionDTO): void {
    if (!input.messageId) {
      throw new Error('Message ID is required');
    }
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.emoji) {
      throw new Error('Emoji is required');
    }
    
    // Basic emoji validation
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    if (!emojiRegex.test(input.emoji)) {
      throw new Error('Invalid emoji provided');
    }
  }
}