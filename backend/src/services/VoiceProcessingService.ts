import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { AppError } from '@middleware/errorHandler';
import { MessageService } from './MessageService';
import { ConversationService } from './ConversationService';

export class VoiceProcessingService {
  private messageService: MessageService;
  private conversationService: ConversationService;

  constructor() {
    this.messageService = new MessageService();
    this.conversationService = new ConversationService();
  }

  /**
   * Process voice input and send to appropriate platform
   */
  async processVoiceMessage(
    userId: string,
    conversationId: string,
    voiceContent: string,
    options?: {
      targetPlatform?: string;
      mediaUrls?: string[];
    }
  ): Promise<Message> {
    // Validate inputs
    if (!voiceContent.trim()) {
      throw new AppError(400, 'Voice content is required', 'VOICE_CONTENT_REQUIRED');
    }

    // Get conversation details
    const conversation = await this.conversationService.getConversation(conversationId, userId);
    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    // Process the voice content (e.g., fix common transcription errors)
    const processedContent = this.processVoiceTranscription(voiceContent);

    // If a specific platform was requested, use it
    if (options?.targetPlatform) {
      return await this.messageService.createMessage(userId, {
        conversationId,
        content: processedContent,
        channelType: options.targetPlatform,
        direction: 'outbound',
        senderExternalId: userId,
        senderName: 'User', // Will be updated with actual user name
        externalId: `voice-${Date.now()}`,
        mediaUrls: options.mediaUrls || [],
        metadata: {
          source: 'voice',
          originalContent: voiceContent,
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
      externalId: `voice-${Date.now()}`,
      mediaUrls: options.mediaUrls || [],
      metadata: {
        source: 'voice',
        originalContent: voiceContent,
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
    const platformPriority = ['whatsapp', 'email', 'sms', 'instagram_dm', 'linkedin_dm', 'telegram', 'slack'];

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

    // Default to WhatsApp if no options available
    return 'whatsapp';
  }

  /**
   * Process voice transcription to improve quality
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
}