import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AdvancedPrivacySecurityService } from '@services/AdvancedPrivacySecurityService';

const advancedPrivacySecurityService = new AdvancedPrivacySecurityService();

export const getPrivacySettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await advancedPrivacySecurityService.getOrCreatePrivacySettings(req.userId!);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get privacy settings',
      code: 'GET_PRIVACY_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updatePrivacySettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;

  try {
    const settings = await advancedPrivacySecurityService.updatePrivacySettings(req.userId!, updates);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update privacy settings',
      code: 'UPDATE_PRIVACY_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getSecuritySettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await advancedPrivacySecurityService.getOrCreateSecuritySettings(req.userId!);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting security settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security settings',
      code: 'GET_SECURITY_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateSecuritySettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;

  try {
    const settings = await advancedPrivacySecurityService.updateSecuritySettings(req.userId!, updates);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update security settings',
      code: 'UPDATE_SECURITY_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateEncryptionKeys = asyncHandler(async (req: Request, res: Response) => {
  const { keyType } = req.body;

  if (!keyType) {
    return res.status(400).json({
      success: false,
      error: 'Key type is required (user_data, message_content, media_content)',
      code: 'MISSING_KEY_TYPE',
      timestamp: new Date(),
    });
  }

  try {
    const key = await advancedPrivacySecurityService.generateEncryptionKeys(req.userId!, keyType);

    res.status(200).json({
      success: true,
      data: { key },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating encryption keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate encryption keys',
      code: 'GENERATE_ENCRYPTION_KEYS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getDataRetentionSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await advancedPrivacySecurityService.getDataRetentionSettings(req.userId!);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting data retention settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data retention settings',
      code: 'GET_DATA_RETENTION_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateDataRetentionSettings = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;

  try {
    const settings = await advancedPrivacySecurityService.updateDataRetentionSettings(req.userId!, updates);

    res.status(200).json({
      success: true,
      data: { settings },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating data retention settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update data retention settings',
      code: 'UPDATE_DATA_RETENTION_SETTINGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const checkDataRetention = asyncHandler(async (req: Request, res: Response) => {
  try {
    await advancedPrivacySecurityService.checkDataRetention(req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Data retention check completed' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error checking data retention:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check data retention',
      code: 'CHECK_DATA_RETENTION_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generatePrivacyReport = asyncHandler(async (req: Request, res: Response) => {
  try {
    const report = await advancedPrivacySecurityService.generatePrivacyReport(req.userId!);

    res.status(200).json({
      success: true,
      data: { report },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating privacy report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate privacy report',
      code: 'GENERATE_PRIVACY_REPORT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const hasResourceAccess = asyncHandler(async (req: Request, res: Response) => {
  const { resourceType, resourceId, action } = req.body;

  if (!resourceType || !resourceId || !action) {
    return res.status(400).json({
      success: false,
      error: 'Resource type, resource ID, and action are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const hasAccess = await advancedPrivacySecurityService.hasResourceAccess(
      req.userId!,
      resourceType,
      resourceId,
      action as 'read' | 'write' | 'delete'
    );

    res.status(200).json({
      success: true,
      data: { hasAccess },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error checking resource access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check resource access',
      code: 'CHECK_RESOURCE_ACCESS_ERROR',
      timestamp: new Date(),
    });
  }
});