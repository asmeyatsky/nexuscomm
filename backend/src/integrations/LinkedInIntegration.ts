import { BaseIntegration } from './BaseIntegration';

/**
 * LinkedIn Direct Messages Integration
 */
export class LinkedInIntegration extends BaseIntegration {
  private personUrn: string;

  constructor(accessToken: string, personUrn: string) {
    super('https://api.linkedin.com/v2');
    this.accessToken = accessToken;
    this.personUrn = personUrn;
    this.setAuthHeader();
  }

  /**
   * Fetch messages/conversations
   */
  async fetchMessages(params?: any) {
    try {
      const response = await this.client.get(
        '/messaging/conversations',
        {
          params: {
            q: 'initiator',
            ...params,
          },
          headers: {
            'LinkedIn-Version': '202305',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch LinkedIn messages:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string) {
    try {
      const response = await this.client.get(
        `/messaging/conversations/${conversationId}/events`,
        {
          params: {
            q: 'eventCreated',
          },
          headers: {
            'LinkedIn-Version': '202305',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch LinkedIn conversation:', error);
      throw error;
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    recipientUrn: string,
    message: string,
    mediaUrls?: string[]
  ): Promise<any> {
    try {
      const payload = {
        recipients: [{ id: recipientUrn }],
        subject: 'Message from NexusComm',
        body: message,
      };

      const response = await this.client.post(
        '/messaging/messages',
        payload,
        {
          headers: {
            'LinkedIn-Version': '202305',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to send LinkedIn message:', error);
      throw error;
    }
  }

  /**
   * Verify webhook
   */
  verifyWebhook(signature: string, payload: any): boolean {
    // LinkedIn webhook verification
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', process.env.LINKEDIN_WEBHOOK_SECRET || '')
      .update(JSON.stringify(payload))
      .digest('base64');

    return hash === signature;
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(payload: any) {
    const messages = [];

    if (payload.eventMeta) {
      messages.push({
        id: payload.eventMeta.eventId,
        from: payload.eventMeta.senderUrn,
        timestamp: payload.eventMeta.eventCreatedTime,
        body: payload.eventContent?.textContent || '',
      });
    }

    return messages;
  }

  /**
   * Get user profile
   */
  async getProfile() {
    try {
      const response = await this.client.get(
        '/me',
        {
          headers: {
            'LinkedIn-Version': '202305',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch LinkedIn profile:', error);
      throw error;
    }
  }
}
