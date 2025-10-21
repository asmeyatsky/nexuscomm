import { BaseIntegration } from './BaseIntegration';
import crypto from 'crypto';

/**
 * WhatsApp Business API Integration
 */
export class WhatsAppIntegration extends BaseIntegration {
  private accountId: string;
  private phoneId: string;
  private webhookVerifyToken: string;

  constructor(
    accountId: string,
    phoneId: string,
    accessToken: string,
    webhookVerifyToken: string
  ) {
    super('https://graph.instagram.com/v18.0');
    this.accountId = accountId;
    this.phoneId = phoneId;
    this.accessToken = accessToken;
    this.webhookVerifyToken = webhookVerifyToken;
    this.setAuthHeader();
  }

  /**
   * Fetch messages for account
   */
  async fetchMessages(params?: any) {
    try {
      const response = await this.client.get(
        `/${this.phoneId}/messages`,
        { params: { ...params, fields: 'from,id,timestamp,type,text' } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch WhatsApp messages:', error);
      throw error;
    }
  }

  /**
   * Send message via WhatsApp
   */
  async sendMessage(
    recipientPhoneId: string,
    message: string,
    mediaUrls?: string[]
  ): Promise<any> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: recipientPhoneId,
      };

      if (mediaUrls && mediaUrls.length > 0) {
        payload.type = 'image';
        payload.image = { link: mediaUrls[0] };
      } else {
        payload.type = 'text';
        payload.text = { body: message };
      }

      const response = await this.client.post(
        `/${this.phoneId}/messages`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Verify webhook
   */
  verifyWebhook(signature: string, payload: any): boolean {
    const hash = crypto
      .createHmac('sha256', this.webhookVerifyToken)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Parse incoming webhook
   */
  parseWebhookPayload(payload: any) {
    const messages = [];

    if (payload.entry && payload.entry[0]) {
      const changes = payload.entry[0].changes;
      if (changes && changes[0]) {
        const value = changes[0].value;

        if (value.messages) {
          for (const msg of value.messages) {
            messages.push({
              id: msg.id,
              from: msg.from,
              timestamp: msg.timestamp,
              type: msg.type,
              text: msg.text?.body || '',
              media: msg.image || msg.video || msg.document || null,
            });
          }
        }
      }
    }

    return messages;
  }

  /**
   * Get contacts
   */
  async getContacts(): Promise<any> {
    try {
      const response = await this.client.get(
        `/${this.phoneId}/contacts`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch WhatsApp contacts:', error);
      throw error;
    }
  }
}
