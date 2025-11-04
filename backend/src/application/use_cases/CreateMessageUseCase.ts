import { UseCase } from './UseCase';
import { CreateMessageDTO } from '../dtos/MessageDTOs';
import { MessageDomainService } from '../../domain/services/MessageDomainService';
import { MessageContent } from '../../domain/value_objects/MessageContent';
import { Attachment } from '../../domain/value_objects/Attachment';

/**
 * CreateMessageUseCase
 * 
 * Architectural Intent:
 * - Orchestrates the creation of a new message
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
export class CreateMessageUseCase implements UseCase<CreateMessageDTO, any> {
  constructor(private messageDomainService: MessageDomainService) {}

  async execute(input: CreateMessageDTO): Promise<any> {
    // Validate input
    this.validateInput(input);

    // Transform DTO to domain objects
    const content = new MessageContent({
      text: input.content,
      html: input.html,
      entities: input.entities || [],
    });

    const attachments = input.attachments?.map(att => new Attachment({
      id: att.id || `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: att.type,
      url: att.url,
      thumbnailUrl: att.thumbnailUrl,
      name: att.name,
      size: att.size,
      mimeType: att.mimeType,
      uploadDate: new Date(),
    })) || [];

    // Execute domain service operation
    const message = await this.messageDomainService.sendMessage(
      input.userId,
      input.conversationId,
      content,
      attachments,
      input.parentId
    );

    // Transform result to appropriate output (in a real implementation, this would be a DTO)
    return {
      id: message.id,
      conversationId: message.conversationId,
      userId: message.userId,
      content: message.content.text,
      html: message.content.html,
      entities: message.content.entities,
      attachments: message.attachments.map(att => ({
        id: att.id,
        type: att.type,
        url: att.url,
        thumbnailUrl: att.thumbnailUrl,
        name: att.name,
        size: att.size,
        mimeType: att.mimeType,
      })),
      direction: message.direction,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  private validateInput(input: CreateMessageDTO): void {
    if (!input.conversationId) {
      throw new Error('Conversation ID is required');
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