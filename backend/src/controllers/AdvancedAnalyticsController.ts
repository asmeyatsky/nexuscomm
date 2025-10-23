import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AdvancedAnalyticsService } from '@services/AdvancedAnalyticsService';

const advancedAnalyticsService = new AdvancedAnalyticsService();

export const getUserMetrics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const metrics = await advancedAnalyticsService.getUserMetrics(req.userId!);

    res.status(200).json({
      success: true,
      data: { metrics },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting user metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user metrics',
      code: 'GET_USER_METRICS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getConversationAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: 'Conversation ID is required',
      code: 'MISSING_CONVERSATION_ID',
      timestamp: new Date(),
    });
  }

  try {
    const analytics = await advancedAnalyticsService.getConversationAnalytics(conversationId, req.userId!);

    res.status(200).json({
      success: true,
      data: { analytics },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting conversation analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation analytics',
      code: 'GET_CONVERSATION_ANALYTICS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getContactAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;

  if (!contactId) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID is required',
      code: 'MISSING_CONTACT_ID',
      timestamp: new Date(),
    });
  }

  try {
    const analytics = await advancedAnalyticsService.getContactAnalytics(contactId, req.userId!);

    res.status(200).json({
      success: true,
      data: { analytics },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting contact analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contact analytics',
      code: 'GET_CONTACT_ANALYTICS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getPlatformUsageAnalytics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const analytics = await advancedAnalyticsService.getPlatformUsageAnalytics(req.userId!);

    res.status(200).json({
      success: true,
      data: { analytics },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting platform usage analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform usage analytics',
      code: 'GET_PLATFORM_ANALYTICS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getProductivityInsights = asyncHandler(async (req: Request, res: Response) => {
  const { timeframe } = req.query;

  try {
    const insights = await advancedAnalyticsService.getProductivityInsights(
      req.userId!,
      (timeframe as 'daily' | 'weekly' | 'monthly') || 'weekly'
    );

    res.status(200).json({
      success: true,
      data: { insights },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting productivity insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get productivity insights',
      code: 'GET_PRODUCTIVITY_INSIGHTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getCommunicationTrends = asyncHandler(async (req: Request, res: Response) => {
  const { days } = req.query;

  try {
    const trends = await advancedAnalyticsService.getCommunicationTrends(
      req.userId!,
      parseInt(days as string) || 30
    );

    res.status(200).json({
      success: true,
      data: { trends },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting communication trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get communication trends',
      code: 'GET_COMMUNICATION_TRENDS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getAnalyticsDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const dashboard = await advancedAnalyticsService.getAnalyticsDashboard(req.userId!);

    res.status(200).json({
      success: true,
      data: { dashboard },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting analytics dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics dashboard',
      code: 'GET_ANALYTICS_DASHBOARD_ERROR',
      timestamp: new Date(),
    });
  }
});