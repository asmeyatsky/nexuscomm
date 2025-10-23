import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { AppError } from '@middleware/errorHandler';
import { MessageService } from './MessageService';
import { ConversationService } from './ConversationService';

export class EmailProcessingService {
  private messageService: MessageService;
  private conversationService: ConversationService;

  constructor() {
    this.messageService = new MessageService();
    this.conversationService = new ConversationService();
  }

  /**
   * Process an incoming email and convert it to a message
   */
  async processEmailMessage(
    userId: string,
    conversationId: string,
    emailData: {
      from: string;
      to: string;
      subject: string;
      body: string;
      htmlBody?: string;
      headers?: Record<string, any>;
    }
  ): Promise<Message> {
    // Validate inputs
    if (!emailData.body) {
      throw new AppError(400, 'Email body is required', 'EMAIL_BODY_REQUIRED');
    }

    // Get conversation details
    const conversation = await this.conversationService.getConversation(conversationId, userId);
    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    // Extract the reply content from the email body (remove quotes, signatures, etc.)
    const replyContent = this.extractEmailReplyContent(emailData.body);

    // Create message
    return await this.messageService.createMessage(userId, {
      conversationId,
      content: replyContent,
      channelType: 'email',
      direction: 'outbound',
      senderExternalId: userId,
      senderName: 'User', // Will be updated with actual user name
      externalId: `email-${Date.now()}`,
      mediaUrls: [], // No media attached initially
      metadata: {
        source: 'email',
        originalSubject: emailData.subject,
        originalFrom: emailData.from,
        originalTo: emailData.to,
        originalBody: emailData.body,
        headers: emailData.headers,
      }
    });
  }

  /**
   * Process an email response for sending
   */
  async processEmailResponse(
    userId: string,
    conversationId: string,
    emailResponse: string,
    options?: {
      targetPlatform?: string;
      mediaUrls?: string[];
    }
  ): Promise<Message> {
    // Validate inputs
    if (!emailResponse.trim()) {
      throw new AppError(400, 'Email response is required', 'EMAIL_RESPONSE_REQUIRED');
    }

    // Get conversation details
    const conversation = await this.conversationService.getConversation(conversationId, userId);
    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    // Process the email response (remove quotes, signatures, etc.)
    const processedContent = this.removeEmailQuotes(emailResponse);

    // If a specific platform was requested, use it
    if (options?.targetPlatform) {
      return await this.messageService.createMessage(userId, {
        conversationId,
        content: processedContent,
        channelType: options.targetPlatform,
        direction: 'outbound',
        senderExternalId: userId,
        senderName: 'User', // Will be updated with actual user name
        externalId: `email-response-${Date.now()}`,
        mediaUrls: options.mediaUrls || [],
        metadata: {
          source: 'email-response',
          originalResponse: emailResponse,
        }
      });
    }

    // Otherwise, automatically select the best platform
    const bestPlatform = await this.selectBestPlatformForConversation(conversation, userId);
    
    return await this.messageService.createMessage(userId, {
      conversationId,
      content: processedContent,
      channelType: bestPlatform,
      direction: 'outbound',
      senderExternalId: userId,
      senderName: 'User', // Will be updated with actual user name
      externalId: `email-response-${Date.now()}`,
      mediaUrls: options.mediaUrls || [],
      metadata: {
        source: 'email-response',
        originalResponse: emailResponse,
        selectedPlatform: bestPlatform
      }
    });
  }

  /**
   * Select the best platform for a conversation based on available accounts and conversation channels
   */
  private async selectBestPlatformForConversation(conversation: Conversation, userId: string): Promise<string> {
    // Get user's connected accounts
    const { accounts } = await this.conversationService.getAccountService().getAccounts(userId);
    const activeAccounts = accounts.filter(a => a.isActive);

    // Priority order for platforms
    const platformPriority = ['email', 'whatsapp', 'sms', 'instagram_dm', 'linkedin_dm', 'telegram', 'slack'];

    // Get conversation's active channels
    const conversationChannels = conversation.channels || [];

    // Find the highest priority channel that we have an account for
    for (const priorityChannel of platformPriority) {
      if (conversationChannels.includes(priorityChannel)) {
        const matchingAccount = activeAccounts.find(acc => acc.channelType === priorityChannel);
        if (matchingAccount) {
          return priorityChannel;
        }
      }
    }

    // If no matching channels, return the first available account's channel
    if (activeAccounts.length > 0) {
      return activeAccounts[0].channelType;
    }

    // Fallback to the first channel in the conversation
    if (conversationChannels.length > 0) {
      return conversationChannels[0];
    }

    // Default to email if no options available
    return 'email';
  }

  /**
   * Extract reply content from an email, removing quotes and signatures
   */
  private extractEmailReplyContent(emailBody: string): string {
    // Remove common email reply headers and quoted text
    const cleanedContent = this.removeEmailQuotes(emailBody);
    
    // Remove common signatures
    const withoutSignature = this.removeSignature(cleanedContent);
    
    return withoutSignature.trim();
  }

  /**
   * Remove quoted text from email replies
   */
  private removeEmailQuotes(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    
    let inQuote = false;
    
    for (const line of lines) {
      // Check for common reply indicators
      if (line.trim().match(/^On.*wrote:$/)) {
        inQuote = true;
        continue;
      }
      
      // Check for quote markers
      if (line.trim().startsWith('>')) {
        inQuote = true;
        continue;
      }
      
      // Check for common email header lines
      if (
        line.trim().toLowerCase().startsWith('from:') ||
        line.trim().toLowerCase().startsWith('sent:') ||
        line.trim().toLowerCase().startsWith('to:') ||
        line.trim().toLowerCase().startsWith('subject:') ||
        line.trim().toLowerCase().startsWith('date:')
      ) {
        inQuote = true;
        continue;
      }
      
      // If we're in a quote block and encounter a non-quote line that's not empty,
      // check if it's a continuation of the quote or the user's reply
      if (inQuote && line.trim() !== '') {
        // If the line doesn't start with quote markers and is not a header, it might be the reply
        if (!line.trim().startsWith('>')) {
          inQuote = false;
        }
      }
      
      if (!inQuote) {
        result.push(line);
      }
    }
    
    return result.join('\n');
  }

  /**
   * Remove common email signatures
   */
  private removeSignature(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    
    // Look for signature delimiters like "-- " or "-----"
    let signatureStart = -1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      
      if (line.trim() === '--' || line.trim().startsWith('-----')) {
        signatureStart = i;
        break;
      }
      
      // If we find a line with just the separator, it's likely the start of the signature
      if (line.trim() === '-- ') {
        signatureStart = i;
        break;
      }
    }
    
    if (signatureStart !== -1) {
      // Only keep lines before the signature
      for (let i = 0; i < signatureStart; i++) {
        result.push(lines[i]);
      }
    } else {
      // If no signature delimiter found, just return the content
      return content;
    }
    
    return result.join('\n');
  }
}