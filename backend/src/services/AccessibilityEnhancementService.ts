import { AppDataSource } from '@config/database';
import { User } from '@models/User';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { AppError } from '@middleware/errorHandler';

// Define accessibility interfaces
export interface AccessibilitySettings {
  id: string;
  userId: string;
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  largeTextMode: boolean;
  voiceNavigationEnabled: boolean;
  voiceCommands: string[]; // Custom voice commands
  hapticFeedback: boolean;
  audioDescription: boolean; // For media content
  keyboardNavigation: boolean;
  reduceMotion: boolean; // Reduce animations
  captionSettings: {
    fontSize: number;
    fontFamily: string;
    backgroundColor: string;
    textColor: string;
    enabled: boolean;
  };
  theme: 'light' | 'dark' | 'high_contrast' | 'custom';
  customTheme?: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceCommand {
  id: string;
  userId: string;
  command: string; // The voice command phrase
  action: string; // The action to perform (e.g., 'open_conversation', 'reply_message', 'create_scheduled_message')
  parameters: string[]; // Expected parameters
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessibilityInsight {
  userId: string;
  usageMetrics: {
    voiceNavigationTime: number; // Time spent using voice navigation (in minutes)
    screenReaderUsage: number; // Time spent with screen reader (in minutes)
    keyboardNavigation: number; // Time spent using keyboard navigation
  };
  accessibilityScore: number; // 0-100 scale
  recommendations: string[];
  createdAt: Date;
}

export interface KeyboardShortcut {
  id: string;
  userId: string;
  action: string; // The action the shortcut performs
  keys: string[]; // The key combination (e.g., ['Control', 'Enter'])
  description: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessibilityFeedback {
  id: string;
  userId: string;
  feedbackType: 'bug' | 'suggestion' | 'praise' | 'difficulty';
  category: 'voice_navigation' | 'screen_reader' | 'keyboard' | 'visual' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AccessibilityEnhancementService {
  private userRepository = AppDataSource.getRepository(User);
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);

  constructor() {
    // Initialize accessibility enhancement service
  }

  /**
   * Get or create accessibility settings for a user
   */
  async getAccessibilitySettings(userId: string): Promise<AccessibilitySettings> {
    // In a real implementation, this would fetch from the database
    // For now, return default settings
    return {
      id: `accessibility-${userId}`,
      userId,
      screenReaderEnabled: false,
      highContrastMode: false,
      largeTextMode: false,
      voiceNavigationEnabled: false,
      voiceCommands: ['reply to last message', 'open next conversation', 'send message'],
      hapticFeedback: true,
      audioDescription: false,
      keyboardNavigation: true,
      reduceMotion: false,
      captionSettings: {
        fontSize: 16,
        fontFamily: 'system',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        enabled: true
      },
      theme: 'light',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Update accessibility settings for a user
   */
  async updateAccessibilitySettings(
    userId: string,
    updates: Partial<AccessibilitySettings>
  ): Promise<AccessibilitySettings> {
    const currentSettings = await this.getAccessibilitySettings(userId);
    
    // Apply updates
    Object.assign(currentSettings, updates, { updatedAt: new Date() });
    
    // In a real implementation, this would update the database
    console.log('Updated accessibility settings:', currentSettings);

    return currentSettings;
  }

  /**
   * Process a voice command
   */
  async processVoiceCommand(userId: string, command: string): Promise<{
    success: boolean;
    actionTaken: string;
    parameters: string[];
    error?: string;
  }> {
    // In a real implementation, this would use NLP to understand the command
    // and execute the appropriate action
    
    // For now, we'll implement some basic command recognition
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('reply') || lowerCommand.includes('respond')) {
      // Extract message content if provided
      const match = lowerCommand.match(/(reply|respond) to.*?(?:with|say)?\s*(.+)/i);
      const messageContent = match ? match[2] : 'Voice command reply';
      
      return {
        success: true,
        actionTaken: 'send_message',
        parameters: [messageContent]
      };
    } else if (lowerCommand.includes('open') && lowerCommand.includes('conversation')) {
      // Extract conversation name if provided
      const match = lowerCommand.match(/open conversation (?:with|to)?\s*([a-zA-Z\s]+)/i);
      const contactName = match ? match[1] : '';
      
      return {
        success: true,
        actionTaken: 'open_conversation',
        parameters: [contactName]
      };
    } else if (lowerCommand.includes('next') && lowerCommand.includes('conversation')) {
      return {
        success: true,
        actionTaken: 'open_next_conversation',
        parameters: []
      };
    } else if (lowerCommand.includes('previous') && lowerCommand.includes('conversation')) {
      return {
        success: true,
        actionTaken: 'open_previous_conversation',
        parameters: []
      };
    } else if (lowerCommand.includes('read') && lowerCommand.includes('messages')) {
      return {
        success: true,
        actionTaken: 'read_last_messages',
        parameters: []
      };
    } else {
      return {
        success: false,
        actionTaken: 'unknown',
        parameters: [],
        error: 'Unknown voice command'
      };
    }
  }

  /**
   * Generate text for screen readers for a message
   */
  generateScreenReaderTextForMessage(message: Message, includeMetadata: boolean = true): string {
    let text = '';
    
    if (message.direction === 'inbound') {
      text += `Message from ${message.senderName}: `;
    } else {
      text += 'Your message: ';
    }
    
    text += `"${message.content}"`;
    
    if (includeMetadata) {
      const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      text += `. Sent at ${time}.`;
      
      if (message.direction === 'outbound') {
        text += ` Status: ${message.status}.`;
      }
      
      if (message.mediaUrls && message.mediaUrls.length > 0) {
        text += ` Contains ${message.mediaUrls.length} media attachment${message.mediaUrls.length > 1 ? 's' : ''}.`;
      }
    }
    
    return text;
  }

  /**
   * Generate text for screen readers for a conversation
   */
  generateScreenReaderTextForConversation(conversation: Conversation, unreadCount: number): string {
    let text = '';
    
    // List participant names
    text += `Conversation with ${conversation.participantNames.join(', ')}. `;
    
    // Unread count
    if (unreadCount > 0) {
      text += `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}. `;
    }
    
    // Last message preview
    if (conversation.lastMessage) {
      const direction = conversation.lastMessageDirection === 'inbound' ? 'Received' : 'Sent';
      const time = conversation.lastMessageTimestamp 
        ? new Date(conversation.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '';
      
      text += `${direction}: "${conversation.lastMessage}". ${time}.`;
    }
    
    return text;
  }

  /**
   * Create a custom voice command
   */
  async createVoiceCommand(
    userId: string,
    commandData: Omit<VoiceCommand, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<VoiceCommand> {
    const command: VoiceCommand = {
      id: `vc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...commandData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created voice command:', command);

    return command;
  }

  /**
   * Get all custom voice commands for a user
   */
  async getUserVoiceCommands(userId: string): Promise<VoiceCommand[]> {
    // In a real implementation, this would fetch from the database
    // For now, return default commands
    return [
      {
        id: `vc-${Date.now()}-1`,
        userId,
        command: 'reply quickly',
        action: 'quick_reply',
        parameters: ['message'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `vc-${Date.now()}-2`,
        userId,
        command: 'next conversation',
        action: 'open_next_conversation',
        parameters: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Create a keyboard shortcut
   */
  async createKeyboardShortcut(
    userId: string,
    shortcutData: Omit<KeyboardShortcut, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<KeyboardShortcut> {
    const shortcut: KeyboardShortcut = {
      id: `ks-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...shortcutData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created keyboard shortcut:', shortcut);

    return shortcut;
  }

  /**
   * Get all keyboard shortcuts for a user
   */
  async getUserKeyboardShortcuts(userId: string): Promise<KeyboardShortcut[]> {
    // In a real implementation, this would fetch from the database
    // For now, return default shortcuts
    return [
      {
        id: `ks-${Date.now()}-1`,
        userId,
        action: 'open_next_conversation',
        keys: ['Control', 'ArrowRight'],
        description: 'Navigate to next conversation',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `ks-${Date.now()}-2`,
        userId,
        action: 'open_previous_conversation',
        keys: ['Control', 'ArrowLeft'],
        description: 'Navigate to previous conversation',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `ks-${Date.now()}-3`,
        userId,
        action: 'focus_message_input',
        keys: ['Control', 'Shift', 'M'],
        description: 'Focus on message input field',
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Record accessibility feedback
   */
  async recordAccessibilityFeedback(
    userId: string,
    feedbackData: Omit<AccessibilityFeedback, 'id' | 'userId' | 'resolved' | 'createdAt' | 'updatedAt'>
  ): Promise<AccessibilityFeedback> {
    const feedback: AccessibilityFeedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...feedbackData,
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Recorded accessibility feedback:', feedback);

    return feedback;
  }

  /**
   * Get accessibility insights for a user
   */
  async getAccessibilityInsights(userId: string): Promise<AccessibilityInsight> {
    // In a real implementation, this would analyze usage data
    // For now, return mock insights
    return {
      userId,
      usageMetrics: {
        voiceNavigationTime: 45, // 45 minutes
        screenReaderUsage: 120, // 2 hours
        keyboardNavigation: 300 // 5 hours
      },
      accessibilityScore: 85, // 85/100
      recommendations: [
        'Increase use of voice commands for faster navigation',
        'Try enabling haptic feedback for better tactile response',
        'Adjust caption settings for better readability'
      ],
      createdAt: new Date()
    };
  }

  /**
   * Get text alternatives for media content
   */
  async getMediaTextAlternative(userId: string, mediaUrl: string): Promise<{
    altText: string;
    captions: string[];
    description: string;
  }> {
    // In a real implementation, this would use AI to analyze the media content
    // For now, return mock alternatives
    return {
      altText: 'Descriptive text for the image/video',
      captions: [
        'This is the first caption for the media content',
        'This is the second caption for the media content'
      ],
      description: 'A detailed description of the media content for screen reader users'
    };
  }

  /**
   * Optimize UI elements for accessibility
   */
  async getAccessibleUIConfiguration(userId: string): Promise<{
    fontSize: number;
    contrastLevel: 'normal' | 'high' | 'maximum';
    colorScheme: 'light' | 'dark' | 'custom';
    animationReduction: boolean;
    focusIndicator: boolean;
    touchTargetSize: 'normal' | 'large';
  }> {
    const settings = await this.getAccessibilitySettings(userId);
    
    return {
      fontSize: settings.largeTextMode ? 18 : 16,
      contrastLevel: settings.highContrastMode ? 'high' : 'normal',
      colorScheme: settings.theme,
      animationReduction: settings.reduceMotion,
      focusIndicator: true, // Always show focus indicators for keyboard navigation
      touchTargetSize: 'large' // Larger touch targets for easier interaction
    };
  }

  /**
   * Validate accessibility of a UI component
   */
  async validateComponentAccessibility(componentData: {
    type: string; // button, input, link, etc.
    label?: string;
    description?: string;
    colorContrast?: { foreground: string; background: string };
    size?: { width: number; height: number };
  }): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for proper labeling
    if (!componentData.label && !componentData.description) {
      issues.push('Component missing accessible label or description');
      suggestions.push('Add an accessible label or description for screen readers');
    }

    // Check color contrast if colors provided
    if (componentData.colorContrast) {
      const contrastRatio = this.calculateColorContrast(
        componentData.colorContrast.foreground,
        componentData.colorContrast.background
      );
      
      if (contrastRatio < 4.5) {
        issues.push(`Insufficient color contrast: ${contrastRatio.toFixed(2)}:1 (minimum 4.5:1 required)`);
        suggestions.push('Increase contrast between text and background colors');
      }
    }

    // Check touch target size
    if (componentData.size) {
      const minSize = 44; // Minimum recommended touch target size in pixels
      if (componentData.size.width < minSize || componentData.size.height < minSize) {
        issues.push(`Touch target too small: ${componentData.size.width}x${componentData.size.height}px (minimum ${minSize}px recommended)`);
        suggestions.push(`Increase touch target size to at least ${minSize}x${minSize}px`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Calculate color contrast ratio (for accessibility validation)
   */
  private calculateColorContrast(color1: string, color2: string): number {
    // Convert hex colors to RGB
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    // Calculate relative luminance
    const l1 = this.relativeLuminance(rgb1);
    const l2 = this.relativeLuminance(rgb2);
    
    // Calculate contrast ratio
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  /**
   * Calculate relative luminance of a color
   */
  private relativeLuminance(rgb: { r: number; g: number; b: number }): number {
    // Normalize RGB values to 0-1 range
    let { r, g, b } = rgb;
    r /= 255;
    g /= 255;
    b /= 255;
    
    // Apply sRGB transformation
    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    // Calculate relative luminance
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}