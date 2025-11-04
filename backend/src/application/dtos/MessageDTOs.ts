/**
 * CreateMessageDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data between presentation and application layers
 * - Provides a contract for message creation requests
 * - Transforms between external representation and domain representation
 * - Enables validation at the application boundary
 * 
 * Key Design Decisions:
 * 1. Plain data structure for external communication
 * 2. Input validation at the application boundary
 * 3. Clear separation from domain entities
 * 4. Serializable for transport between layers
 */
export interface CreateMessageDTO {
  conversationId: string;
  userId: string;
  content: string;
  html?: string;
  entities?: Array<{
    type: 'mention' | 'hashtag' | 'code' | 'link';
    offset: number;
    length: number;
    data?: any;
  }>;
  attachments?: Array<{
    id?: string;
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    thumbnailUrl?: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
  parentId?: string;
  channelType?: string;
}

/**
 * UpdateMessageDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for message updates between presentation and application layers
 * - Provides a contract for message update requests
 * - Transforms between external representation and domain representation
 * - Enables validation at the application boundary
 */
export interface UpdateMessageDTO {
  messageId: string;
  userId: string;
  content: string;
  html?: string;
  entities?: Array<{
    type: 'mention' | 'hashtag' | 'code' | 'link';
    offset: number;
    length: number;
    data?: any;
  }>;
}

/**
 * DeleteMessageDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for message deletion requests between presentation and application layers
 * - Provides a contract for message deletion operations
 * - Transforms between external representation and domain representation
 */
export interface DeleteMessageDTO {
  messageId: string;
  userId: string;
}

/**
 * AddReactionDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for adding reactions between presentation and application layers
 * - Provides a contract for reaction operations
 * - Transforms between external representation and domain representation
 */
export interface AddReactionDTO {
  messageId: string;
  userId: string;
  emoji: string;
}

/**
 * RemoveReactionDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for removing reactions between presentation and application layers
 * - Provides a contract for reaction removal operations
 * - Transforms between external representation and domain representation
 */
export interface RemoveReactionDTO {
  messageId: string;
  userId: string;
  emoji: string;
}

/**
 * MarkMessagesAsReadDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for marking messages as read between presentation and application layers
 * - Provides a contract for read status operations
 * - Transforms between external representation and domain representation
 */
export interface MarkMessagesAsReadDTO {
  userId: string;
  conversationId: string;
  messageIds: string[];
}

/**
 * GetMessageHistoryDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for retrieving message history between presentation and application layers
 * - Provides a contract for message history retrieval
 * - Transforms between external representation and domain representation
 */
export interface GetMessageHistoryDTO {
  conversationId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

/**
 * SearchMessageDTO - Data Transfer Object
 * 
 * Architectural Intent:
 * - Transfers data for searching messages between presentation and application layers
 * - Provides a contract for message search operations
 * - Transforms between external representation and domain representation
 */
export interface SearchMessageDTO {
  conversationId: string;
  searchTerm: string;
  userId: string;
  limit?: number;
  offset?: number;
}