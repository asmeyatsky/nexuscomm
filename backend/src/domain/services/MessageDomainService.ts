import { Message } from '../entities/Message';
import { User } from '../value_objects/User';
import { Conversation } from '../value_objects/Conversation';
import { MessageRepositoryPort } from '../ports/MessageRepositoryPort';
import { ConversationRepositoryPort } from '../ports/ConversationRepositoryPort';
import { MessageContent } from '../value_objects/MessageContent';
import { Attachment } from '../value_objects/Attachment';
import { Reaction } from '../value_objects/Reaction';

/**
 * MessageDomainService
 * 
 * Architectural Intent:
 * - Contains complex business logic related to message operations
 * - Orchestrates operations across multiple entities and repositories
 * - Encapsulates business rules that don't fit within a single entity
 * - Maintains invariants across the message domain
 * 
 * Key Design Decisions:
 * 1. Pure business logic without infrastructure concerns
 * 2. Uses domain repositories (ports) for data access
 * 3. Operates on domain entities and value objects
 * 4. Maintains transaction boundaries where appropriate
 */
export class MessageDomainService {
  constructor(
    private messageRepository: MessageRepositoryPort,
    private conversationRepository: ConversationRepositoryPort
  ) {}

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    content: MessageContent,
    attachments: Attachment[] = [],
    parentId?: string
  ): Promise<Message> {
    // Check if conversation exists and user is a participant
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    if (!conversation.isParticipant(userId)) {
      throw new Error(`User ${userId} is not a participant in conversation ${conversationId}`);
    }

    // Create the message entity
    const message = new Message({
      conversationId,
      userId,
      senderExternalId: userId, // Simplified - would typically use actual external ID
      senderName: `User-${userId}`, // Simplified - would get from user service
      content,
      channelType: 'internal', // This would be determined by the channel
      externalId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      parentId,
      attachments,
      direction: 'outbound',
      createdAt: new Date(),
    });

    // Save the message
    const savedMessage = await this.messageRepository.save(message);

    // Update conversation with last message timestamp
    await this.conversationRepository.updateLastMessageAt(conversationId, new Date());

    // If it's a reply, increment the reply count on the parent message
    if (parentId) {
      const parentMessage = await this.messageRepository.findById(parentId);
      if (parentMessage) {
        const updatedParent = parentMessage.addReply();
        await this.messageRepository.update(updatedParent);
      }
    }

    return savedMessage;
  }

  /**
   * Edit a message
   */
  async editMessage(userId: string, messageId: string, newContent: MessageContent): Promise<Message> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Verify that the user owns the message
    if (message.userId !== userId) {
      throw new Error('User does not own this message');
    }

    // Check if the message can be edited (within time window)
    if (!message.canBeEdited()) {
      throw new Error('Message edit window has expired');
    }

    // Update the message content
    const updatedMessage = message.updateContent(newContent);
    return await this.messageRepository.update(updatedMessage);
  }

  /**
   * Delete a message
   */
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Verify that the user owns the message
    if (message.userId !== userId) {
      throw new Error('User does not own this message');
    }

    // Soft delete the message
    const deletedMessage = message.softDelete();
    await this.messageRepository.update(deletedMessage);
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(userId: string, messageId: string, emoji: string): Promise<Message> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Create a reaction
    const reaction = new Reaction({
      id: `reaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      emoji,
      messageId,
      createdAt: new Date(),
    });

    // Add the reaction to the message
    const updatedMessage = message.addReaction(reaction);
    return await this.messageRepository.update(updatedMessage);
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(userId: string, messageId: string, emoji: string): Promise<Message> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Remove the reaction from the message
    const updatedMessage = message.removeReaction(userId, emoji);
    return await this.messageRepository.update(updatedMessage);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId: string, conversationId: string, messageIds: string[]): Promise<void> {
    // Verify that user is participating in the conversation
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || !conversation.isParticipant(userId)) {
      throw new Error(`User ${userId} is not a participant in conversation ${conversationId}`);
    }

    // Mark messages as read
    await this.messageRepository.markAsReadForUser(userId, conversationId, messageIds);

    // Update conversation unread count
    await this.conversationRepository.updateUnreadCount(conversationId, 0);
  }

  /**
   * Mark all messages in conversation as read
   */
  async markAllMessagesAsRead(userId: string, conversationId: string): Promise<void> {
    // Verify that user is participating in the conversation
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || !conversation.isParticipant(userId)) {
      throw new Error(`User ${userId} is not a participant in conversation ${conversationId}`);
    }

    // Mark all messages as read for the user
    await this.messageRepository.markAllAsReadForUser(userId, conversationId);

    // Update conversation unread count
    await this.conversationRepository.updateUnreadCount(conversationId, 0);
  }

  /**
   * Search messages in a conversation
   */
  async searchMessagesInConversation(
    conversationId: string,
    searchTerm: string
  ): Promise<Message[]> {
    // Find messages in the conversation that match the search term
    // In a real implementation, this might use a search service like Elasticsearch
    return await this.messageRepository.searchByContent(searchTerm);
  }

  /**
   * Get conversation history with pagination
   */
  async getConversationHistory(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: Message[]; total: number }> {
    // Verify that user is participating in the conversation
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || !conversation.isParticipant(userId)) {
      throw new Error(`User ${userId} is not a participant in conversation ${conversationId}`);
    }

    // Get messages for the conversation
    const messages = await this.messageRepository.findByConversationId(conversationId, limit, offset);
    const total = await this.messageRepository.countByConversationId(conversationId);

    return { messages, total };
  }
}