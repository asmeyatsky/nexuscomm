import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AccessibilityEnhancementService } from '@services/AccessibilityEnhancementService';

const accessibilityEnhancementService = new AccessibilityEnhancementService();

export const getAccessibilitySettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await accessibilityEnhancementService.getAccessibilitySettings(req.userId!);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting accessibility settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get accessibility settings',
      code: 'GET_ACCESSIBILITY_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateAccessibilitySettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;

  try {
    const settings = await accessibilityEnhancementService.updateAccessibilitySettings(
      req.userId!,
      updates
    );

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating accessibility settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update accessibility settings',
      code: 'UPDATE_ACCESSIBILITY_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const processVoiceCommand = asyncHandler(async (req: Request, res: Response) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'Voice command is required',
      code: 'MISSING_COMMAND',
      timestamp: new Date(),
    });
  }

  try {
    const result = await accessibilityEnhancementService.processVoiceCommand(req.userId!, command);

    res.status(200).json({
      success: true,
      data: { result },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error processing voice command:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice command',
      code: 'PROCESS_VOICE_COMMAND_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateScreenReaderTextForMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message, includeMetadata } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message data is required',
      code: 'MISSING_MESSAGE_DATA',
      timestamp: new Date(),
    });
  }

  try {
    const text = accessibilityEnhancementService.generateScreenReaderTextForMessage(message, includeMetadata);

    res.status(200).json({
      success: true,
      data: { text },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating screen reader text for message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate screen reader text for message',
      code: 'GENERATE_SCREEN_READER_TEXT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateScreenReaderTextForConversation = asyncHandler(async (req: Request, res: Response) => {
  const { conversation, unreadCount } = req.body;

  if (!conversation) {
    return res.status(400).json({
      success: false,
      error: 'Conversation data is required',
      code: 'MISSING_CONVERSATION_DATA',
      timestamp: new Date(),
    });
  }

  try {
    const text = accessibilityEnhancementService.generateScreenReaderTextForConversation(conversation, unreadCount);

    res.status(200).json({
      success: true,
      data: { text },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating screen reader text for conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate screen reader text for conversation',
      code: 'GENERATE_CONVERSATION_TEXT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createVoiceCommand = asyncHandler(async (req: Request, res: Response) => {
  const { command, action, parameters } = req.body;

  if (!command || !action) {
    return res.status(400).json({
      success: false,
      error: 'Command and action are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const voiceCommand = await accessibilityEnhancementService.createVoiceCommand(req.userId!, {
      command,
      action,
      parameters: parameters || [],
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: { voiceCommand },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating voice command:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create voice command',
      code: 'CREATE_VOICE_COMMAND_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getUserVoiceCommands = asyncHandler(async (req: Request, res: Response) => {
  try {
    const commands = await accessibilityEnhancementService.getUserVoiceCommands(req.userId!);

    res.status(200).json({
      success: true,
      data: { commands },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting user voice commands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user voice commands',
      code: 'GET_VOICE_COMMANDS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createKeyboardShortcut = asyncHandler(async (req: Request, res: Response) => {
  const { action, keys, description } = req.body;

  if (!action || !keys || !Array.isArray(keys)) {
    return res.status(400).json({
      success: false,
      error: 'Action, keys array, and description are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const shortcut = await accessibilityEnhancementService.createKeyboardShortcut(req.userId!, {
      action,
      keys,
      description,
      isEnabled: true
    });

    res.status(201).json({
      success: true,
      data: { shortcut },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating keyboard shortcut:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create keyboard shortcut',
      code: 'CREATE_KEYBOARD_SHORTCUT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getUserKeyboardShortcuts = asyncHandler(async (req: Request, res: Response) => {
  try {
    const shortcuts = await accessibilityEnhancementService.getUserKeyboardShortcuts(req.userId!);

    res.status(200).json({
      success: true,
      data: { shortcuts },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting user keyboard shortcuts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user keyboard shortcuts',
      code: 'GET_KEYBOARD_SHORTCUTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const recordAccessibilityFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { feedbackType, category, description, severity } = req.body;

  if (!feedbackType || !category || !description) {
    return res.status(400).json({
      success: false,
      error: 'Feedback type, category, and description are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const feedback = await accessibilityEnhancementService.recordAccessibilityFeedback(req.userId!, {
      feedbackType,
      category,
      description,
      severity: severity || 'medium'
    });

    res.status(201).json({
      success: true,
      data: { feedback },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error recording accessibility feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record accessibility feedback',
      code: 'RECORD_ACCESSIBILITY_FEEDBACK_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getAccessibilityInsights = asyncHandler(async (req: Request, res: Response) => {
  try {
    const insights = await accessibilityEnhancementService.getAccessibilityInsights(req.userId!);

    res.status(200).json({
      success: true,
      data: { insights },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting accessibility insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get accessibility insights',
      code: 'GET_ACCESSIBILITY_INSIGHTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getMediaTextAlternative = asyncHandler(async (req: Request, res: Response) => {
  const { mediaUrl } = req.body;

  if (!mediaUrl) {
    return res.status(400).json({
      success: false,
      error: 'Media URL is required',
      code: 'MISSING_MEDIA_URL',
      timestamp: new Date(),
    });
  }

  try {
    const alternatives = await accessibilityEnhancementService.getMediaTextAlternative(req.userId!, mediaUrl);

    res.status(200).json({
      success: true,
      data: { alternatives },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting media text alternative:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get media text alternative',
      code: 'GET_MEDIA_ALT_TEXT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getAccessibleUIConfiguration = asyncHandler(async (req: Request, res: Response) => {
  try {
    const config = await accessibilityEnhancementService.getAccessibleUIConfiguration(req.userId!);

    res.status(200).json({
      success: true,
      data: { config },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting accessible UI configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get accessible UI configuration',
      code: 'GET_ACCESSIBLE_UI_CONFIG_ERROR',
      timestamp: new Date(),
    });
  }
});

export const validateComponentAccessibility = asyncHandler(async (req: Request, res: Response) => {
  const { type, label, description, colorContrast, size } = req.body;

  if (!type) {
    return res.status(400).json({
      success: false,
      error: 'Component type is required',
      code: 'MISSING_COMPONENT_TYPE',
      timestamp: new Date(),
    });
  }

  try {
    const validation = await accessibilityEnhancementService.validateComponentAccessibility({
      type,
      label,
      description,
      colorContrast,
      size
    });

    res.status(200).json({
      success: true,
      data: { validation },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error validating component accessibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate component accessibility',
      code: 'VALIDATE_COMPONENT_ACCESSIBILITY_ERROR',
      timestamp: new Date(),
    });
  }
});