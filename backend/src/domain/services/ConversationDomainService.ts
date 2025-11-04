import { Conversation } from '../value_objects/Conversation';
import { User } from '../value_objects/User';
import { ConversationRepositoryPort } from '../ports/ConversationRepositoryPort';
import { UserRepositoryPort } from '../ports/UserRepositoryPort';

/**
 * ConversationDomainService
 * 
 * Architectural Intent:
 * - Contains complex business logic related to conversation operations
 * - Orchestrates operations across multiple entities and repositories
 * - Encapsulates business rules that don't fit within a single entity
 * - Maintains invariants across the conversation domain
 * 
 * Key Design Decisions:
 * 1. Pure business logic without infrastructure concerns
 * 2. Uses domain repositories (ports) for data access
 * 3. Operates on domain entities and value objects
 * 4. Maintains transaction boundaries where appropriate
 */
export class ConversationDomainService {
  constructor(
    private conversationRepository: ConversationRepositoryPort,
    private userRepository: UserRepositoryPort
  ) {}

  /**
   * Create a new conversation
   */
  async createConversation(
    name: string | undefined,
    type: 'direct' | 'group' | 'channel',
    participantIds: string[],
    creatorId: string,
    metadata?: Record<string, any>
  ): Promise<Conversation> {
    // Validate that all participants exist
    const participants = await this.userRepository.findByIds(participantIds);
    if (participants.length !== participantIds.length) {
      throw new Error('One or more participants do not exist');
    }

    // Check if direct conversation already exists between two users
    if (type === 'direct' && participantIds.length === 2) {
      const existingConversations = await this.conversationRepository.findByParticipantIds(
        [creatorId, ...participantIds].filter(id => id !== creatorId)
      );
      
      // If a direct conversation already exists, return it
      const existingDirect = existingConversations.find(conv => 
        conv.type === 'direct' && 
        conv.participantIds.length === 2 &&
        conv.participantIds.includes(creatorId) &&
        conv.participantIds.includes(participantIds.find(id => id !== creatorId)!)
      );
      
      if (existingDirect) {
        return existingDirect;
      }
    }

    // Create the conversation entity
    const conversation = new Conversation({
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      participantIds,
      createdAt: new Date(),
      metadata,
    });

    // Save the conversation
    return await this.conversationRepository.save(conversation);
  }

  /**
   * Add a participant to a conversation
   */
  async addParticipantToConversation(conversationId: string, participantId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Check if user is already a participant
    if (conversation.isParticipant(participantId)) {
      return conversation;
    }

    // Validate that the user exists
    const user = await this.userRepository.findById(participantId);
    if (!user) {
      throw new Error(`User ${participantId} does not exist`);
    }

    // Update the conversation with the new participant
    const updatedConversation = conversation.addParticipant(participantId);
    return await this.conversationRepository.update(updatedConversation);
  }

  /**
   * Remove a participant from a conversation
   */
  async removeParticipantFromConversation(conversationId: string, participantId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Check if user is a participant
    if (!conversation.isParticipant(participantId)) {
      throw new Error(`User ${participantId} is not a participant in conversation ${conversationId}`);
    }

    // Cannot remove the last participant
    if (conversation.getParticipantCount() <= 1) {
      throw new Error(`Cannot remove the last participant from conversation ${conversationId}`);
    }

    // Update the conversation by removing the participant
    const updatedConversation = conversation.removeParticipant(participantId);
    return await this.conversationRepository.update(updatedConversation);
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const archivedConversation = conversation.archive();
    return await this.conversationRepository.update(archivedConversation);
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const unarchivedConversation = conversation.unarchive();
    return await this.conversationRepository.update(unarchivedConversation);
  }

  /**
   * Mute a conversation
   */
  async muteConversation(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Verify that the user is a participant
    if (!conversation.isParticipant(userId)) {
      throw new Error(`User ${userId} is not a participant in conversation ${conversationId}`);
    }

    const mutedConversation = conversation.mute();
    return await this.conversationRepository.update(mutedConversation);
  }

  /**
   * Unmute a conversation
   */
  async unmuteConversation(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Verify that the user is a participant
    if (!conversation.isParticipant(userId)) {
      throw new Error(`User ${userId} is not a participant in conversation ${conversationId}`);
    }

    const unmutedConversation = conversation.unmute();
    return await this.conversationRepository.update(unmutedConversation);
  }

  /**
   * Get all conversations for a user
   */
  async getAllConversationsForUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ conversations: Conversation[]; total: number }> {
    // Verify that user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} does not exist`);
    }

    const conversations = await this.conversationRepository.findAllForUser(userId, limit, offset);
    const total = await this.conversationRepository.countForUser(userId);

    return { conversations, total };
  }

  /**
   * Find unread conversations for a user
   */
  async getUnreadConversationsForUser(userId: string): Promise<Conversation[]> {
    // Verify that user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} does not exist`);
    }

    return await this.conversationRepository.findUnreadConversations(userId);
  }
}