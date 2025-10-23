import { AppDataSource } from '@config/database';
import { AppError } from '@middleware/errorHandler';
import crypto from 'crypto';
import axios from 'axios';

// Define integration and webhook interfaces
export interface ThirdPartyIntegration {
  id: string;
  userId: string;
  name: string; // Name of the third-party service
  serviceType: string; // 'CRM', 'project_management', 'email', etc.
  webhookUrl?: string;
  apiKey?: string; // Encrypted
  apiSecret?: string; // Encrypted
  settings: Record<string, any>; // Service-specific settings
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEndpoint {
  id: string;
  userId: string;
  name: string;
  url: string; // The URL to call
  events: string[]; // Which events to trigger on
  secret?: string; // Secret for signing payloads
  isActive: boolean;
  verifySsl: boolean;
  maxRetries: number;
  timeout: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  eventId: string; // ID of the triggering event
  eventType: string; // Type of event
  payload: Record<string, any>;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseTime?: number;
  attemptCount: number;
  isSuccessful: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export interface IntegrationEvent {
  id: string;
  userId: string;
  eventType: string; // 'message_sent', 'message_received', 'contact_added', etc.
  payload: Record<string, any>;
  createdAt: Date;
}

export class ThirdPartyIntegrationService {
  private webhookEndpoints: WebhookEndpoint[] = [];
  private webhookLogs: WebhookLog[] = [];

  constructor() {
    // Initialize integration service
  }

  /**
   * Create a new third-party integration connection
   */
  async createIntegration(
    userId: string,
    integrationData: {
      name: string;
      serviceType: string;
      webhookUrl?: string;
      apiKey?: string;
      apiSecret?: string;
      settings?: Record<string, any>;
    }
  ): Promise<ThirdPartyIntegration> {
    const integration: ThirdPartyIntegration = {
      id: `integ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name: integrationData.name,
      serviceType: integrationData.serviceType,
      webhookUrl: integrationData.webhookUrl,
      apiKey: integrationData.apiKey, // Should be encrypted in real implementation
      apiSecret: integrationData.apiSecret, // Should be encrypted in real implementation
      settings: integrationData.settings || {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created new integration:', integration);

    return integration;
  }

  /**
   * Update an existing integration
   */
  async updateIntegration(
    integrationId: string,
    userId: string,
    updates: Partial<ThirdPartyIntegration>
  ): Promise<ThirdPartyIntegration> {
    // In a real implementation, this would update the database record
    console.log(`Updating integration ${integrationId} for user ${userId}`, updates);
    return {
      id: integrationId,
      userId,
      name: 'Updated Integration',
      serviceType: 'CRM',
      settings: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get all integrations for a user
   */
  async getUserIntegrations(userId: string): Promise<ThirdPartyIntegration[]> {
    // In a real implementation, this would fetch from the database
    return [];
  }

  /**
   * Test an integration connection
   */
  async testIntegration(integrationId: string, userId: string): Promise<boolean> {
    // In a real implementation, this would test the connection to the third-party service
    // For now, return true for successful test
    console.log(`Testing integration ${integrationId} for user ${userId}`);
    return true;
  }

  /**
   * Create a new webhook endpoint
   */
  async createWebhookEndpoint(
    userId: string,
    endpointData: {
      name: string;
      url: string;
      events: string[];
      secret?: string;
      verifySsl?: boolean;
      maxRetries?: number;
      timeout?: number;
    }
  ): Promise<WebhookEndpoint> {
    const endpoint: WebhookEndpoint = {
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name: endpointData.name,
      url: endpointData.url,
      events: endpointData.events,
      secret: endpointData.secret || crypto.randomBytes(32).toString('hex'),
      isActive: true,
      verifySsl: endpointData.verifySsl ?? true,
      maxRetries: endpointData.maxRetries ?? 3,
      timeout: endpointData.timeout ?? 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store the endpoint (in memory for this example)
    this.webhookEndpoints.push(endpoint);

    return endpoint;
  }

  /**
   * Update a webhook endpoint
   */
  async updateWebhookEndpoint(
    endpointId: string,
    userId: string,
    updates: Partial<WebhookEndpoint>
  ): Promise<WebhookEndpoint> {
    const endpointIndex = this.webhookEndpoints.findIndex(
      endpoint => endpoint.id === endpointId && endpoint.userId === userId
    );

    if (endpointIndex === -1) {
      throw new AppError(404, 'Webhook endpoint not found', 'WEBHOOK_ENDPOINT_NOT_FOUND');
    }

    Object.assign(this.webhookEndpoints[endpointIndex], updates, { updatedAt: new Date() });
    return this.webhookEndpoints[endpointIndex];
  }

  /**
   * Delete a webhook endpoint
   */
  async deleteWebhookEndpoint(endpointId: string, userId: string): Promise<void> {
    const endpointIndex = this.webhookEndpoints.findIndex(
      endpoint => endpoint.id === endpointId && endpoint.userId === userId
    );

    if (endpointIndex === -1) {
      throw new AppError(404, 'Webhook endpoint not found', 'WEBHOOK_ENDPOINT_NOT_FOUND');
    }

    this.webhookEndpoints.splice(endpointIndex, 1);
  }

  /**
   * Get all webhook endpoints for a user
   */
  async getUserWebhookEndpoints(userId: string): Promise<WebhookEndpoint[]> {
    return this.webhookEndpoints.filter(endpoint => endpoint.userId === userId);
  }

  /**
   * Trigger a webhook for an event
   */
  async triggerWebhook(event: IntegrationEvent): Promise<void> {
    // Find all endpoints that should be triggered for this event type
    const relevantEndpoints = this.webhookEndpoints.filter(
      endpoint => endpoint.isActive && endpoint.userId === event.userId && 
                 endpoint.events.includes(event.eventType)
    );

    // Trigger each relevant endpoint
    for (const endpoint of relevantEndpoints) {
      await this.callWebhookEndpoint(endpoint, event);
    }
  }

  /**
   * Call a specific webhook endpoint
   */
  private async callWebhookEndpoint(endpoint: WebhookEndpoint, event: IntegrationEvent): Promise<void> {
    const payload = {
      event: event.eventType,
      timestamp: event.createdAt.toISOString(),
      data: event.payload,
      userId: event.userId
    };

    // Sign the payload if a secret is provided
    let signature: string | undefined;
    if (endpoint.secret) {
      const payloadString = JSON.stringify(payload);
      signature = crypto
        .createHmac('sha256', endpoint.secret)
        .update(payloadString)
        .digest('hex');
    }

    // Attempt to call the webhook
    let success = false;
    let responseStatus: number | undefined;
    let responseTime: number | undefined;
    let errorMessage: string | undefined;
    let responseHeaders: Record<string, string> | undefined;

    for (let attempt = 0; attempt <= endpoint.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        const response = await axios.post(endpoint.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...(signature && { 'X-Signature': signature }),
            'User-Agent': 'NexusComm-Webhook-Client/1.0'
          },
          timeout: endpoint.timeout * 1000,
          httpsAgent: endpoint.verifySsl 
            ? undefined 
            : new (require('https').Agent)({ rejectUnauthorized: false })
        });

        responseTime = Date.now() - startTime;
        responseStatus = response.status;
        responseHeaders = response.headers as Record<string, string>;
        success = true;
        
        break; // Success, exit retry loop
      } catch (error: any) {
        errorMessage = error.message || 'Unknown error';
        
        if (attempt >= endpoint.maxRetries) {
          // All retries exhausted
          break;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // Log the webhook result
    const webhookLog: WebhookLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      webhookId: endpoint.id,
      eventId: event.id,
      eventType: event.eventType,
      payload,
      responseStatus,
      responseHeaders,
      responseTime,
      attemptCount: 1, // Simplified for this example
      isSuccessful: success,
      errorMessage,
      createdAt: new Date()
    };

    this.webhookLogs.push(webhookLog);

    if (!success) {
      console.error(`Webhook ${endpoint.id} failed after ${endpoint.maxRetries + 1} attempts:`, errorMessage);
    } else {
      console.log(`Webhook ${endpoint.id} triggered successfully for event ${event.eventType}`);
    }
  }

  /**
   * Handle incoming webhook from a third-party service
   */
  async handleIncomingWebhook(
    userId: string,
    webhookId: string,
    payload: any,
    signature?: string
  ): Promise<void> {
    // Verify the webhook if we have a secret
    const endpoint = this.webhookEndpoints.find(
      ep => ep.id === webhookId && ep.userId === userId
    );

    if (!endpoint) {
      throw new AppError(404, 'Webhook endpoint not found', 'WEBHOOK_ENDPOINT_NOT_FOUND');
    }

    if (endpoint.secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', endpoint.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new AppError(403, 'Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
      }
    }

    // Process the webhook payload based on its content
    await this.processWebhookPayload(userId, payload);
  }

  /**
   * Process the payload of an incoming webhook
   */
  private async processWebhookPayload(userId: string, payload: any): Promise<void> {
    // Parse the payload to determine what kind of event this is
    // and how it should be processed
    
    // Example processing for common webhook formats
    if (payload.event) {
      // Standard event format
      await this.processEvent(userId, payload.event, payload.data);
    } else if (payload.action) {
      // GitHub-style format
      await this.processEvent(userId, payload.action, payload);
    } else {
      // Default processing
      await this.processEvent(userId, 'unknown_event', payload);
    }
  }

  /**
   * Process a specific event from a webhook
   */
  private async processEvent(userId: string, eventType: string, data: any): Promise<void> {
    console.log(`Processing event ${eventType} for user ${userId}:`, data);

    // In a real implementation, this would trigger business logic
    // based on the event type and data
    switch (eventType) {
      case 'message_received':
        // Handle message received from external system
        break;
      case 'contact_updated':
        // Handle contact update from external system
        break;
      case 'deal_closed':
        // Handle deal closure from CRM
        break;
      default:
        // Handle other events or unknown events
        break;
    }
  }

  /**
   * Get webhook logs for debugging
   */
  async getWebhookLogs(webhookId: string, userId: string, limit: number = 50): Promise<WebhookLog[]> {
    return this.webhookLogs
      .filter(log => log.webhookId === webhookId && log.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      .slice(0, limit);
  }

  /**
   * Generate a test event for a webhook
   */
  async generateTestEvent(webhookId: string, userId: string): Promise<void> {
    const event: IntegrationEvent = {
      id: `test-${Date.now()}`,
      userId,
      eventType: 'test_event',
      payload: {
        message: 'This is a test event',
        timestamp: new Date().toISOString(),
        webhookId
      },
      createdAt: new Date()
    };

    // Find the webhook endpoint
    const endpoint = this.webhookEndpoints.find(
      ep => ep.id === webhookId && ep.userId === userId
    );

    if (!endpoint) {
      throw new AppError(404, 'Webhook endpoint not found', 'WEBHOOK_ENDPOINT_NOT_FOUND');
    }

    // Trigger the webhook with the test event
    await this.callWebhookEndpoint(endpoint, event);
  }

  /**
   * Create an event that can trigger webhooks
   */
  async createIntegrationEvent(
    userId: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<IntegrationEvent> {
    const event: IntegrationEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      eventType,
      payload,
      createdAt: new Date()
    };

    // Trigger relevant webhooks
    await this.triggerWebhook(event);

    return event;
  }
}