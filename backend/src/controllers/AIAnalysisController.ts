/**
 * AIAnalysisController
 * HTTP controllers for AI analysis features including sentiment analysis,
 * message categorization, reply suggestions, and semantic search.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import diConfig from '@infrastructure/config/DependencyInjectionConfig';
import {
  AnalyzeSentimentInput,
} from '@application/use_cases/AnalyzeSentimentUseCase';
import {
  CategorizeMessageInput,
} from '@application/use_cases/CategorizeMessageUseCase';
import {
  GenerateReplySuggestionsInput,
} from '@application/use_cases/GenerateReplySuggestionsUseCase';
import {
  SemanticSearchInput,
} from '@application/use_cases/SemanticSearchUseCase';

/**
 * POST /api/ai/analyze-sentiment
 * Analyze the sentiment of a message
 */
export const analyzeSentiment = asyncHandler(
  async (req: Request, res: Response) => {
    const analyzeSentimentUseCase = diConfig.getAnalyzeSentimentUseCase();

    const input: AnalyzeSentimentInput = {
      messageId: req.body.messageId,
      content: req.body.content,
      conversationContext: req.body.conversationContext,
      userId: req.userId!,
    };

    const result = await analyzeSentimentUseCase.execute(input);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  },
);

/**
 * POST /api/ai/categorize-message
 * Automatically categorize a message by type, urgency, and topic
 */
export const categorizeMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const categorizeMessageUseCase = diConfig.getCategorizeMessageUseCase();

    const input: CategorizeMessageInput = {
      messageId: req.body.messageId,
      content: req.body.content,
      conversationContext: req.body.conversationContext,
      userId: req.userId!,
      existingCategories: req.body.existingCategories,
    };

    const result = await categorizeMessageUseCase.execute(input);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  },
);

/**
 * POST /api/ai/reply-suggestions
 * Generate AI-powered reply suggestions based on conversation context
 */
export const generateReplySuggestions = asyncHandler(
  async (req: Request, res: Response) => {
    const generateReplySuggestionsUseCase =
      diConfig.getGenerateReplySuggestionsUseCase();

    const input: GenerateReplySuggestionsInput = {
      messageId: req.body.messageId,
      conversationId: req.body.conversationId,
      content: req.body.content,
      userId: req.userId!,
      conversationHistory: req.body.conversationHistory,
      tone: req.body.tone,
      conversationContext: req.body.conversationContext,
    };

    const result = await generateReplySuggestionsUseCase.execute(input);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  },
);

/**
 * POST /api/ai/search
 * Perform semantic search across messages using AI
 */
export const semanticSearch = asyncHandler(
  async (req: Request, res: Response) => {
    const semanticSearchUseCase = diConfig.getSemanticSearchUseCase();

    const input: SemanticSearchInput = {
      query: req.body.query,
      userId: req.userId!,
      conversationIds: req.body.conversationIds,
      limit: req.body.limit,
    };

    const result = await semanticSearchUseCase.execute(input);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  },
);

/**
 * GET /api/ai/health
 * Check if AI service is available
 */
export const checkAIServiceHealth = asyncHandler(
  async (req: Request, res: Response) => {
    const aiService = diConfig.getAIAnalysisPort();
    const isHealthy = await aiService.isHealthy();

    res.status(200).json({
      success: true,
      data: {
        healthy: isHealthy,
        message: isHealthy
          ? 'AI service is available'
          : 'AI service is unavailable',
      },
      timestamp: new Date(),
    });
  },
);

/**
 * GET /api/ai/usage
 * Get AI service usage metrics and cost tracking
 */
export const getAIUsageMetrics = asyncHandler(
  async (req: Request, res: Response) => {
    const aiService = diConfig.getAIAnalysisPort();
    const metrics = await aiService.getUsageMetrics();

    res.status(200).json({
      success: true,
      data: {
        ...metrics,
        message: 'AI service usage metrics',
      },
      timestamp: new Date(),
    });
  },
);
