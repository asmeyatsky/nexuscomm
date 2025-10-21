import { EventEmitter } from 'events';

/**
 * Message Queue Interface for abstraction over different queue providers
 * Supports Redis, RabbitMQ, Kafka, or in-memory for development
 */

export interface MessageQueueMessage {
  id: string;
  topic: string;
  data: any;
  timestamp: Date;
  retries?: number;
}

export interface MessageQueueConfig {
  provider: 'redis' | 'rabbitmq' | 'kafka' | 'memory';
  url?: string;
  options?: Record<string, any>;
}

export abstract class BaseMessageQueue extends EventEmitter {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract publish(topic: string, data: any): Promise<void>;
  abstract subscribe(topic: string, handler: (data: any) => Promise<void>): Promise<void>;
  abstract unsubscribe(topic: string): Promise<void>;
}

/**
 * In-Memory Queue for development (not recommended for production)
 */
export class InMemoryQueue extends BaseMessageQueue {
  private subscribers: Map<string, Set<Function>> = new Map();

  async connect() {
    console.log('✅ In-memory message queue connected');
  }

  async disconnect() {
    this.subscribers.clear();
  }

  async publish(topic: string, data: any) {
    const handlers = this.subscribers.get(topic) || new Set();
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Error in message handler for topic ${topic}:`, error);
      }
    }
  }

  async subscribe(topic: string, handler: (data: any) => Promise<void>) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(handler);
  }

  async unsubscribe(topic: string) {
    this.subscribers.delete(topic);
  }
}

/**
 * Message Queue Factory
 */
export class MessageQueueFactory {
  static create(config: MessageQueueConfig): BaseMessageQueue {
    switch (config.provider) {
      case 'memory':
        return new InMemoryQueue();
      // RabbitMQ and Kafka implementations would go here
      default:
        throw new Error(`Unknown message queue provider: ${config.provider}`);
    }
  }
}

/**
 * Message Topics for NexusComm
 */
export const MessageTopics = {
  // Message events
  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_DELETED: 'message.deleted',
  MESSAGE_READ: 'message.read',

  // Conversation events
  CONVERSATION_CREATED: 'conversation.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  CONVERSATION_ARCHIVED: 'conversation.archived',

  // User events
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
  USER_TYPING: 'user.typing',
  USER_STOPPED_TYPING: 'user.stopped_typing',

  // Account events
  ACCOUNT_CONNECTED: 'account.connected',
  ACCOUNT_DISCONNECTED: 'account.disconnected',
  ACCOUNT_SYNC_STARTED: 'account.sync_started',
  ACCOUNT_SYNC_COMPLETED: 'account.sync_completed',

  // Notification events
  NOTIFICATION_CREATED: 'notification.created',
};
