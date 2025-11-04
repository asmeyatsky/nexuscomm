import { MessagingAdapterPort, ExternalMessageServicePort } from '../ports/ExternalServicePorts';
import { WhatsAppServiceAdapter } from './adapters/WhatsAppServiceAdapter';
import { EmailServiceAdapter } from './adapters/EmailServiceAdapter';
import { SMSServiceAdapter } from './adapters/SMSServiceAdapter';
import { Message } from '../../domain/entities/Message';

/**
 * MessagingAdapter
 * 
 * Architectural Intent:
 * - Implements the MessagingAdapterPort to coordinate multiple messaging channels
 * - Acts as a facade for all external messaging services
 * - Provides unified interface for sending/receiving across channels
 * - Handles channel selection and routing logic
 * 
 * Key Design Decisions:
 * 1. Implements domain port interface
 * 2. Coordinates multiple channel adapters
 * 3. Handles channel selection based on message type and recipient
 * 4. Provides unified error handling and status reporting
 */
export class MessagingAdapter implements MessagingAdapterPort {
  private readonly whatsappAdapter: WhatsAppServiceAdapter;
  private readonly emailAdapter: EmailServiceAdapter;
  private readonly smsAdapter: SMSServiceAdapter;
  private readonly adapters: Map<string, ExternalMessageServicePort>;

  constructor() {
    this.whatsappAdapter = new WhatsAppServiceAdapter();
    this.emailAdapter = new EmailServiceAdapter();
    this.smsAdapter = new SMSServiceAdapter();
    
    // Create a map of channel types to their adapters
    this.adapters = new Map();
    this.adapters.set('whatsapp', this.whatsappAdapter);
    this.adapters.set('email', this.emailAdapter);
    this.adapters.set('sms', this.smsAdapter);
  }

  async sendToChannel(message: Message, channelType: string, recipient: string): Promise<boolean> {
    const adapter = this.adapters.get(channelType);
    
    if (!adapter) {
      throw new Error(`No adapter available for channel type: ${channelType}`);
    }

    try {
      const success = await adapter.sendMessage(message, recipient);
      
      if (success) {
        // In a real implementation, we might want to update message status
        console.log(`Message sent successfully via ${channelType} to ${recipient}`);
      } else {
        console.error(`Failed to send message via ${channelType} to ${recipient}`);
      }
      
      return success;
    } catch (error) {
      console.error(`Error sending message via ${channelType}:`, error);
      return false;
    }
  }

  async receiveFromAllChannels(): Promise<Message[]> {
    const allMessages: Message[] = [];

    // Receive messages from all configured channels
    for (const [channelType, adapter] of this.adapters) {
      try {
        const channelMessages = await adapter.receiveMessages(channelType);
        allMessages.push(...channelMessages);
      } catch (error) {
        console.error(`Error receiving messages from ${channelType}:`, error);
        // Continue with other channels even if one fails
      }
    }

    return allMessages;
  }

  async getChannelStatus(channelType: string): Promise<{ status: string; lastError?: string }> {
    const adapter = this.adapters.get(channelType);
    
    if (!adapter) {
      return { status: 'not_configured', lastError: `No adapter for channel: ${channelType}` };
    }

    try {
      return await adapter.getServiceStatus();
    } catch (error) {
      return {
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getConnectedChannels(): Promise<string[]> {
    const connectedChannels: string[] = [];
    
    for (const [channelType, adapter] of this.adapters) {
      try {
        const status = await adapter.getServiceStatus();
        if (status.status === 'available') {
          connectedChannels.push(channelType);
        }
      } catch (error) {
        console.error(`Error checking status of ${channelType}:`, error);
      }
    }

    return connectedChannels;
  }

  /**
   * Intelligently route a message to the best channel based on context
   */
  async smartRouteMessage(message: Message, recipientInfo: { phone?: string; email?: string; preferredChannel?: string }): Promise<boolean> {
    // Determine the best channel to send the message based on:
    // 1. User's preferred channel
    // 2. Available contact information
    // 3. Message type/content
    
    let channelType: string | null = null;
    let recipient: string | null = null;
    
    // Use preferred channel if specified and available
    if (recipientInfo.preferredChannel && this.adapters.has(recipientInfo.preferredChannel)) {
      if (recipientInfo.preferredChannel === 'whatsapp' && recipientInfo.phone) {
        channelType = 'whatsapp';
        recipient = recipientInfo.phone;
      } else if (recipientInfo.preferredChannel === 'email' && recipientInfo.email) {
        channelType = 'email';
        recipient = recipientInfo.email;
      } else if (recipientInfo.preferredChannel === 'sms' && recipientInfo.phone) {
        channelType = 'sms';
        recipient = recipientInfo.phone;
      }
    }
    
    // If preferred channel is not available, try alternatives
    if (!channelType && !recipient) {
      // Try WhatsApp first (if phone available)
      if (recipientInfo.phone) {
        if (await this.getChannelStatus('whatsapp').then(status => status.status === 'available')) {
          channelType = 'whatsapp';
          recipient = recipientInfo.phone;
        }
        // If WhatsApp not available, try SMS
        else if (await this.getChannelStatus('sms').then(status => status.status === 'available')) {
          channelType = 'sms';
          recipient = recipientInfo.phone;
        }
      }
      // If phone not available, try email
      else if (recipientInfo.email) {
        if (await this.getChannelStatus('email').then(status => status.status === 'available')) {
          channelType = 'email';
          recipient = recipientInfo.email;
        }
      }
    }
    
    if (channelType && recipient) {
      return await this.sendToChannel(message, channelType, recipient);
    } else {
      throw new Error('No suitable channel found for recipient');
    }
  }
}