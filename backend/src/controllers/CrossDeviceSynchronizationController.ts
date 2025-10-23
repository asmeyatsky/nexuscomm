import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { CrossDeviceSynchronizationService } from '@services/CrossDeviceSynchronizationService';

const crossDeviceSynchronizationService = new CrossDeviceSynchronizationService();

export const registerDevice = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId, deviceType, platform, deviceName, notificationToken } = req.body;

  if (!deviceId || !deviceType || !platform) {
    return res.status(400).json({
      success: false,
      error: 'Device ID, type, and platform are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const device = await crossDeviceSynchronizationService.registerDevice(req.userId!, {
      deviceId,
      deviceType,
      platform,
      deviceName: deviceName || `${platform} Device`,
      notificationToken
    });

    res.status(201).json({
      success: true,
      data: { device },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register device',
      code: 'REGISTER_DEVICE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateDeviceActivity = asyncHandler(async (req: Request, res: Response) => {
  const { isOnline } = req.body;

  try {
    const device = await crossDeviceSynchronizationService.updateDeviceActivity(
      req.params.deviceId,
      req.userId!,
      isOnline
    );

    res.status(200).json({
      success: true,
      data: { device },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating device activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device activity',
      code: 'UPDATE_DEVICE_ACTIVITY_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getUserDevices = asyncHandler(async (req: Request, res: Response) => {
  try {
    const devices = await crossDeviceSynchronizationService.getUserDevices(req.userId!);

    res.status(200).json({
      success: true,
      data: { devices },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting user devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user devices',
      code: 'GET_USER_DEVICES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getUserSyncSessions = asyncHandler(async (req: Request, res: Response) => {
  try {
    const sessions = await crossDeviceSynchronizationService.getUserSyncSessions(req.userId!);

    res.status(200).json({
      success: true,
      data: { sessions },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting user sync sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user sync sessions',
      code: 'GET_SYNC_SESSIONS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getDevicePreferences = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  try {
    const preferences = await crossDeviceSynchronizationService.getDevicePreferences(req.userId!, deviceId);

    res.status(200).json({
      success: true,
      data: { preferences },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting device preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device preferences',
      code: 'GET_DEVICE_PREFERENCES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateDevicePreferences = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const updates = req.body;

  try {
    const preferences = await crossDeviceSynchronizationService.updateDevicePreferences(
      req.userId!,
      deviceId,
      updates
    );

    res.status(200).json({
      success: true,
      data: { preferences },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating device preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device preferences',
      code: 'UPDATE_DEVICE_PREFERENCES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getSyncHistory = asyncHandler(async (req: Request, res: Response) => {
  const { limit, since } = req.query;

  try {
    const history = await crossDeviceSynchronizationService.getSyncHistory(req.userId!, {
      limit: limit ? parseInt(limit as string) : undefined,
      since: since ? new Date(since as string) : undefined
    });

    res.status(200).json({
      success: true,
      data: { history },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting sync history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync history',
      code: 'GET_SYNC_HISTORY_ERROR',
      timestamp: new Date(),
    });
  }
});

export const forceSync = asyncHandler(async (req: Request, res: Response) => {
  const { fromDeviceId, toDeviceId } = req.body;

  try {
    const result = await crossDeviceSynchronizationService.forceSync(req.userId!, fromDeviceId, toDeviceId);

    res.status(200).json({
      success: true,
      data: { result },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error forcing sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force sync',
      code: 'FORCE_SYNC_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getSyncStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const status = await crossDeviceSynchronizationService.getSyncStatus(req.userId!);

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

export const handleDeviceDisconnection = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  try {
    await crossDeviceSynchronizationService.handleDeviceDisconnection(deviceId, req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Device disconnection handled successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error handling device disconnection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle device disconnection',
      code: 'HANDLE_DEVICE_DISCONNECT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const handleDeviceReconnection = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  try {
    await crossDeviceSynchronizationService.handleDeviceReconnection(deviceId, req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Device reconnection handled successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error handling device reconnection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle device reconnection',
      code: 'HANDLE_DEVICE_RECONNECT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getDeviceSyncToken = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  try {
    const token = await crossDeviceSynchronizationService.getDeviceSyncToken(req.userId!, deviceId);

    res.status(200).json({
      success: true,
      data: { token },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting device sync token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device sync token',
      code: 'GET_SYNC_TOKEN_ERROR',
      timestamp: new Date(),
    });
  }
});

export const remoteWipeDevice = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  try {
    await crossDeviceSynchronizationService.remoteWipeDevice(req.userId!, deviceId);

    res.status(200).json({
      success: true,
      data: { message: 'Remote wipe initiated successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error initiating remote wipe:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate remote wipe',
      code: 'REMOTE_WIPE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const revokeDeviceAccess = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  try {
    await crossDeviceSynchronizationService.revokeDeviceAccess(req.userId!, deviceId);

    res.status(200).json({
      success: true,
      data: { message: 'Device access revoked successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error revoking device access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke device access',
      code: 'REVOKE_DEVICE_ACCESS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getInactiveDevices = asyncHandler(async (req: Request, res: Response) => {
  const { days } = req.query;

  try {
    const devices = await crossDeviceSynchronizationService.getInactiveDevices(
      req.userId!,
      days ? parseInt(days as string) : 7
    );

    res.status(200).json({
      success: true,
      data: { devices },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting inactive devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get inactive devices',
      code: 'GET_INACTIVE_DEVICES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const migrateData = asyncHandler(async (req: Request, res: Response) => {
  const { sourceDeviceId, targetDeviceId, entities } = req.body;

  if (!sourceDeviceId || !targetDeviceId || !entities || !Array.isArray(entities)) {
    return res.status(400).json({
      success: false,
      error: 'Source device ID, target device ID, and entities array are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const result = await crossDeviceSynchronizationService.migrateData(
      sourceDeviceId,
      targetDeviceId,
      req.userId!,
      entities
    );

    res.status(200).json({
      success: true,
      data: { result },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error migrating data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to migrate data',
      code: 'MIGRATE_DATA_ERROR',
      timestamp: new Date(),
    });
  }
});