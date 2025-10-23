import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { Contact } from '@models/Contact';
import { User } from '@models/User';
import { AppError } from '@middleware/errorHandler';
import { SearchService } from './SearchService'; // Assuming a search service exists

// Define search and knowledge management interfaces
export interface SearchQuery {
  text?: string;
  filters?: {
    channelTypes?: string[];
    participantIds?: string[];
    dateRange?: { start: Date; end: Date };
    hasMedia?: boolean;
    unread?: boolean;
    tags?: string[];
  };
  sort?: {
    field: 'date' | 'relevance' | 'sender';
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  messages: Array<{
    id: string;
    conversationId: string;
    content: string;
    senderName: string;
    channelType: string;
    timestamp: Date;
    relevanceScore: number;
    mediaUrls?: string[];
    tags?: string[];
  }>;
  contacts: Array<{
    id: string;
    name: string;
    relevanceScore: number;
  }>;
  conversations: Array<{
    id: string;
    title: string;
    participantNames: string[];
    lastMessage: string;
    relevanceScore: number;
  }>;
  totalResults: number;
  queryTimeMs: number;
}

export interface KnowledgeArticle {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  sourceConversationId?: string;
  sourceMessageId?: string;
  isPinned: boolean;
  isPublic: boolean; // If user wants to share with team
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeTopic {
  id: string;
  userId: string;
  name: string;
  description?: string;
  articleIds: string[];
  relatedTopics: string[];
  isSystemGenerated: boolean; // If topic was auto-generated from content
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeInsight {
  userId: string;
  topics: Array<{
    name: string;
    count: number;
    growthTrend: 'increasing' | 'decreasing' | 'stable';
  }>;
  mostReferencedContacts: Array<{
    id: string;
    name: string;
    referenceCount: number;
  }>;
  conversationThreading: Array<{
    conversationId: string;
    threadTitle: string;
    relatedArticles: string[];
  }>;
  knowledgeGaps: string[]; // Topics that are frequently discussed but lack articles
  createdAt: Date;
}

export interface MessageAnnotation {
  id: string;
  userId: string;
  messageId: string;
  conversationId: string;
  annotation: string; // User's note about the message
  tags: string[];
  isImportant: boolean;
  relatedArticleIds: string[]; // Links to knowledge articles
  createdAt: Date;
  updatedAt: Date;
}

export class AdvancedSearchKnowledgeManagementService {
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);
  private contactRepository = AppDataSource.getRepository(Contact);
  private userRepository = AppDataSource.getRepository(User);

  constructor() {
    // Initialize search and knowledge management service
  }

  /**
   * Perform an advanced search across all communications
   */
  async performSearch(userId: string, query: SearchQuery): Promise<SearchResults> {
    const startTime = Date.now();
    
    // Search messages
    const messages = await this.searchMessages(userId, query);
    
    // Search contacts
    const contacts = await this.searchContacts(userId, query);
    
    // Search conversations
    const conversations = await this.searchConversations(userId, query);
    
    const totalResults = messages.length + contacts.length + conversations.length;
    const queryTimeMs = Date.now() - startTime;

    return {
      messages,
      contacts,
      conversations,
      totalResults,
      queryTimeMs
    };
  }

  /**
   * Search for messages
   */
  private async searchMessages(userId: string, query: SearchQuery): Promise<SearchResults['messages']> {
    const searchTerms = query.text?.toLowerCase().split(/\s+/) || [];
    
    // Build query for messages
    let messageQuery = this.messageRepository
      .createQueryBuilder('message')
      .where('message.userId = :userId', { userId })
      .orderBy('message.createdAt', query.sort?.direction === 'asc' ? 'ASC' : 'DESC');

    // Apply filters
    if (query.filters?.channelTypes && query.filters.channelTypes.length > 0) {
      messageQuery = messageQuery.andWhere('message.channelType IN (:...channelTypes)', { 
        channelTypes: query.filters.channelTypes 
      });
    }

    if (query.filters?.dateRange) {
      messageQuery = messageQuery
        .andWhere('message.createdAt BETWEEN :start AND :end', {
          start: query.filters.dateRange.start,
          end: query.filters.dateRange.end
        });
    }

    if (query.filters?.participantIds && query.filters.participantIds.length > 0) {
      // This would need to be adapted based on how participants are stored in messages
      // For now, we'll search in content for sender names
      messageQuery = messageQuery.andWhere('message.senderName IN (:...participantIds)', {
        participantIds: query.filters.participantIds
      });
    }

    if (query.filters?.hasMedia) {
      messageQuery = messageQuery.andWhere('message.mediaUrls IS NOT NULL AND array_length(message.mediaUrls, 1) > 0');
    }

    if (searchTerms.length > 0) {
      let searchCondition = '';
      const searchParameters: any = {};
      
      searchTerms.forEach((term, index) => {
        searchCondition += index > 0 ? ' OR ' : '';
        searchCondition += `LOWER(message.content) LIKE :term${index}`;
        searchParameters[`term${index}`] = `%${term}%`;
      });
      
      messageQuery = messageQuery.andWhere(searchCondition, searchParameters);
    }

    if (query.limit) {
      messageQuery = messageQuery.limit(query.limit);
    }
    
    if (query.offset) {
      messageQuery = messageQuery.offset(query.offset);
    }

    const dbMessages = await messageQuery.getMany();

    // Calculate relevance scores
    return dbMessages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      senderName: msg.senderName,
      channelType: msg.channelType,
      timestamp: msg.createdAt,
      relevanceScore: this.calculateRelevanceScore(msg.content, searchTerms),
      mediaUrls: msg.mediaUrls.length > 0 ? msg.mediaUrls : undefined
    }));
  }

  /**
   * Search for contacts
   */
  private async searchContacts(userId: string, query: SearchQuery): Promise<SearchResults['contacts']> {
    if (!query.text) return [];

    const searchTerms = query.text.toLowerCase().split(/\s+/);
    
    let contactQuery = this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.userId = :userId', { userId });

    let searchCondition = '';
    const searchParameters: any = {};
    
    searchTerms.forEach((term, index) => {
      searchCondition += index > 0 ? ' OR ' : '';
      searchCondition += `LOWER(contact.name) LIKE :term${index}`;
      searchParameters[`term${index}`] = `%${term}%`;
    });
    
    contactQuery = contactQuery.andWhere(searchCondition, searchParameters);

    const dbContacts = await contactQuery.getMany();

    return dbContacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      relevanceScore: this.calculateRelevanceScore(contact.name, searchTerms)
    }));
  }

  /**
   * Search for conversations
   */
  private async searchConversations(userId: string, query: SearchQuery): Promise<SearchResults['conversations']> {
    if (!query.text) return [];

    const searchTerms = query.text.toLowerCase().split(/\s+/);
    
    let convQuery = this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.userId = :userId', { userId });

    let searchCondition = '';
    const searchParameters: any = {};
    
    searchTerms.forEach((term, index) => {
      searchCondition += index > 0 ? ' OR ' : '';
      
      if (index === 0) {
        searchCondition += '(';
      }
      
      searchCondition += `LOWER(conversation.lastMessage) LIKE :term${index}`;
      searchParameters[`term${index}`] = `%${term}%`;
      
      if (index === searchTerms.length - 1) {
        searchCondition += ')';
      } else {
        searchCondition += ' OR ';
      }
    });
    
    convQuery = convQuery.andWhere(searchCondition, searchParameters);

    const dbConversations = await convQuery.getMany();

    return dbConversations.map(conv => ({
      id: conv.id,
      title: conv.participantNames.join(', '),
      participantNames: conv.participantNames,
      lastMessage: conv.lastMessage || '',
      relevanceScore: this.calculateRelevanceScore(conv.lastMessage || '', searchTerms)
    }));
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(content: string, searchTerms: string[]): number {
    if (!content || searchTerms.length === 0) return 0;

    const lowerContent = content.toLowerCase();
    let score = 0;

    for (const term of searchTerms) {
      if (lowerContent.includes(term)) {
        // Boost score for each matching term
        score += 10;
        
        // Additional boost if term appears at the beginning
        if (lowerContent.indexOf(term) < 20) {
          score += 5;
        }
      }
    }

    // Normalize score (0-100)
    return Math.min(100, score);
  }

  /**
   * Create a knowledge article from a conversation
   */
  async createKnowledgeArticle(
    userId: string,
    articleData: Omit<KnowledgeArticle, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'metadata'>
  ): Promise<KnowledgeArticle> {
    const article: KnowledgeArticle = {
      id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...articleData,
      metadata: articleData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created knowledge article:', article);

    return article;
  }

  /**
   * Create a knowledge article from a specific message
   */
  async createArticleFromMessage(
    userId: string,
    messageId: string,
    title: string,
    tags?: string[],
    category?: string
  ): Promise<KnowledgeArticle> {
    // Get the message to include its content
    const message = await this.messageRepository.findOne({
      where: { id: messageId, userId }
    });

    if (!message) {
      throw new AppError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
    }

    const article: KnowledgeArticle = {
      id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      content: message.content,
      tags: tags || [],
      category,
      sourceConversationId: message.conversationId,
      sourceMessageId: messageId,
      isPinned: false,
      isPublic: false,
      metadata: {
        originalChannel: message.channelType,
        originalSenderId: message.senderExternalId
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created knowledge article from message:', article);

    return article;
  }

  /**
   * Get knowledge articles with filtering
   */
  async getKnowledgeArticles(
    userId: string,
    filters?: {
      tags?: string[];
      category?: string;
      isPinned?: boolean;
      searchTerm?: string;
      sortBy?: 'date' | 'title' | 'relevance';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<KnowledgeArticle[]> {
    // In a real implementation, this would query the knowledge articles table
    // For now, return mock articles
    return [
      {
        id: `article-${Date.now()}-1`,
        userId,
        title: 'Project Requirements Summary',
        content: 'Summary of requirements for the new project discussed with the client',
        tags: ['project', 'requirements', 'client'],
        category: 'business',
        isPinned: true,
        isPublic: false,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Create or update a knowledge topic
   */
  async upsertKnowledgeTopic(
    userId: string,
    topicData: Omit<KnowledgeTopic, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isSystemGenerated'>
  ): Promise<KnowledgeTopic> {
    // Check if topic already exists
    const existingTopic = await this.conversationRepository.query(
      'SELECT * FROM knowledge_topics WHERE user_id = $1 AND name = $2 LIMIT 1',
      [userId, topicData.name]
    );

    let topic: KnowledgeTopic;
    if (existingTopic) {
      // Update existing topic
      topic = {
        ...existingTopic,
        userId,
        ...topicData,
        updatedAt: new Date()
      } as KnowledgeTopic;
    } else {
      // Create new topic
      topic = {
        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ...topicData,
        isSystemGenerated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // In a real implementation, this would be saved to the database
    console.log('Upserted knowledge topic:', topic);

    return topic;
  }

  /**
   * Get knowledge topics
   */
  async getKnowledgeTopics(
    userId: string,
    searchTerm?: string
  ): Promise<KnowledgeTopic[]> {
    // In a real implementation, this would query the knowledge topics table
    // For now, return mock topics
    return [
      {
        id: `topic-${Date.now()}-1`,
        userId,
        name: 'Project Management',
        articleIds: ['article-1', 'article-2'],
        relatedTopics: [],
        isSystemGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Generate knowledge insights
   */
  async generateKnowledgeInsights(userId: string): Promise<KnowledgeInsight> {
    // In a real implementation, this would analyze user's conversations and articles
    // to generate insights about topics, contacts, and knowledge gaps
    // For now, return mock insights
    
    return {
      userId,
      topics: [
        { name: 'Project Planning', count: 24, growthTrend: 'increasing' },
        { name: 'Client Communications', count: 18, growthTrend: 'stable' },
        { name: 'Technical Issues', count: 12, growthTrend: 'decreasing' }
      ],
      mostReferencedContacts: [
        { id: 'contact-1', name: 'John Smith', referenceCount: 15 },
        { id: 'contact-2', name: 'Jane Doe', referenceCount: 12 },
        { id: 'contact-3', name: 'Bob Johnson', referenceCount: 8 }
      ],
      conversationThreading: [
        { conversationId: 'conv-1', threadTitle: 'Q3 Planning', relatedArticles: ['article-1'] }
      ],
      knowledgeGaps: [
        'Onboarding Process',
        'Security Protocols',
        'Vendor Management'
      ],
      createdAt: new Date()
    };
  }

  /**
   * Annotate a message with additional information
   */
  async annotateMessage(
    userId: string,
    messageId: string,
    annotation: string,
    tags?: string[],
    isImportant?: boolean,
    relatedArticleIds?: string[]
  ): Promise<MessageAnnotation> {
    const annotationRecord: MessageAnnotation = {
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      messageId,
      // In a real implementation, we'd need to get the conversationId from the message
      conversationId: 'conversation-id-placeholder',
      annotation,
      tags: tags || [],
      isImportant: isImportant || false,
      relatedArticleIds: relatedArticleIds || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Annotated message:', annotationRecord);

    return annotationRecord;
  }

  /**
   * Get annotations for a message
   */
  async getMessageAnnotations(messageId: string, userId: string): Promise<MessageAnnotation[]> {
    // In a real implementation, this would fetch from the database
    // For now, return mock annotations
    return [
      {
        id: `annotation-${Date.now()}-1`,
        userId,
        messageId,
        conversationId: 'conversation-id',
        annotation: 'Important client requirement mentioned here',
        tags: ['important', 'requirement', 'client'],
        isImportant: true,
        relatedArticleIds: ['article-1'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Auto-generate tags for content
   */
  async generateTags(content: string, context?: string): Promise<string[]> {
    // In a real implementation, this would use NLP to extract relevant tags
    // For now, return mock tags based on simple keyword matching
    
    const tags: string[] = [];
    
    // Extract common business tags
    if (['project', 'task', 'work', 'assignment'].some(word => content.toLowerCase().includes(word))) {
      tags.push('project');
    }
    
    if (['meeting', 'call', 'discussion', 'agenda'].some(word => content.toLowerCase().includes(word))) {
      tags.push('meeting');
    }
    
    if (['urgent', 'asap', 'important', 'critical'].some(word => content.toLowerCase().includes(word))) {
      tags.push('urgent');
    }
    
    // Add context-specific tags if provided
    if (context) {
      if (context.includes('client')) tags.push('client');
      if (context.includes('internal')) tags.push('internal');
    }
    
    // Limit to top 5 tags
    return tags.slice(0, 5);
  }

  /**
   * Create a summary of a conversation
   */
  async createConversationSummary(
    userId: string,
    conversationId: string,
    maxLength: number = 500
  ): Promise<{
    summary: string;
    keyPoints: string[];
    participants: string[];
    mainTopics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  }> {
    // In a real implementation, this would analyze all messages in the conversation
    // to create a comprehensive summary
    // For now, return mock data
    
    return {
      summary: 'This conversation covered project requirements and timeline adjustments. Key stakeholders agreed on the revised approach and next steps.',
      keyPoints: [
        'Revised project timeline discussed',
        'Budget approval pending',
        'Next milestone: Design review'
      ],
      participants: ['John Smith', 'Jane Doe', 'Bob Johnson'],
      mainTopics: ['Project Timeline', 'Budget', 'Design Review'],
      sentiment: 'positive'
    };
  }

  /**
   * Find related content
   */
  async findRelatedContent(
    userId: string,
    content: string,
    type: 'messages' | 'articles' | 'conversations',
    limit: number = 5
  ): Promise<SearchResults> {
    // In a real implementation, this would use semantic similarity or keyword matching
    // to find content related to the provided text
    // For now, return an empty result
    
    return {
      messages: [],
      contacts: [],
      conversations: [],
      totalResults: 0,
      queryTimeMs: 0
    };
  }

  /**
   * Update an existing knowledge article
   */
  async updateKnowledgeArticle(
    articleId: string,
    userId: string,
    updates: Partial<KnowledgeArticle>
  ): Promise<KnowledgeArticle> {
    // In a real implementation, this would update the database record
    // For now, return mock updated article
    
    return {
      id: articleId,
      userId,
      title: 'Updated Project Requirements Summary',
      content: 'Updated summary of requirements for the new project discussed with the client',
      tags: ['project', 'requirements', 'client', 'updated'],
      category: 'business',
      isPinned: true,
      isPublic: false,
      metadata: {},
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date()
    };
  }

  /**
   * Delete a knowledge article
   */
  async deleteKnowledgeArticle(articleId: string, userId: string): Promise<void> {
    // In a real implementation, this would delete from the database
    console.log(`Deleting knowledge article ${articleId} for user ${userId}`);
  }

  /**
   * Search with AI-powered semantic understanding
   */
  async semanticSearch(userId: string, query: string): Promise<SearchResults> {
    // In a real implementation, this would use vector embeddings and semantic similarity
    // to find content that matches the meaning of the query, not just exact keywords
    // For now, fall back to regular search
    
    return this.performSearch(userId, { text: query });
  }

  /**
   * Get search suggestions as user types
   */
  async getSearchSuggestions(userId: string, partialQuery: string): Promise<string[]> {
    // In a real implementation, this would analyze user's search history and content
    // to suggest relevant searches
    // For now, return mock suggestions
    
    if (partialQuery.toLowerCase().includes('proj')) {
      return [
        'project status',
        'project timeline',
        'project requirements',
        'project budget'
      ];
    }
    
    return [
      'Important meetings',
      'Client communications',
      'Project updates',
      'Action items'
    ];
  }
}