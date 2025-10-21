import { BaseIntegration } from './BaseIntegration';

/**
 * Gmail Integration via Google API
 */
export class GmailIntegration extends BaseIntegration {
  private userId: string = 'me'; // Special value for authenticated user

  constructor(accessToken: string) {
    super('https://www.googleapis.com/gmail/v1/users/me');
    this.accessToken = accessToken;
    this.setAuthHeader();
  }

  /**
   * Fetch messages from inbox
   */
  async fetchMessages(params?: any) {
    try {
      const response = await this.client.get(
        '/messages',
        {
          params: {
            q: 'in:inbox',
            maxResults: 50,
            ...params,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
      throw error;
    }
  }

  /**
   * Get full message details
   */
  async getMessage(messageId: string) {
    try {
      const response = await this.client.get(
        `/messages/${messageId}`,
        { params: { format: 'full' } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Gmail message:', error);
      throw error;
    }
  }

  /**
   * Send email
   */
  async sendMessage(
    to: string,
    subject: string,
    body: string,
    mediaUrls?: string[]
  ): Promise<any> {
    try {
      const emailHeaders = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
      ].join('\r\n');

      const emailBody = `${emailHeaders}\r\n\r\n${body}`;
      const encodedMessage = Buffer.from(emailBody)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const response = await this.client.post(
        '/messages/send',
        { raw: encodedMessage }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to send Gmail message:', error);
      throw error;
    }
  }

  /**
   * Verify webhook (Gmail uses polling)
   */
  verifyWebhook(signature: string, payload: any): boolean {
    // Gmail doesn't use webhook verification
    return true;
  }

  /**
   * Parse email from Gmail message format
   */
  parseWebhookPayload(gmailMessage: any) {
    const headers = gmailMessage.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';

    return {
      id: gmailMessage.id,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      timestamp: gmailMessage.internalDate,
      body: gmailMessage.payload?.parts?.[0]?.body?.data || '',
    };
  }

  /**
   * Get email profile
   */
  async getProfile() {
    try {
      const response = await this.client.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Gmail profile:', error);
      throw error;
    }
  }
}
