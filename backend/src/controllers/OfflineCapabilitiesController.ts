import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { OfflineCapabilitiesService } from '@services/OfflineCapabilitiesService';

const offlineCapabilitiesService = new OfflineCapabilitiesService();

export const getOfflineSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await offlineCapabilitiesService.getOfflineSettings(req.userId!);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting offline settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get offline settings',
      code: 'GET_OFFLINE_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateOfflineSettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;

  try {
    const settings = await offlineCapabilitiesService.updateOfflineSettings(
      req.userId!,
      updates
    );

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating offline settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update offline settings',
      code: 'UPDATE_OFFLINE_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const queueOfflineMessage = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, content, channelType, direction, mediaUrls, metadata } = req.body;

  if (!conversationId || !content) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID and content are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const message = await offlineCapabilitiesService.queueOfflineMessage(req.userId!, {
      conversationId,
      content,
      channelType: channelType || 'whatsapp',
      direction: direction || 'outbound',
      mediaUrls,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      data: { message },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error queuing offline message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue offline message',
      code: 'QUEUE_OFFLINE_MESSAGE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getPendingSyncItems = asyncHandler(async (req: Request, res: Response) => {
  try {
    const items = await offlineCapabilitiesService.getPendingSyncItems(req.userId!);

    res.status(200).json({
      success: true,
      data: { items },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting pending sync items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending sync items',
      code: 'GET_PENDING_SYNC_ITEMS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getOfflineMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const messages = await offlineCapabilitiesService.getOfflineMessages(req.userId!);

    res.status(200).json({
      success: true,
      data: { messages },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting offline messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get offline messages',
      code: 'GET_OFFLINE_MESSAGES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const triggerSync = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await offlineCapabilitiesService.triggerSync(req.userId!);

    res.status(200).json({
      success: true,
      data: { result },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync',
      code: 'TRIGGER_SYNC_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getSyncStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const status = await offlineCapabilitiesService.getSyncStatus(req.userId!);

    res.status(200).json({
      success: true,
      data: { status },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      code: 'GET_SYNC_STATUS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const clearOfflineCache = asyncHandler(async (req: Request, res: Response) => {
  try {
    await offlineCapabilitiesService.clearOfflineCache(req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Offline cache cleared successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error clearing offline cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear offline cache',
      code: 'CLEAR_OFFLINE_CACHE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const exportOfflineData = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = await offlineCapabilitiesService.exportOfflineData(req.userId!);

    res.status(200).json({
      success: true,
      data: { data },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error exporting offline data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export offline data',
      code: 'EXPORT_OFFLINE_DATA_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getOfflineStorageUsage = asyncHandler(async (req: Request, res: Response) => {
  try {
    const usage = await offlineCapabilitiesService.getOfflineStorageUsage(req.userId!);

    res.status(200).json({
      success: true,
      data: { usage },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting offline storage usage:', error);
    res.status(500).json({
      success: true,
      error: 'Failed to get offline storage usage',
      code: 'GET_STORAGE_USAGE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const handleNetworkStatusChange = asyncHandler(async (req: Request, res: Response) => {
  const { isOnline } = req.body;

  if (isOnline === undefined) {
    return res.status(400).json({
      success: false,
      error: 'isOnline status is required',
      code: 'MISSING_IS_ONLINE',
      timestamp: new Date(),
    });
  }

  try {
    await offlineCapabilitiesService.handleNetworkStatusChange(req.userId!, isOnline);

    res.status(200).json({
      success: true,
      data: { message: 'Network status change handled successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error handling network status change:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle network status change',
      code: 'HANDLE_NETWORK_STATUS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const compactOfflineStorage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await offlineCapabilitiesService.compactOfflineStorage(req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Offline storage compacted successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error compacting offline storage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compact offline storage',
      code: 'COMPACT_STORAGE_ERROR',
      timestamp: new Date(),
    });
  }
});