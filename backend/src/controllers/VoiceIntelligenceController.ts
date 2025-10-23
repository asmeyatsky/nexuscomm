import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { EnhancedVoiceIntelligenceService } from '@services/EnhancedVoiceIntelligenceService';

const enhancedVoiceIntelligenceService = new EnhancedVoiceIntelligenceService();

export const processVoiceInput = asyncHandler(async (req: Request, res: Response) => {
  // Note: In a real implementation, this would handle file uploads
  // For now, we'll simulate processing with text instead of audio
  const { audioData, language, analyzeEmotion } = req.body;

  if (!audioData) {
    return res.status(400).json({
      success: false,
      error: 'Audio data is required',
      code: 'MISSING_AUDIO_DATA',
      timestamp: new Date(),
    });
  }

  try {
    // In a real implementation, audioData would be a binary buffer
    // For simulation, we'll treat it as text
    const result = await enhancedVoiceIntelligenceService.processVoiceInput(
      Buffer.from(audioData),
      { 
        language: language || 'en',
        analyzeEmotion: analyzeEmotion !== false // default to true
      }
    );

    res.status(200).json({
      success: true,
      data: { result },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error processing voice input:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice input',
      code: 'VOICE_INPUT_PROCESSING_ERROR',
      timestamp: new Date(),
    });
  }
});

export const analyzeVoiceText = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Text is required',
      code: 'MISSING_TEXT',
      timestamp: new Date(),
    });
  }

  try {
    const analysis = await enhancedVoiceIntelligenceService.analyzeVoiceText(text);

    res.status(200).json({
      success: true,
      data: { analysis },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error analyzing voice text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze voice text',
      code: 'VOICE_TEXT_ANALYSIS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getEmotionAppropriateResponses = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, detectedEmotion, sentiment } = req.body;

  if (!conversationId || !detectedEmotion) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID and detected emotion are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const responses = await enhancedVoiceIntelligenceService.getEmotionAppropriateResponses(
      conversationId,
      detectedEmotion,
      sentiment as 'positive' | 'neutral' | 'negative' || 'neutral'
    );

    res.status(200).json({
      success: true,
      data: { responses },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting emotion-appropriate responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get emotion-appropriate responses',
      code: 'EMOTION_RESPONSES_ERROR',
      timestamp: new Date(),
    });
  }
});