import { Message } from '../../domain/entities/Message';
import { User } from '../../domain/value_objects/User';
import { Conversation } from '../../domain/value_objects/Conversation';

/**
 * ExternalMessageServicePort Interface
 * 
 * Architectural Intent:
 * - Defines the contract for external messaging service integrations
 * - Part of the domain layer, not tied to specific infrastructure
 * - Enables port/adapter pattern for external service integrations
 * - Supports the hexagonal architecture by defining domain-facing contracts
 * 
 * Key Design Decisions:
 * 1. Methods defined at domain level, not infrastructure level
 * 2. Return domain entities/value objects, not infrastructure-specific objects
 * 3. Support for various external channel types (WhatsApp, SMS, Email, etc.)
 * 4. Follows interface segregation principle
 */
export interface ExternalMessageServicePort {
  /**
   * Send a message to an external channel
   */
  sendMessage(message: Message, recipient: string): Promise<boolean>;

  /**
   * Receive messages from an external channel
   */
  receiveMessages(channelType: string, lastSync?: Date): Promise<Message[]>;

  /**
   * Get user information from external channel
   */
  getUserInfo(externalUserId: string, channelType: string): Promise<User | null>;

  /**
   * Get conversation information from external channel
   */
  getConversationInfo(externalConversationId: string, channelType: string): Promise<Conversation | null>;

  /**
   * Check if the service is available
   */
  isServiceAvailable(): Promise<boolean>;

  /**
   * Get service status
   */
  getServiceStatus(): Promise<{ status: string; lastError?: string }>;
}

/**
 * WhatsAppServiceAdapterPort Interface
 * 
 * Architectural Intent:
 * - Defines the contract for WhatsApp Business API integration
 * - Part of the domain layer, not tied to specific infrastructure
 * - Enables port/adapter pattern for WhatsApp integration
 */
export interface WhatsAppServiceAdapterPort extends ExternalMessageServicePort {
  /**
   * Send a WhatsApp message with rich media
   */
  sendWhatsAppMessage(message: Message, recipientPhone: string): Promise<boolean>;

  /**
   * Send a WhatsApp media message (image, video, document)
   */
  sendWhatsAppMediaMessage(
    message: Message, 
    recipientPhone: string, 
    mediaUrl: string, 
    mediaType: 'image' | 'video' | 'document'
  ): Promise<boolean>;

  /**
   * Get WhatsApp template messages
   */
  getTemplateMessages(): Promise<any[]>;
}

/**
 * EmailServiceAdapterPort Interface
 * 
 * Architectural Intent:
 * - Defines the contract for Email service integration
 * - Part of the domain layer, not tied to specific infrastructure
 * - Enables port/adapter pattern for Email integration
 */
export interface EmailServiceAdapterPort extends ExternalMessageServicePort {
  /**
   * Send an email message
   */
  sendEmail(
    to: string, 
    subject: string, 
    htmlBody: string, 
    textBody?: string,
    attachments?: Array<{ filename: string; path: string; contentType: string }>
  ): Promise<boolean>;

  /**
   * Get email message headers
   */
  getEmailHeaders(since?: Date): Promise<any[]>;

  /**
   * Get full email content
   */
  getEmailContent(emailId: string): Promise<any>;
}

/**
 * SMSServiceAdapterPort Interface
 * 
 * Architectural Intent:
 * - Defines the contract for SMS service integration
 * - Part of the domain layer, not tied to specific infrastructure
 * - Enables port/adapter pattern for SMS integration
 */
export interface SMSServiceAdapterPort extends ExternalMessageServicePort {
  /**
   * Send an SMS message
   */
  sendSMS(to: string, message: string): Promise<boolean>;

  /**
   * Check SMS delivery status
   */
  getSMSStatus(messageId: string): Promise<'sent' | 'delivered' | 'failed' | 'queued'>;
}

/**
 * MessagingAdapterPort Interface
 * 
 * Architectural Intent:
 * - Aggregates all external messaging service adapters
 * - Provides a unified interface for all messaging channels
 * - Enables channel-agnostic message routing
 */
export interface MessagingAdapterPort {
  /**
   * Send a message through the appropriate external channel
   */
  sendToChannel(message: Message, channelType: string, recipient: string): Promise<boolean>;

  /**
   * Receive messages from all connected channels
   */
  receiveFromAllChannels(): Promise<Message[]>;

  /**
   * Get channel availability status
   */
  getChannelStatus(channelType: string): Promise<{ status: string; lastError?: string }>;

  /**
   * Get all connected channels
   */
  getConnectedChannels(): Promise<string[]>;
}