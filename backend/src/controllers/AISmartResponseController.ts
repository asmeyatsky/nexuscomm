import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AISmartResponseService } from '@services/AISmartResponseService';

const aiSmartResponseService = new AISmartResponseService();

export const getSmartResponses = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, previousMessage } = req.query;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID is required',
      code: 'MISSING_CONVERSATION_ID',
      timestamp: new Date(),
    });
  }

  try {
    const suggestions = await aiSmartResponseService.generateSmartResponses(
      conversationId as string,
      previousMessage ? previousMessage as string : undefined
    );

    res.status(200).json({
      success: true,
      data: { suggestions },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating smart responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate smart responses',
      code: 'SMART_RESPONSES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const analyzeMessageTone = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      error: 'Content is required',
      code: 'MISSING_CONTENT',
      timestamp: new Date(),
    });
  }

  try {
    const analysis = await aiSmartResponseService.analyzeMessageTone(content);

    res.status(200).json({
      success: true,
      data: { analysis },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error analyzing message tone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze message tone',
      code: 'TONE_ANALYSIS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateDraftResponse = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, userInput } = req.body;

  if (!conversationId || !userInput) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID and user input are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const draft = await aiSmartResponseService.generateDraftResponse(conversationId, userInput);

    res.status(200).json({
      success: true,
      data: { draft },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating draft response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate draft response',
      code: 'DRAFT_RESPONSE_ERROR',
      timestamp: new Date(),
    });
  }
});