import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { SmartSchedulingService } from '@services/SmartSchedulingService';

const smartSchedulingService = new SmartSchedulingService();

export const scheduleMessage = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, content, scheduledAt, channelType, metadata } = req.body;

  if (!conversationId || !content || !scheduledAt) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID, content, and scheduled time are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const scheduledMessage = await smartSchedulingService.scheduleMessage(
      req.userId!,
      conversationId,
      content,
      new Date(scheduledAt),
      { channelType, metadata }
    );

    res.status(201).json({
      success: true,
      data: { scheduledMessage },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error scheduling message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule message',
      code: 'SCHEDULE_MESSAGE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getScheduledMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const scheduledMessages = await smartSchedulingService.getScheduledMessages(req.userId!);

    res.status(200).json({
      success: true,
      data: { scheduledMessages },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting scheduled messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduled messages',
      code: 'GET_SCHEDULED_MESSAGES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const cancelScheduledMessage = asyncHandler(async (req: Request, res: Response) => {
  const { scheduledMessageId } = req.params;

  try {
    await smartSchedulingService.cancelScheduledMessage(scheduledMessageId, req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Scheduled message cancelled successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel scheduled message',
      code: 'CANCEL_SCHEDULED_MESSAGE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createAutomationRule = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, trigger, triggerValue, action, actionValue } = req.body;

  if (!name || !trigger || !action) {
    return res.status(400).json({
      success: false,
      error: 'Name, trigger, and action are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const rule = await smartSchedulingService.createAutomationRule(req.userId!, {
      name,
      description,
      trigger,
      triggerValue,
      action,
      actionValue
    });

    res.status(201).json({
      success: true,
      data: { rule },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create automation rule',
      code: 'CREATE_AUTOMATION_RULE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getAutomationRules = asyncHandler(async (req: Request, res: Response) => {
  try {
    const rules = await smartSchedulingService.getAutomationRules(req.userId!);

    res.status(200).json({
      success: true,
      data: { rules },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting automation rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get automation rules',
      code: 'GET_AUTOMATION_RULES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateAutomationRule = asyncHandler(async (req: Request, res: Response) => {
  const { ruleId } = req.params;
  const updates = req.body;

  try {
    const rule = await smartSchedulingService.updateAutomationRule(ruleId, req.userId!, updates);

    res.status(200).json({
      success: true,
      data: { rule },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update automation rule',
      code: 'UPDATE_AUTOMATION_RULE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const toggleAutomationRule = asyncHandler(async (req: Request, res: Response) => {
  const { ruleId } = req.params;

  try {
    const rule = await smartSchedulingService.toggleAutomationRule(ruleId, req.userId!);

    res.status(200).json({
      success: true,
      data: { rule },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error toggling automation rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle automation rule',
      code: 'TOGGLE_AUTOMATION_RULE_ERROR',
      timestamp: new Date(),
    });
  }
});