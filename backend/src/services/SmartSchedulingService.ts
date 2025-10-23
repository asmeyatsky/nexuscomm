import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { AppError } from '@middleware/errorHandler';
import { MessageService } from './MessageService';
import { ConversationService } from './ConversationService';
import Bull from 'bull';

export interface ScheduledMessage {
  id: string;
  userId: string;
  conversationId: string;
  content: string;
  scheduledAt: Date;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  channelType?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  description: string;
  trigger: 'after_time' | 'after_response' | 'keyword_detected' | 'contact_inactive';
  triggerValue: string; // Could be time interval, keyword, etc.
  action: 'send_message' | 'send_template' | 'tag_contact' | 'archive_conversation';
  actionValue: string; // The message content or template ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SmartSchedulingService {
  private messageService: MessageService;
  private conversationService: ConversationService;
  private scheduledMessageQueue: Bull.Queue;
  private automationRuleQueue: Bull.Queue;

  constructor() {
    this.messageService = new MessageService();
    this.conversationService = new ConversationService();
    
    // Initialize Bull queues for scheduled messages and automation rules
    this.scheduledMessageQueue = new Bull('scheduled-messages', {
      redis: process.env.REDIS_URL || { host: 'localhost', port: 6379 }
    });
    
    this.automationRuleQueue = new Bull('automation-rules', {
      redis: process.env.REDIS_URL || { host: 'localhost', port: 6379 }
    });
    
    // Process scheduled messages
    this.scheduledMessageQueue.process(this.processScheduledMessage.bind(this));
    
    // Process automation rules
    this.automationRuleQueue.process(this.processAutomationRule.bind(this));
  }

  /**
   * Schedule a message to be sent at a later time
   */
  async scheduleMessage(
    userId: string,
    conversationId: string,
    content: string,
    scheduledAt: Date,
    options?: {
      channelType?: string;
      templateId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ScheduledMessage> {
    // Verify conversation belongs to user
    const conversation = await this.conversationService.getConversation(conversationId, userId);
    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    // Create scheduled message record
    const scheduledMessage: ScheduledMessage = {
      id: `sched-${Date.now()}`,
      userId,
      conversationId,
      content,
      scheduledAt,
      status: 'scheduled',
      channelType: options?.channelType,
      metadata: options?.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to queue for processing at scheduled time
    await this.scheduledMessageQueue.add('send', scheduledMessage, {
      delay: scheduledAt.getTime() - Date.now()
    });

    return scheduledMessage;
  }

  /**
   * Process a scheduled message
   */
  private async processScheduledMessage(job: Bull.Job<ScheduledMessage>) {
    const { userId, conversationId, content, channelType, metadata } = job.data;
    
    try {
      // Send the message
      await this.messageService.createMessage(userId, {
        conversationId,
        content,
        channelType: channelType || 'whatsapp', // default to whatsapp
        direction: 'outbound',
        senderExternalId: userId,
        senderName: 'User',
        externalId: `sched-${job.data.id}`,
        externalThreadId: conversationId,
        metadata: metadata || {}
      });

      job.data.status = 'sent';
      job.data.updatedAt = new Date();
    } catch (error) {
      console.error('Error processing scheduled message:', error);
      job.data.status = 'failed';
      job.data.updatedAt = new Date();
    }
  }

  /**
   * Create an automation rule
   */
  async createAutomationRule(
    userId: string,
    ruleData: {
      name: string;
      description: string;
      trigger: AutomationRule['trigger'];
      triggerValue: string;
      action: AutomationRule['action'];
      actionValue: string;
    }
  ): Promise<AutomationRule> {
    const rule: AutomationRule = {
      id: `rule-${Date.now()}`,
      userId,
      name: ruleData.name,
      description: ruleData.description,
      trigger: ruleData.trigger,
      triggerValue: ruleData.triggerValue,
      action: ruleData.action,
      actionValue: ruleData.actionValue,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to queue to monitor for trigger conditions
    await this.automationRuleQueue.add('monitor', rule);

    return rule;
  }

  /**
   * Process an automation rule
   */
  private async processAutomationRule(job: Bull.Job<AutomationRule>) {
    const rule = job.data;
    
    if (!rule.isActive) {
      return; // Skip inactive rules
    }

    try {
      // This would typically involve:
      // 1. Monitoring for the trigger condition
      // 2. Executing the action when trigger is met
      
      // For now, we'll simulate the logic
      // In a real implementation, this would be more complex
      console.log(`Processing automation rule: ${rule.name}`);
      
      // Add more complex processing based on trigger type
      switch (rule.trigger) {
        case 'after_time':
          // Set up delayed processing
          break;
        case 'after_response':
          // Monitor for specific response patterns
          break;
        case 'keyword_detected':
          // Monitor for specific keywords
          break;
        case 'contact_inactive':
          // Monitor for inactive contacts
          break;
      }
    } catch (error) {
      console.error('Error processing automation rule:', error);
    }
  }

  /**
   * Get all scheduled messages for a user
   */
  async getScheduledMessages(userId: string): Promise<ScheduledMessage[]> {
    // In a real implementation, this would query a database table
    // For now, we'll return empty array
    return [];
  }

  /**
   * Cancel a scheduled message
   */
  async cancelScheduledMessage(scheduledMessageId: string, userId: string): Promise<void> {
    // In a real implementation, this would update the database
    // and remove the job from the queue
    console.log(`Cancelling scheduled message: ${scheduledMessageId}`);
  }

  /**
   * Get all automation rules for a user
   */
  async getAutomationRules(userId: string): Promise<AutomationRule[]> {
    // In a real implementation, this would query a database table
    // For now, we'll return empty array
    return [];
  }

  /**
   * Update an automation rule
   */
  async updateAutomationRule(
    ruleId: string,
    userId: string,
    updates: Partial<AutomationRule>
  ): Promise<AutomationRule> {
    // In a real implementation, this would update the database
    // For now, we'll return a dummy updated rule
    console.log(`Updating automation rule: ${ruleId}`);
    return {
      id: ruleId,
      userId,
      name: 'Updated Rule',
      description: 'Updated Description',
      trigger: 'after_time',
      triggerValue: '1 hour',
      action: 'send_message',
      actionValue: 'Updated message',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Toggle automation rule status
   */
  async toggleAutomationRule(ruleId: string, userId: string): Promise<AutomationRule> {
    // In a real implementation, this would toggle the database record
    console.log(`Toggling automation rule: ${ruleId}`);
    return {
      id: ruleId,
      userId,
      name: 'Toggled Rule',
      description: 'Toggled Description',
      trigger: 'after_time',
      triggerValue: '1 hour',
      action: 'send_message',
      actionValue: 'Toggled message',
      isActive: false, // Toggled to false
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Process messages for automation triggers
   */
  async processMessageForAutomations(message: Message, conversation: Conversation): Promise<void> {
    // Check if any automation rules should be triggered by this message
    // This would typically be called whenever a message is received or sent
    
    // Find relevant automation rules for the user
    const rules = await this.getAutomationRules(message.userId);
    
    for (const rule of rules) {
      if (!rule.isActive) continue;
      
      let shouldTrigger = false;
      
      switch (rule.trigger) {
        case 'keyword_detected':
          // Check if message contains the keyword
          shouldTrigger = message.content.toLowerCase().includes(rule.triggerValue.toLowerCase());
          break;
        case 'after_response':
          // Check if this is a response to a specific trigger
          shouldTrigger = message.direction === 'inbound';
          break;
        // Add more trigger conditions as needed
      }
      
      if (shouldTrigger) {
        // Execute the automation action
        await this.executeAutomationAction(rule, message, conversation);
      }
    }
  }

  /**
   * Execute the action for an automation rule
   */
  private async executeAutomationAction(
    rule: AutomationRule,
    triggeringMessage: Message,
    conversation: Conversation
  ): Promise<void> {
    switch (rule.action) {
      case 'send_message':
        // Send the automated message
        await this.messageService.createMessage(
          triggeringMessage.userId,
          {
            conversationId: conversation.id,
            content: rule.actionValue,
            channelType: conversation.channels[0] || 'whatsapp', // Use conversation's channel or default
            direction: 'outbound',
            senderExternalId: triggeringMessage.userId,
            senderName: 'User',
            externalId: `auto-${Date.now()}`,
            externalThreadId: conversation.id
          }
        );
        break;
      case 'send_template':
        // Send a predefined template message
        // Implementation would depend on template system
        break;
      case 'tag_contact':
        // Add tag to conversation/participant
        // Implementation would depend on contact management system
        break;
      case 'archive_conversation':
        // Archive the conversation
        // Implementation would depend on conversation management
        break;
    }
  }
}