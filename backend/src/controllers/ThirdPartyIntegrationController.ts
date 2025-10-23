import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { ThirdPartyIntegrationService } from '@services/ThirdPartyIntegrationService';

const thirdPartyIntegrationService = new ThirdPartyIntegrationService();

export const createIntegration = asyncHandler(async (req: Request, res: Response) => {
  const { name, serviceType, webhookUrl, apiKey, apiSecret, settings } = req.body;

  if (!name || !serviceType) {
    return res.status(400).json({
      success: false,
      error: 'Integration name and service type are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const integration = await thirdPartyIntegrationService.createIntegration(req.userId!, {
      name,
      serviceType,
      webhookUrl,
      apiKey,
      apiSecret,
      settings
    });

    res.status(201).json({
      success: true,
      data: { integration },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create integration',
      code: 'CREATE_INTEGRATION_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateIntegration = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId } = req.params;
  const updates = req.body;

  try {
    const integration = await thirdPartyIntegrationService.updateIntegration(
      integrationId,
      req.userId!,
      updates
    );

    res.status(200).json({
      success: true,
      data: { integration },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update integration',
      code: 'UPDATE_INTEGRATION_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getUserIntegrations = asyncHandler(async (req: Request, res: Response) => {
  try {
    const integrations = await thirdPartyIntegrationService.getUserIntegrations(req.userId!);

    res.status(200).json({
      success: true,
      data: { integrations },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting user integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user integrations',
      code: 'GET_USER_INTEGRATIONS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const testIntegration = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId } = req.params;

  if (!integrationId) {
    return res.status(400).json({
      success: false,
      error: 'Integration ID is required',
      code: 'MISSING_INTEGRATION_ID',
      timestamp: new Date(),
    });
  }

  try {
    const success = await thirdPartyIntegrationService.testIntegration(integrationId, req.userId!);

    res.status(200).json({
      success: true,
      data: { success, message: success ? 'Integration test successful' : 'Integration test failed' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error testing integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test integration',
      code: 'TEST_INTEGRATION_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createWebhookEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { name, url, events, secret, verifySsl, maxRetries, timeout } = req.body;

  if (!name || !url || !events || !Array.isArray(events)) {
    return res.status(400).json({
      success: false,
      error: 'Name, URL, and events array are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const endpoint = await thirdPartyIntegrationService.createWebhookEndpoint(req.userId!, {
      name,
      url,
      events,
      secret,
      verifySsl,
      maxRetries,
      timeout
    });

    res.status(201).json({
      success: true,
      data: { endpoint },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating webhook endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook endpoint',
      code: 'CREATE_WEBHOOK_ENDPOINT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateWebhookEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { endpointId } = req.params;
  const updates = req.body;

  try {
    const endpoint = await thirdPartyIntegrationService.updateWebhookEndpoint(
      endpointId,
      req.userId!,
      updates
    );

    res.status(200).json({
      success: true,
      data: { endpoint },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating webhook endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update webhook endpoint',
      code: 'UPDATE_WEBHOOK_ENDPOINT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const deleteWebhookEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { endpointId } = req.params;

  try {
    await thirdPartyIntegrationService.deleteWebhookEndpoint(endpointId, req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Webhook endpoint deleted successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error deleting webhook endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete webhook endpoint',
      code: 'DELETE_WEBHOOK_ENDPOINT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getUserWebhookEndpoints = asyncHandler(async (req: Request, res: Response) => {
  try {
    const endpoints = await thirdPartyIntegrationService.getUserWebhookEndpoints(req.userId!);

    res.status(200).json({
      success: true,
      data: { endpoints },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting user webhook endpoints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user webhook endpoints',
      code: 'GET_USER_WEBHOOK_ENDPOINTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateWebhookTestEvent = asyncHandler(async (req: Request, res: Response) => {
  const { webhookId } = req.params;

  if (!webhookId) {
    return res.status(400).json({
      success: false,
      error: 'Webhook ID is required',
      code: 'MISSING_WEBHOOK_ID',
      timestamp: new Date(),
    });
  }

  try {
    await thirdPartyIntegrationService.generateTestEvent(webhookId, req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Test event generated and sent to webhook' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating webhook test event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate webhook test event',
      code: 'GENERATE_WEBHOOK_TEST_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
  const { webhookId } = req.params;
  const { limit } = req.query;

  if (!webhookId) {
    return res.status(400).json({
      success: false,
      error: 'Webhook ID is required',
      code: 'MISSING_WEBHOOK_ID',
      timestamp: new Date(),
    });
  }

  try {
    const logs = await thirdPartyIntegrationService.getWebhookLogs(
      webhookId,
      req.userId!,
      parseInt(limit as string) || 50
    );

    res.status(200).json({
      success: true,
      data: { logs },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting webhook logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook logs',
      code: 'GET_WEBHOOK_LOGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const handleIncomingWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { userId, webhookId } = req.params;
  const payload = req.body;
  const signature = req.headers['x-signature'] as string;

  if (!userId || !webhookId) {
    return res.status(400).json({
      success: false,
      error: 'User ID and Webhook ID are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    await thirdPartyIntegrationService.handleIncomingWebhook(userId, webhookId, payload, signature);

    res.status(200).json({
      success: true,
      data: { message: 'Webhook processed successfully' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error handling incoming webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process incoming webhook',
      code: 'HANDLE_INCOMING_WEBHOOK_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createIntegrationEvent = asyncHandler(async (req: Request, res: Response) => {
  const { eventType, payload } = req.body;

  if (!eventType || !payload) {
    return res.status(400).json({
      success: false,
      error: 'Event type and payload are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const event = await thirdPartyIntegrationService.createIntegrationEvent(
      req.userId!,
      eventType,
      payload
    );

    res.status(201).json({
      success: true,
      data: { event },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating integration event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create integration event',
      code: 'CREATE_INTEGRATION_EVENT_ERROR',
      timestamp: new Date(),
    });
  }
});