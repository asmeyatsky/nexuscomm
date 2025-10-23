import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { User } from '@models/User';
import { AppError } from '@middleware/errorHandler';
import { Notification } from '@models/Notification'; // Assuming notification model exists

// Define notification interfaces
export interface NotificationPreference {
  id: string;
  userId: string;
  channelType: string; // 'whatsapp', 'email', 'sms', etc.
  notificationType: string; // 'message', 'mention', 'reaction', etc.
  priority: 'high' | 'medium' | 'low';
  deliveryMethod: 'push' | 'email' | 'sms' | 'in_app';
  delay: number; // Delay in minutes for non-urgent notifications
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntelligentNotification {
  id: string;
  userId: string;
  conversationId?: string;
  messageIds?: string[];
  title: string;
  body: string;
  type: 'message' | 'mention' | 'reaction' | 'contact_request' | 'system';
  priority: 'high' | 'medium' | 'low';
  deliveryMethod: 'push' | 'email' | 'sms' | 'in_app';
  scheduledAt: Date;
  sentAt?: Date;
  readAt?: Date;
  isRead: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRule {
  id: string;
  userId: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
  actions: Array<{
    type: 'send_notification' | 'delay_notification' | 'suppress_notification';
    config: Record<string, any>;
  }>;
  priority: number; // Lower numbers execute first
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationInsight {
  userId: string;
  dailyNotificationCount: number;
  notificationDensity: number; // Notifications per hour
  responseRate: number; // Percentage of notifications that lead to engagement
  preferredTime: string; // Best time for notifications (HH:MM)
  notificationTypeDistribution: Record<string, number>;
  distractionLevel: 'low' | 'medium' | 'high'; // Based on notification frequency
  createdAt: Date;
}

export class IntelligentNotificationService {
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);
  private userRepository = AppDataSource.getRepository(User);

  constructor() {
    // Initialize notification service
  }

  /**
   * Create a notification preference
   */
  async createNotificationPreference(
    userId: string,
    preferenceData: Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationPreference> {
    const preference: NotificationPreference = {
      id: `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...preferenceData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created notification preference:', preference);

    return preference;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    channelType: string,
    notificationType: string,
    updates: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    // In a real implementation, this would update the database
    // For now, return a mock updated preference
    return {
      id: `pref-${Date.now()}`,
      userId,
      channelType,
      notificationType,
      priority: 'medium',
      deliveryMethod: 'push',
      delay: 5,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        timezone: 'UTC'
      },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...updates
    };
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    // In a real implementation, this would fetch from the database
    // For now, return default preferences
    return [
      {
        id: `pref-${Date.now()}-1`,
        userId,
        channelType: 'whatsapp',
        notificationType: 'message',
        priority: 'high',
        deliveryMethod: 'push',
        delay: 0,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00',
          timezone: 'UTC'
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `pref-${Date.now()}-2`,
        userId,
        channelType: 'email',
        notificationType: 'message',
        priority: 'medium',
        deliveryMethod: 'email',
        delay: 15,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00',
          timezone: 'UTC'
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Create an intelligent notification
   */
  async createIntelligentNotification(
    userId: string,
    notificationData: Omit<IntelligentNotification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isRead'>
  ): Promise<IntelligentNotification> {
    // Apply intelligent logic to determine optimal delivery
    const optimizedNotification = await this.optimizeNotificationDelivery(
      userId,
      notificationData
    );

    const notification: IntelligentNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...optimizedNotification,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    // and potentially sent to a notification service
    console.log('Created intelligent notification:', notification);

    return notification;
  }

  /**
   * Optimize notification delivery based on user patterns
   */
  private async optimizeNotificationDelivery(
    userId: string,
    notificationData: Omit<IntelligentNotification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isRead'>
  ): Promise<Omit<IntelligentNotification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isRead' | 'isRead'>> {
    // Get user's notification preferences
    const preferences = await this.getNotificationPreferences(userId);
    
    // Find matching preference based on type and channel
    const matchingPreference = preferences.find(
      p => p.channelType === notificationData.metadata?.channelType &&
           p.notificationType === notificationData.type
    ) || preferences[0]; // Default to first preference if none match

    if (!matchingPreference?.enabled) {
      // If preferences disable this notification, return with delay of 24 hours to effectively suppress it
      return {
        ...notificationData,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        deliveryMethod: 'in_app' // Lowest priority delivery method
      };
    }

    // Calculate optimal delivery time based on quiet hours and priority
    let scheduledAt = new Date();
    
    if (matchingPreference.quietHours?.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const quietStart = this.timeStringToMinutes(matchingPreference.quietHours.start);
      const quietEnd = this.timeStringToMinutes(matchingPreference.quietHours.end);
      
      if (currentTime >= quietStart && currentTime < quietEnd) {
        // We're in quiet hours, schedule for after quiet hours
        const [endHour, endMinute] = matchingPreference.quietHours.end.split(':').map(Number);
        scheduledAt = new Date(now);
        scheduledAt.setHours(endHour, endMinute, 0, 0);
        
        // If the quiet end time has passed today, schedule for tomorrow
        if (scheduledAt <= now) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }
      }
    }

    // Apply delay based on priority and preferences
    if (matchingPreference.delay > 0 && notificationData.priority !== 'high') {
      scheduledAt = new Date(scheduledAt.getTime() + matchingPreference.delay * 60 * 1000);
    }

    return {
      ...notificationData,
      deliveryMethod: matchingPreference.deliveryMethod,
      scheduledAt
    };
  }

  /**
   * Create a notification rule for intelligent handling
   */
  async createNotificationRule(
    userId: string,
    ruleData: Omit<NotificationRule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationRule> {
    const rule: NotificationRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...ruleData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created notification rule:', rule);

    return rule;
  }

  /**
   * Process incoming message to determine if and how to notify
   */
  async processIncomingMessageForNotification(
    userId: string,
    message: Message,
    conversation: Conversation
  ): Promise<IntelligentNotification | null> {
    // Apply notification rules to determine if notification should be sent
    const shouldNotify = await this.shouldNotifyForMessage(userId, message, conversation);
    
    if (!shouldNotify) {
      return null;
    }

    // Create notification based on message content
    const notification: Omit<IntelligentNotification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isRead'> = {
      title: `New message from ${message.senderName}`,
      body: this.truncateMessage(message.content, 50),
      type: 'message',
      priority: this.determineMessagePriority(message, conversation),
      scheduledAt: new Date(),
      metadata: {
        conversationId: message.conversationId,
        messageId: message.id,
        channelType: message.channelType,
        senderId: message.senderExternalId
      }
    };

    return await this.createIntelligentNotification(userId, notification);
  }

  /**
   * Determine if a notification should be sent for a message
   */
  private async shouldNotifyForMessage(
    userId: string,
    message: Message,
    conversation: Conversation
  ): Promise<boolean> {
    // Apply notification rules
    const rules = await this.getNotificationRules(userId);
    
    // Sort rules by priority (lower number = higher priority)
    const sortedRules = rules.sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      if (!rule.isEnabled) continue;
      
      let conditionsMet = true;
      
      for (const condition of rule.conditions) {
        conditionsMet = conditionsMet && this.evaluateCondition(condition, message, conversation);
        
        if (!conditionsMet) {
          break;
        }
      }
      
      if (conditionsMet) {
        for (const action of rule.actions) {
          if (action.type === 'suppress_notification') {
            return false; // Explicitly suppress this notification
          } else if (action.type === 'send_notification') {
            return true; // Explicitly approve this notification
          }
          // Delay actions would be handled separately
        }
      }
    }
    
    // Default behavior: send notification for direct messages, not for group messages if user is mentioned
    if (conversation.participantIds.length > 2) { // Group conversation
      // Only notify if user is mentioned in group message
      return this.isUserMentioned(userId, message);
    }
    
    return true; // Personal conversation, always notify
  }

  /**
   * Evaluate a single condition against a message and conversation
   */
  private evaluateCondition(
    condition: NotificationRule['conditions'][0],
    message: Message,
    conversation: Conversation
  ): boolean {
    let value: any;
    
    switch (condition.field) {
      case 'sender':
        value = message.senderExternalId;
        break;
      case 'channel':
        value = message.channelType;
        break;
      case 'message_length':
        value = message.content.length;
        break;
      case 'conversation_participants_count':
        value = conversation.participantIds.length;
        break;
      case 'message_contains':
        value = message.content.toLowerCase();
        condition.value = condition.value.toLowerCase();
        break;
      default:
        return false;
    }
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);
      case 'not_contains':
        return typeof value === 'string' && !value.includes(condition.value);
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      default:
        return false;
    }
  }

  /**
   * Get notification rules for a user
   */
  async getNotificationRules(userId: string): Promise<NotificationRule[]> {
    // In a real implementation, this would fetch from the database
    // For now, return default rules
    return [
      {
        id: `rule-${Date.now()}-1`,
        userId,
        name: 'Do Not Disturb',
        description: 'Suppress notifications during quiet hours',
        conditions: [
          {
            field: 'time',
            operator: 'greater_than',
            value: '22:00'
          }
        ],
        actions: [
          {
            type: 'suppress_notification',
            config: {}
          }
        ],
        priority: 10,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Determine the priority of a message
   */
  private determineMessagePriority(message: Message, conversation: Conversation): 'high' | 'medium' | 'low' {
    // High priority: @mentions, urgent keywords, from VIP contacts
    if (this.isUserMentioned(message.userId, message)) {
      return 'high';
    }
    
    const urgentKeywords = ['urgent', 'asap', 'important', 'immediately', 'critical'];
    if (urgentKeywords.some(keyword => 
      message.content.toLowerCase().includes(keyword)
    )) {
      return 'high';
    }
    
    // Medium priority: regular messages
    return 'medium';
  }

  /**
   * Check if a user is mentioned in a message
   */
  private isUserMentioned(userId: string, message: Message): boolean {
    // In a real implementation, this would check the message for user mentions
    // For now, return false
    return false;
  }

  /**
   * Truncate message content for notification preview
   */
  private truncateMessage(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Convert time string (HH:MM) to minutes from midnight
   */
  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get user's notification insights
   */
  async getNotificationInsights(userId: string): Promise<NotificationInsight> {
    // In a real implementation, this would analyze user's notification history
    // For now, return mock insights
    return {
      userId,
      dailyNotificationCount: 42,
      notificationDensity: 2.6, // Notifications per hour
      responseRate: 0.68, // 68% of notifications lead to engagement
      preferredTime: '09:30',
      notificationTypeDistribution: {
        'message': 32,
        'mention': 5,
        'reaction': 3,
        'contact_request': 2
      },
      distractionLevel: 'medium',
      createdAt: new Date()
    };
  }

  /**
   * Get pending notifications for a user
   */
  async getPendingNotifications(userId: string): Promise<IntelligentNotification[]> {
    // In a real implementation, this would fetch notifications from the database
    // For now, return mock data
    return [];
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<IntelligentNotification> {
    // In a real implementation, this would update the database
    // For now, return mock updated notification
    return {
      id: notificationId,
      userId,
      title: 'Mock Notification',
      body: 'Mock notification body',
      type: 'message',
      priority: 'medium',
      deliveryMethod: 'push',
      scheduledAt: new Date(),
      isRead: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as IntelligentNotification;
  }

  /**
   * Bulk send notifications based on user preferences
   */
  async sendBulkNotifications(userId: string, notifications: Omit<IntelligentNotification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isRead'>[]): Promise<IntelligentNotification[]> {
    const results: IntelligentNotification[] = [];
    
    for (const notification of notifications) {
      const optimized = await this.optimizeNotificationDelivery(userId, notification);
      const result = await this.createIntelligentNotification(userId, optimized);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Apply do-not-disturb logic
   */
  async isUserInDoNotDisturbMode(userId: string): Promise<boolean> {
    const preferences = await this.getNotificationPreferences(userId);
    
    // Check if any preference has quiet hours enabled and we're currently in them
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const pref of preferences) {
      if (pref.quietHours?.enabled) {
        const startMinutes = this.timeStringToMinutes(pref.quietHours.start);
        const endMinutes = this.timeStringToMinutes(pref.quietHours.end);
        
        if (startMinutes <= endMinutes) {
          // Same day quiet hours (e.g., 22:00-07:00 spans to next day)
          if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            return true;
          }
        } else {
          // Overnight quiet hours (e.g., 22:00-07:00)
          if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
}