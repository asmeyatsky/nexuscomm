import { BaseIntegration } from './BaseIntegration';

/**
 * Instagram Direct Messages Integration
 */
export class InstagramIntegration extends BaseIntegration {
  private igUserId: string;

  constructor(accessToken: string, igUserId: string) {
    super('https://graph.instagram.com/v18.0');
    this.accessToken = accessToken;
    this.igUserId = igUserId;
    this.setAuthHeader();
  }

  /**
   * Fetch DMs
   */
  async fetchMessages(params?: any) {
    try {
      const response = await this.client.get(
        `/${this.igUserId}/conversations`,
        {
          params: {
            fields: 'id,users,senders,snippet,updated_time',
            ...params,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Instagram DMs:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string) {
    try {
      const response = await this.client.get(
        `/${conversationId}/messages`,
        {
          params: {
            fields: 'id,from,message,created_timestamp,type,media',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Instagram conversation:', error);
      throw error;
    }
  }

  /**
   * Send DM
   */
  async sendMessage(
    recipientId: string,
    message: string,
    mediaUrls?: string[]
  ): Promise<any> {
    try {
      const payload: any = {
        recipient: { id: recipientId },
      };

      if (mediaUrls && mediaUrls.length > 0) {
        payload.media_type = 'IMAGE';
        payload.media_url = mediaUrls[0];
      } else {
        payload.message = message;
      }

      const response = await this.client.post(
        `/${this.igUserId}/messages`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error('Failed to send Instagram message:', error);
      throw error;
    }
  }

  /**
   * Verify webhook
   */
  verifyWebhook(signature: string, payload: any): boolean {
    // Instagram uses standard webhook signature verification
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', process.env.INSTAGRAM_WEBHOOK_SECRET || '')
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(payload: any) {
    const messages = [];

    if (payload.entry && payload.entry[0]) {
      const messaging = payload.entry[0].messaging || [];
      for (const msg of messaging) {
        messages.push({
          id: msg.message?.mid || msg.postback?.payload,
          from: msg.sender.id,
          timestamp: msg.timestamp,
          text: msg.message?.text || '',
          attachments: msg.message?.attachments || [],
        });
      }
    }

    return messages;
  }

  /**
   * Get user profile
   */
  async getProfile() {
    try {
      const response = await this.client.get(
        `/${this.igUserId}`,
        { params: { fields: 'id,username,name,biography,profile_picture_url' } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Instagram profile:', error);
      throw error;
    }
  }
}
