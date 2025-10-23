import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AdvancedSearchKnowledgeManagementService } from '@services/AdvancedSearchKnowledgeManagementService';

const advancedSearchKnowledgeManagementService = new AdvancedSearchKnowledgeManagementService();

export const performSearch = asyncHandler(async (req: Request, res: Response) => {
  const { text, filters, sort, limit, offset } = req.query;

  try {
    const results = await advancedSearchKnowledgeManagementService.performSearch(req.userId!, {
      text: text as string,
      filters: filters ? JSON.parse(filters as string) : undefined,
      sort: sort ? JSON.parse(sort as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.status(200).json({
      success: true,
      data: { results },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search',
      code: 'SEARCH_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createKnowledgeArticle = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, tags, category, sourceConversationId, sourceMessageId, isPinned, isPublic, metadata } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: 'Title and content are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const article = await advancedSearchKnowledgeManagementService.createKnowledgeArticle(req.userId!, {
      title,
      content,
      tags: tags || [],
      category,
      sourceConversationId,
      sourceMessageId,
      isPinned: isPinned || false,
      isPublic: isPublic || false,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      data: { article },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating knowledge article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create knowledge article',
      code: 'CREATE_ARTICLE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createArticleFromMessage = asyncHandler(async (req: Request, res: Response) => {
  const { messageId, title, tags, category } = req.body;

  if (!messageId || !title) {
    return res.status(400).json({
      success: false,
      error: 'Message ID and title are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const article = await advancedSearchKnowledgeManagementService.createArticleFromMessage(
      req.userId!,
      messageId,
      title,
      tags,
      category
    );

    res.status(201).json({
      success: true,
      data: { article },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating article from message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create article from message',
      code: 'CREATE_ARTICLE_FROM_MESSAGE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getKnowledgeArticles = asyncHandler(async (req: Request, res: Response) => {
  const { tags, category, isPinned, searchTerm, sortBy, sortOrder, limit, offset } = req.query;

  try {
    const articles = await advancedSearchKnowledgeManagementService.getKnowledgeArticles(req.userId!, {
      tags: tags ? (Array.isArray(tags) ? tags : [tags]).map(t => t.toString()) : undefined,
      category: category as string,
      isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
      searchTerm: searchTerm as string,
      sortBy: sortBy as 'date' | 'title' | 'relevance',
      sortOrder: sortOrder as 'asc' | 'desc',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.status(200).json({
      success: true,
      data: { articles },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting knowledge articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge articles',
      code: 'GET_ARTICLES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const upsertKnowledgeTopic = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, articleIds, relatedTopics } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Topic name is required',
      code: 'MISSING_TOPIC_NAME',
      timestamp: new Date(),
    });
  }

  try {
    const topic = await advancedSearchKnowledgeManagementService.upsertKnowledgeTopic(req.userId!, {
      name,
      description,
      articleIds: articleIds || [],
      relatedTopics: relatedTopics || []
    });

    res.status(200).json({
      success: true,
      data: { topic },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error upserting knowledge topic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upsert knowledge topic',
      code: 'UPSERT_TOPIC_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getKnowledgeTopics = asyncHandler(async (req: Request, res: Response) => {
  const { searchTerm } = req.query;

  try {
    const topics = await advancedSearchKnowledgeManagementService.getKnowledgeTopics(
      req.userId!,
      searchTerm as string
    );

    res.status(200).json({
      success: true,
      data: { topics },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting knowledge topics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge topics',
      code: 'GET_TOPICS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateKnowledgeInsights = asyncHandler(async (req: Request, res: Response) => {
  try {
    const insights = await advancedSearchKnowledgeManagementService.generateKnowledgeInsights(req.userId!);

    res.status(200).json({
      success: true,
      data: { insights },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating knowledge insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate knowledge insights',
      code: 'GENERATE_INSIGHTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const annotateMessage = asyncHandler(async (req: Request, res: Response) => {
  const { messageId, annotation, tags, isImportant, relatedArticleIds } = req.body;

  if (!messageId || !annotation) {
    return res.status(400).json({
      success: false,
      error: 'Message ID and annotation are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const annotationRecord = await advancedSearchKnowledgeManagementService.annotateMessage(
      req.userId!,
      messageId,
      annotation,
      tags,
      isImportant,
      relatedArticleIds
    );

    res.status(201).json({
      success: true,
      data: { annotation: annotationRecord },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error annotating message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to annotate message',
      code: 'ANNOTATE_MESSAGE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getMessageAnnotations = asyncHandler(async (req: Request, res: Response) => {
  const { messageId } = req.params;

  if (!messageId) {
    return res.status(400).json({
      success: false,
      error: 'Message ID is required',
      code: 'MISSING_MESSAGE_ID',
      timestamp: new Date(),
    });
  }

  try {
    const annotations = await advancedSearchKnowledgeManagementService.getMessageAnnotations(messageId, req.userId!);

    res.status(200).json({
      success: true,
      data: { annotations },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting message annotations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get message annotations',
      code: 'GET_ANNOTATIONS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateTags = asyncHandler(async (req: Request, res: Response) => {
  const { content, context } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      error: 'Content is required',
      code: 'MISSING_CONTENT',
      timestamp: new Date(),
    });
  }

  try {
    const tags = await advancedSearchKnowledgeManagementService.generateTags(content, context);

    res.status(200).json({
      success: true,
      data: { tags },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate tags',
      code: 'GENERATE_TAGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createConversationSummary = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, maxLength } = req.body;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID is required',
      code: 'MISSING_CONVERSATION_ID',
      timestamp: new Date(),
    });
  }

  try {
    const summary = await advancedSearchKnowledgeManagementService.createConversationSummary(
      req.userId!,
      conversationId,
      maxLength
    );

    res.status(200).json({
      success: true,
      data: { summary },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating conversation summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation summary',
      code: 'CREATE_SUMMARY_ERROR',
      timestamp: new Date(),
    });
  }
});

export const findRelatedContent = asyncHandler(async (req: Request, res: Response) => {
  const { content, type, limit } = req.body;

  if (!content || !type) {
    return res.status(400).json({
      success: false,
      error: 'Content and type are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const results = await advancedSearchKnowledgeManagementService.findRelatedContent(
      req.userId!,
      content,
      type as 'messages' | 'articles' | 'conversations',
      limit ? parseInt(limit as string) : 5
    );

    res.status(200).json({
      success: true,
      data: { results },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error finding related content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find related content',
      code: 'FIND_RELATED_CONTENT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateKnowledgeArticle = asyncHandler(async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const updates = req.body;

  if (!articleId) {
    return res.status(400).json({
      success: false,
      error: 'Article ID is required',
      code: 'MISSING_ARTICLE_ID',
      timestamp: new Date(),
    });
  }

  try {
    const article = await advancedSearchKnowledgeManagementService.updateKnowledgeArticle(articleId, req.userId!, updates);

    res.status(200).json({
      success: true,
      data: { article },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating knowledge article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update knowledge article',
      code: 'UPDATE_ARTICLE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const deleteKnowledgeArticle = asyncHandler(async (req: Request, res: Response) => {
  const { articleId } = req.params;

  if (!articleId) {
    return res.status(400).json({
      success: false,
      error: 'Article ID is required',
      code: 'MISSING_ARTICLE_ID',
      timestamp: new Date(),
    });
  }

  try {
    await advancedSearchKnowledgeManagementService.deleteKnowledgeArticle(articleId, req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Knowledge article deleted successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error deleting knowledge article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete knowledge article',
      code: 'DELETE_ARTICLE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const semanticSearch = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query is required',
      code: 'MISSING_QUERY',
      timestamp: new Date(),
    });
  }

  try {
    const results = await advancedSearchKnowledgeManagementService.semanticSearch(req.userId!, query);

    res.status(200).json({
      success: true,
      data: { results },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error performing semantic search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform semantic search',
      code: 'SEMANTIC_SEARCH_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query is required',
      code: 'MISSING_QUERY',
      timestamp: new Date(),
    });
  }

  try {
    const suggestions = await advancedSearchKnowledgeManagementService.getSearchSuggestions(req.userId!, query as string);

    res.status(200).json({
      success: true,
      data: { suggestions },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search suggestions',
      code: 'GET_SEARCH_SUGGESTIONS_ERROR',
      timestamp: new Date(),
    });
  }
});