import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { RichMediaIntelligenceService } from '@services/RichMediaIntelligenceService';

const richMediaIntelligenceService = new RichMediaIntelligenceService();

export const getMediaIntelligenceSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await richMediaIntelligenceService.getMediaIntelligenceSettings(req.userId!);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting media intelligence settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get media intelligence settings',
      code: 'GET_MEDIA_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateMediaIntelligenceSettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;

  try {
    const settings = await richMediaIntelligenceService.updateMediaIntelligenceSettings(
      req.userId!,
      updates
    );

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating media intelligence settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update media intelligence settings',
      code: 'UPDATE_MEDIA_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const processMediaFile = asyncHandler(async (req: Request, res: Response) => {
  const { fileUrl, targetPlatform, maxWidth, maxHeight, compressionQuality, generateThumbnail, runContentModeration, generateTags } = req.body;

  if (!fileUrl) {
    return res.status(400).json({
      success: false,
      error: 'File URL is required',
      code: 'MISSING_FILE_URL',
      timestamp: new Date(),
    });
  }

  try {
    const processedMedia = await richMediaIntelligenceService.processMediaFile(req.userId!, fileUrl, {
      targetPlatform,
      maxWidth,
      maxHeight,
      compressionQuality,
      generateThumbnail,
      runContentModeration,
      generateTags
    });

    res.status(200).json({
      success: true,
      data: { processedMedia },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error processing media file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process media file',
      code: 'PROCESS_MEDIA_FILE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const optimizeMediaForPlatform = asyncHandler(async (req: Request, res: Response) => {
  const { mediaUrl, platform } = req.body;

  if (!mediaUrl || !platform) {
    return res.status(400).json({
      success: false,
      error: 'Media URL and platform are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const result = await richMediaIntelligenceService.optimizeMediaForPlatform(
      req.userId!,
      mediaUrl,
      platform
    );

    res.status(200).json({
      success: true,
      data: { result },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error optimizing media for platform:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize media for platform',
      code: 'OPTIMIZE_MEDIA_ERROR',
      timestamp: new Date(),
    });
  }
});

export const analyzeMediaContent = asyncHandler(async (req: Request, res: Response) => {
  const { mediaUrl, mediaType } = req.body;

  if (!mediaUrl || !mediaType) {
    return res.status(400).json({
      success: false,
      error: 'Media URL and media type are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const analysis = await richMediaIntelligenceService.analyzeMediaContent(
      req.userId!,
      mediaUrl,
      mediaType
    );

    res.status(200).json({
      success: true,
      data: { analysis },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error analyzing media content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze media content',
      code: 'ANALYZE_MEDIA_ERROR',
      timestamp: new Date(),
    });
  }
});

export const batchProcessMediaFiles = asyncHandler(async (req: Request, res: Response) => {
  const { fileUrls, targetPlatform, maxWidth, maxHeight, compressionQuality, generateThumbnail, runContentModeration, generateTags } = req.body;

  if (!fileUrls || !Array.isArray(fileUrls)) {
    return res.status(400).json({
      success: false,
      error: 'File URLs array is required',
      code: 'MISSING_FILE_URLS',
      timestamp: new Date(),
    });
  }

  try {
    const results = await richMediaIntelligenceService.batchProcessMediaFiles(req.userId!, fileUrls, {
      targetPlatform,
      maxWidth,
      maxHeight,
      compressionQuality,
      generateThumbnail,
      runContentModeration,
      generateTags
    });

    res.status(200).json({
      success: true,
      data: { results },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error batch processing media files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch process media files',
      code: 'BATCH_PROCESS_MEDIA_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getMediaIntelligenceInsights = asyncHandler(async (req: Request, res: Response) => {
  try {
    const insights = await richMediaIntelligenceService.getMediaIntelligenceInsights(req.userId!);

    res.status(200).json({
      success: true,
      data: { insights },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting media intelligence insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get media intelligence insights',
      code: 'GET_MEDIA_INSIGHTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const validateMediaForUser = asyncHandler(async (req: Request, res: Response) => {
  const { fileUrl, fileSize } = req.body;

  if (!fileUrl || fileSize === undefined) {
    return res.status(400).json({
      success: false,
      error: 'File URL and file size are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const validation = await richMediaIntelligenceService.validateMediaForUser(
      req.userId!,
      fileUrl,
      fileSize
    );

    res.status(200).json({
      success: true,
      data: { validation },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error validating media for user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate media for user',
      code: 'VALIDATE_MEDIA_ERROR',
      timestamp: new Date(),
    });
  }
});