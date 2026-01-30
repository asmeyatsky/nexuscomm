/**
 * API Routes for Enhanced MCP Features
 */

import { Router } from 'express';
import { EnhancedMessageController } from '../controllers/EnhancedMessageController.js';

const router = Router();
const enhancedController = new EnhancedMessageController();

/**
 * Enhanced message creation with AI suggestions
 */
router.post('/enhanced', enhancedController.createMessageWithEnhancements.bind(enhancedController));

/**
 * Get messages with AI insights
 */
router.get('/:conversationId/enhanced', enhancedController.getMessagesWithInsights.bind(enhancedController));

/**
 * Advanced triage endpoint
 */
router.post('/triage', enhancedController.performAdvancedTriage.bind(enhancedController));

/**
 * Intelligent follow-up reminders
 */
router.post('/reminders/intelligent', enhancedController.createIntelligentReminder.bind(enhancedController));

/**
 * System capabilities
 */
router.get('/system/capabilities', enhancedController.getSystemCapabilities.bind(enhancedController));

/**
 * Daily communication digest
 */
router.get('/digest/daily', enhancedController.getDailyDigest.bind(enhancedController));

export { router as enhancedMessageRoutes };