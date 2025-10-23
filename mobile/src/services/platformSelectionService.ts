import { ChannelType, Conversation, Account } from '@types/index';

export class PlatformSelectionService {
  private static instance: PlatformSelectionService;

  private constructor() {}

  public static getInstance(): PlatformSelectionService {
    if (!PlatformSelectionService.instance) {
      PlatformSelectionService.instance = new PlatformSelectionService();
    }
    return PlatformSelectionService.instance;
  }

  /**
   * Automatically select the best platform for sending a message based on:
   * 1. Conversation's existing channels
   * 2. Available accounts
   * 3. Message content type
   * 4. Priority (WhatsApp > Email > SMS > Instagram DM > LinkedIn DM)
   */
  public selectBestPlatform(
    conversation: Conversation,
    availableAccounts: Account[],
    messageContent: string
  ): ChannelType | null {
    if (!conversation || !availableAccounts) {
      return null;
    }

    // Priority order for platforms
    const platformPriority: ChannelType[] = [
      'whatsapp',
      'email',
      'sms',
      'instagram_dm',
      'linkedin_dm',
      'telegram',
      'slack'
    ];

    // Get conversation's active channels
    const activeChannels = [...conversation.channels].sort((a, b) => {
      const priorityA = platformPriority.indexOf(a);
      const priorityB = platformPriority.indexOf(b);
      return priorityA - priorityB;
    });

    // Get connected account types
    const connectedAccountTypes = availableAccounts
      .filter(account => account.isActive)
      .map(account => account.channelType);

    // Find the highest priority channel that we have an account for
    for (const channel of activeChannels) {
      if (connectedAccountTypes.includes(channel)) {
        return channel;
      }
    }

    // If no accounts match conversation channels, use highest priority available account
    for (const priorityChannel of platformPriority) {
      if (connectedAccountTypes.includes(priorityChannel)) {
        return priorityChannel;
      }
    }

    // If no connected accounts, return null
    return null;
  }

  /**
   * Determine platform based on message content (e.g., email format in message)
   */
  public inferPlatformFromContent(messageContent: string): ChannelType | null {
    // Check if message contains email address
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    if (emailRegex.test(messageContent)) {
      return 'email';
    }

    // Check if message contains phone number pattern
    const phoneRegex = /[\+]?[1-9][\d\s\-\(\)]{7,}\b/;
    if (phoneRegex.test(messageContent)) {
      return 'sms';
    }

    // Check if message mentions specific platform
    const contentLower = messageContent.toLowerCase();
    if (contentLower.includes('whatsapp')) {
      return 'whatsapp';
    } else if (contentLower.includes('instagram')) {
      return 'instagram_dm';
    } else if (contentLower.includes('linkedin')) {
      return 'linkedin_dm';
    }

    return null;
  }

  /**
   * Check if user has account for specific channel type
   */
  public hasAccountForChannel(
    availableAccounts: Account[],
    channelType: ChannelType
  ): boolean {
    return availableAccounts.some(
      account => account.channelType === channelType && account.isActive
    );
  }

  /**
   * Get all available platforms for current user
   */
  public getAvailablePlatforms(availableAccounts: Account[]): ChannelType[] {
    return availableAccounts
      .filter(account => account.isActive)
      .map(account => account.channelType);
  }

  /**
   * Format message content based on platform requirements
   */
  public formatMessageForPlatform(
    content: string,
    platform: ChannelType
  ): string {
    // Truncate if necessary based on platform limits
    switch (platform) {
      case 'sms':
        // SMS has 160 character limit for standard messages
        return content.substring(0, 160);
      case 'whatsapp':
        // WhatsApp supports up to 4096 characters
        return content.substring(0, 4096);
      case 'email':
        // Email supports longer content
        return content;
      case 'instagram_dm':
        // Instagram DM has around 2200 character limit
        return content.substring(0, 2200);
      case 'linkedin_dm':
        // LinkedIn DM has around 2000 character limit
        return content.substring(0, 2000);
      default:
        return content.substring(0, 1000); // Default limit
    }
  }
}

export const platformSelectionService = PlatformSelectionService.getInstance();