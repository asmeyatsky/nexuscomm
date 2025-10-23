import { apiService } from './api';
import { platformSelectionService } from './platformSelectionService';
import { emailParsingService } from './emailParsingService';
import { Conversation, Account, ChannelType } from '@types/index';

export class MessageSendingService {
  private static instance: MessageSendingService;

  private constructor() {}

  public static getInstance(): MessageSendingService {
    if (!MessageSendingService.instance) {
      MessageSendingService.instance = new MessageSendingService();
    }
    return MessageSendingService.instance;
  }

  /**
   * Send message automatically selecting the best platform
   */
  async sendAutoPlatformMessage(
    conversationId: string,
    content: string,
    conversation: Conversation,
    accounts: Account[],
    mediaUrls?: string[]
  ) {
    // Format the content for the selected platform
    const formattedContent = content;

    // Send the message with auto-platform selection
    return await apiService.sendMessage(
      conversationId,
      formattedContent,
      mediaUrls,
      true // autoSelectPlatform
    );
  }

  /**
   * Send message to specific platform
   */
  async sendMessageToPlatform(
    conversationId: string,
    content: string,
    platform: ChannelType,
    mediaUrls?: string[]
  ) {
    // Format the content for the specified platform
    const formattedContent = platformSelectionService.formatMessageForPlatform(
      content,
      platform
    );

    // Send the message
    return await apiService.sendMessage(
      conversationId,
      formattedContent,
      mediaUrls
    );
  }

  /**
   * Handle different input methods (voice, text, email)
   */
  async processAndSendMessage({
    conversationId,
    content,
    inputMethod,
    conversation,
    accounts,
    mediaUrls
  }: {
    conversationId: string;
    content: string;
    inputMethod: 'voice' | 'text' | 'email';
    conversation: Conversation;
    accounts: Account[];
    mediaUrls?: string[];
  }) {
    // Based on input method, potentially process the content differently
    let processedContent = content;

    // For voice input, we might want to clean up the transcription
    if (inputMethod === 'voice') {
      processedContent = this.processVoiceTranscription(content);
      
      // Use the voice-specific API endpoint
      return await apiService.sendVoiceMessage(
        conversationId,
        processedContent,
        undefined, // targetPlatform - let backend auto-select
        mediaUrls
      );
    }
    
    // For email input, we might want to extract just the relevant reply content
    if (inputMethod === 'email') {
      processedContent = this.processEmailContent(content);
      
      // Use the email-specific API endpoint
      return await apiService.sendEmailResponse(
        conversationId,
        processedContent,
        undefined, // targetPlatform - let backend auto-select
        mediaUrls
      );
    }

    // For text input, use auto-platform selection
    return await this.sendAutoPlatformMessage(
      conversationId,
      processedContent,
      conversation,
      accounts,
      mediaUrls
    );
  }

  /**
   * Process voice transcription for better messaging
   */
  private processVoiceTranscription(transcription: string): string {
    // Clean up the voice transcription
    let cleaned = transcription.trim();
    
    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    // Handle common voice recognition issues
    cleaned = cleaned.replace(/\bim\b/gi, "I'm");
    cleaned = cleaned.replace(/\byoure\b/gi, "you're");
    cleaned = cleaned.replace(/\bhes\b/gi, "he's");
    cleaned = cleaned.replace(/\bshes\b/gi, "she's");
    
    // Remove trailing punctuation if it seems like a sentence ended
    if (cleaned.endsWith(',') || cleaned.endsWith(';')) {
      cleaned = cleaned.slice(0, -1);
    }
    
    return cleaned;
  }

  /**
   * Process email content to extract relevant message
   */
  private processEmailContent(emailContent: string): string {
    // Remove common email reply headers
    const splitContent = emailContent.split('\n');
    const relevantLines = [];
    
    for (const line of splitContent) {
      // Skip quote lines (starting with >)
      if (line.trim().startsWith('>')) {
        continue;
      }
      
      // Skip email header lines
      if (line.trim().match(/^On.*wrote:$/)) {
        continue;
      }
      
      // Skip "From:" lines
      if (line.trim().toLowerCase().startsWith('from:')) {
        continue;
      }
      
      // Skip "Sent:" lines
      if (line.trim().toLowerCase().startsWith('sent:')) {
        continue;
      }
      
      // Skip "To:" lines
      if (line.trim().toLowerCase().startsWith('to:')) {
        continue;
      }
      
      relevantLines.push(line);
    }
    
    return relevantLines.join('\n').trim();
  }
}

export const messageSendingService = MessageSendingService.getInstance();