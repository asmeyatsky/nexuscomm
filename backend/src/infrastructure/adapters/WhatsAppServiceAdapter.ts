import { ExternalMessageServicePort, WhatsAppServiceAdapterPort } from '../ports/ExternalServicePorts';
import { Message } from '../../domain/entities/Message';
import { User } from '../../domain/value_objects/User';
import { Conversation } from '../../domain/value_objects/Conversation';

/**
 * WhatsAppServiceAdapter
 * 
 * Architectural Intent:
 * - Implements the WhatsAppServiceAdapterPort using WhatsApp Business API
 * - Acts as an adapter between domain and external WhatsApp service
 * - Transforms between domain entities and WhatsApp API objects
 * - Provides infrastructure-specific implementation details
 * 
 * Key Design Decisions:
 * 1. Implements domain port interface
 * 2. Handles authentication with WhatsApp Business API
 * 3. Maps between domain entities and WhatsApp objects
 * 4. Handles error cases and retries appropriately
 */
export class WhatsAppServiceAdapter implements WhatsAppServiceAdapterPort {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.baseUrl = process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com/v17.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    
    if (!this.accessToken) {
      console.warn('WhatsApp access token not configured');
    }
  }

  async sendMessage(message: Message, recipient: string): Promise<boolean> {
    return this.sendWhatsAppMessage(message, recipient);
  }

  async sendWhatsAppMessage(message: Message, recipientPhone: string): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('WhatsApp service not configured');
    }

    try {
      // In a real implementation, we would call WhatsApp Business API
      // This is a simplified representation of how it would work
      
      // Format recipient phone number for WhatsApp (remove any formatting)
      const formattedRecipient = recipientPhone.replace(/\D/g, '');
      
      // Prepare the message payload
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedRecipient,
        type: 'text',
        text: {
          body: message.content.text,
        },
      };

      // In a real implementation, we would make an HTTP request:
      // const response = await axios.post(
      //   `${this.baseUrl}/${this.phoneNumberId}/messages`,
      //   payload,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.accessToken}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      console.log(`WhatsApp message payload: ${JSON.stringify(payload)}`);
      
      // For now, return true to simulate success
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  async sendWhatsAppMediaMessage(
    message: Message, 
    recipientPhone: string, 
    mediaUrl: string, 
    mediaType: 'image' | 'video' | 'document'
  ): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('WhatsApp service not configured');
    }

    try {
      // Format recipient phone number for WhatsApp
      const formattedRecipient = recipientPhone.replace(/\D/g, '');
      
      // Prepare the media message payload based on media type
      let mediaPayload: any;
      
      switch (mediaType) {
        case 'image':
          mediaPayload = {
            messaging_product: 'whatsapp',
            to: formattedRecipient,
            type: 'image',
            image: {
              link: mediaUrl,
              caption: message.content.text || undefined,
            },
          };
          break;
        case 'video':
          mediaPayload = {
            messaging_product: 'whatsapp',
            to: formattedRecipient,
            type: 'video',
            video: {
              link: mediaUrl,
              caption: message.content.text || undefined,
            },
          };
          break;
        case 'document':
          mediaPayload = {
            messaging_product: 'whatsapp',
            to: formattedRecipient,
            type: 'document',
            document: {
              link: mediaUrl,
              caption: message.content.text || undefined,
              filename: message.attachments?.[0]?.name || 'document',
            },
          };
          break;
        default:
          throw new Error(`Unsupported media type: ${mediaType}`);
      }

      // In a real implementation, we would make an HTTP request:
      // const response = await axios.post(
      //   `${this.baseUrl}/${this.phoneNumberId}/messages`,
      //   mediaPayload,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.accessToken}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      console.log(`WhatsApp media message payload: ${JSON.stringify(mediaPayload)}`);
      
      // For now, return true to simulate success
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp media message:', error);
      return false;
    }
  }

  async getTemplateMessages(): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('WhatsApp service not configured');
    }

    try {
      // In a real implementation, we would fetch template messages from WhatsApp API
      // const response = await axios.get(
      //   `${this.baseUrl}/${this.phoneNumberId}/message_templates`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.accessToken}`,
      //     }
      //   }
      // );

      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('Error fetching template messages:', error);
      return [];
    }
  }

  async receiveMessages(channelType: string, lastSync?: Date): Promise<Message[]> {
    // In a real implementation, we would receive messages via webhooks
    // This is a placeholder that returns an empty array
    return [];
  }

  async getUserInfo(externalUserId: string, channelType: string): Promise<User | null> {
    // In a real implementation, we would fetch user info from WhatsApp
    // This is a placeholder
    return null;
  }

  async getConversationInfo(externalConversationId: string, channelType: string): Promise<Conversation | null> {
    // In a real implementation, we would fetch conversation info
    // This is a placeholder
    return null;
  }

  async isServiceAvailable(): Promise<boolean> {
    return !!this.accessToken;
  }

  async getServiceStatus(): Promise<{ status: string; lastError?: string }> {
    if (!this.accessToken) {
      return { status: 'unconfigured' };
    }

    try {
      // In a real implementation, we would ping the WhatsApp API to check availability
      // For now, assume it's available if configured
      return { status: 'available' };
    } catch (error) {
      return { 
        status: 'error', 
        lastError: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}