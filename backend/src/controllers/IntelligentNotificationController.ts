import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { IntelligentNotificationService } from '@services/IntelligentNotificationService';

const intelligentNotificationService = new IntelligentNotificationService();

export const createNotificationPreference = asyncHandler(async (req: Request, res: Response) => {
  const { channelType, notificationType, priority, deliveryMethod, delay, quietHours, enabled } = req.body;

  if (!channelType || !notificationType) {
    return res.status(400).json({
      success: false,
      error: 'Channel type and notification type are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const preference = await intelligentNotificationService.createNotificationPreference(req.userId!, {
      channelType,
      notificationType,
      priority: priority || 'medium',
      deliveryMethod: deliveryMethod || 'push',
      delay: delay || 0,
      quietHours: quietHours || {
        enabled: false,
        start: '22:00',
        end: '07:00',
        timezone: 'UTC'
      },
      enabled: enabled !== false // default to true
    });

    res.status(201).json({
      success: true,
      data: { preference },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating notification preference:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification preference',
      code: 'CREATE_NOTIFICATION_PREFERENCE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  const { channelType, notificationType } = req.params;
  const updates = req.body;

  try {
    const preference = await intelligentNotificationService.updateNotificationPreferences(
      req.userId!,
      channelType,
      notificationType,
      updates
    );

    res.status(200).json({
      success: true,
      data: { preference },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      code: 'UPDATE_NOTIFICATION_PREFERENCES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  try {
    const preferences = await intelligentNotificationService.getNotificationPreferences(req.userId!);

    res.status(200).json({
      success: true,
      data: { preferences },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences',
      code: 'GET_NOTIFICATION_PREFERENCES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createIntelligentNotification = asyncHandler(async (req: Request, res: Response) => {
  const { title, body, type, priority, deliveryMethod, scheduledAt, metadata } = req.body;

  if (!title || !body) {
    return res.status(400).json({
      success: false,
      error: 'Title and body are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const notification = await intelligentNotificationService.createIntelligentNotification(req.userId!, {
      title,
      body,
      type: type || 'message',
      priority: priority || 'medium',
      deliveryMethod: deliveryMethod || 'push',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      data: { notification },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating intelligent notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create intelligent notification',
      code: 'CREATE_INTELLIGENT_NOTIFICATION_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createNotificationRule = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, conditions, actions, priority } = req.body;

  if (!name || !conditions || !actions) {
    return res.status(400).json({
      success: false,
      error: 'Name, conditions, and actions are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const rule = await intelligentNotificationService.createNotificationRule(req.userId!, {
      name,
      description,
      conditions,
      actions,
      priority: priority || 10,
      isEnabled: true
    });

    res.status(201).json({
      success: true,
      data: { rule },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating notification rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification rule',
      code: 'CREATE_NOTIFICATION_RULE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getNotificationInsights = asyncHandler(async (req: Request, res: Response) => {
  try {
    const insights = await intelligentNotificationService.getNotificationInsights(req.userId!);

    res.status(200).json({
      success: true,
      data: { insights },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting notification insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification insights',
      code: 'GET_NOTIFICATION_INSIGHTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getPendingNotifications = asyncHandler(async (req: Request, res: Response) => {
  try {
    const notifications = await intelligentNotificationService.getPendingNotifications(req.userId!);

    res.status(200).json({
      success: true,
      data: { notifications },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending notifications',
      code: 'GET_PENDING_NOTIFICATIONS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  try {
    const notification = await intelligentNotificationService.markNotificationAsRead(notificationId, req.userId!);

    res.status(200).json({
      success: true,
      data: { notification },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      code: 'MARK_NOTIFICATION_READ_ERROR',
      timestamp: new Date(),
    });
  }
});

export const sendBulkNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { notifications } = req.body;

  if (!Array.isArray(notifications)) {
    return res.status(400).json({
      success: false,
      error: 'Notifications must be an array',
      code: 'INVALID_NOTIFICATIONS_FORMAT',
      timestamp: new Date(),
    });
  }

  try {
    const results = await intelligentNotificationService.sendBulkNotifications(
      req.userId!,
      notifications
    );

    res.status(200).json({
      success: true,
      data: { notifications: results },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk notifications',
      code: 'SEND_BULK_NOTIFICATIONS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const isUserInDoNotDisturbMode = asyncHandler(async (req: Request, res: Response) => {
  try {
    const isDnd = await intelligentNotificationService.isUserInDoNotDisturbMode(req.userId!);

    res.status(200).json({
      success: true,
      data: { isDnd },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error checking Do Not Disturb status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Do Not Disturb status',
      code: 'CHECK_DND_STATUS_ERROR',
      timestamp: new Date(),
    });
  }
});