import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { User } from '@models/User';
import { AppError } from '@middleware/errorHandler';
import Bull from 'bull';

// Define offline capability interfaces
export interface OfflineMessage {
  id: string;
  userId: string;
  conversationId: string;
  content: string;
  channelType: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'synced' | 'failed';
  sentAt?: Date;
  syncAttemptedAt?: Date;
  syncAttempts: number;
  error?: string;
  mediaUrls?: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id: string;
  userId: string;
  action: 'send_message' | 'update_conversation' | 'create_conversation' | 'update_message_status';
  payload: any; // The data to sync
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledAt: Date;
  completedAt?: Date;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfflineSettings {
  id: string;
  userId: string;
  cacheSizeLimit: number; // in MB
  cacheDuration: number; // in hours
  autoSyncWhenOnline: boolean;
  syncFrequency: 'real_time' | 'every_5_min' | 'every_15_min' | 'every_hour' | 'manual';
  enableOfflineDrafts: boolean;
  enableOfflineHistory: boolean;
  maxOfflineMessages: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncStatus {
  userId: string;
  lastSyncAt?: Date;
  pendingItemsCount: number;
  failedItemsCount: number;
  nextSyncAt?: Date;
  isSyncing: boolean;
  lastSyncError?: string;
  createdAt: Date;
}

export class OfflineCapabilitiesService {
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);
  private userRepository = AppDataSource.getRepository(User);
  private syncQueue: Bull.Queue;
  private pendingSyncQueue: Bull.Queue;

  constructor() {
    // Initialize queue for handling synchronization
    this.syncQueue = new Bull('offline-sync', {
      redis: process.env.REDIS_URL || { host: 'localhost', port: 6379 }
    });
    
    this.pendingSyncQueue = new Bull('pending-sync', {
      redis: process.env.REDIS_URL || { host: 'localhost', port: 6379 }
    });
    
    // Process sync items when online
    this.syncQueue.process(this.processSyncItem.bind(this));
    
    // Handle pending items
    this.pendingSyncQueue.process(this.processPendingItem.bind(this));
  }

  /**
   * Get or create offline settings for a user
   */
  async getOfflineSettings(userId: string): Promise<OfflineSettings> {
    // In a real implementation, this would fetch from the database
    // For now, return default settings
    return {
      id: `offline-settings-${userId}`,
      userId,
      cacheSizeLimit: 100, // 100MB
      cacheDuration: 720, // 30 days in hours
      autoSyncWhenOnline: true,
      syncFrequency: 'real_time',
      enableOfflineDrafts: true,
      enableOfflineHistory: true,
      maxOfflineMessages: 1000,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Update offline settings for a user
   */
  async updateOfflineSettings(
    userId: string,
    updates: Partial<OfflineSettings>
  ): Promise<OfflineSettings> {
    const currentSettings = await this.getOfflineSettings(userId);
    
    // Apply updates
    Object.assign(currentSettings, updates, { updatedAt: new Date() });
    
    // In a real implementation, this would update the database
    console.log('Updated offline settings:', currentSettings);

    return currentSettings;
  }

  /**
   * Queue a message for offline handling
   */
  async queueOfflineMessage(
    userId: string,
    messageData: Omit<OfflineMessage, 'id' | 'userId' | 'status' | 'syncAttempts' | 'createdAt' | 'updatedAt'>
  ): Promise<OfflineMessage> {
    const offlineMessage: OfflineMessage = {
      id: `offline-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...messageData,
      status: 'pending', // Will be synced when online
      syncAttempts: 0,
      metadata: messageData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to a local database or cache
    console.log('Queued offline message:', offlineMessage);

    // Add to sync queue if auto-sync is enabled
    if (await this.isOnline()) {
      await this.scheduleMessageSync(userId, offlineMessage);
    }

    return offlineMessage;
  }

  /**
   * Add an item to the sync queue
   */
  async queueSyncItem(
    userId: string,
    action: SyncQueueItem['action'],
    payload: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<SyncQueueItem> {
    const syncItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      payload,
      priority,
      status: 'pending',
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 5, // Try up to 5 times
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to queue for processing
    const jobPriority = priority === 'high' ? 1 : priority === 'medium' ? 2 : 3;
    await this.syncQueue.add('sync', syncItem, {
      priority: jobPriority,
      attempts: syncItem.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    // In a real implementation, this would be saved to the database
    console.log('Queued sync item:', syncItem);

    return syncItem;
  }

  /**
   * Schedule a message sync
   */
  private async scheduleMessageSync(userId: string, offlineMessage: OfflineMessage): Promise<void> {
    await this.queueSyncItem(userId, 'send_message', {
      conversationId: offlineMessage.conversationId,
      content: offlineMessage.content,
      channelType: offlineMessage.channelType,
      mediaUrls: offlineMessage.mediaUrls
    }, 'high');
  }

  /**
   * Process a sync item
   */
  private async processSyncItem(job: Bull.Job<SyncQueueItem>) {
    const { userId, action, payload, id } = job.data;
    
    try {
      // Update status to processing
      job.data.status = 'processing';
      job.data.attempts += 1;
      job.data.updatedAt = new Date();
      
      // Check if we're online before attempting sync
      if (!await this.isOnline()) {
        throw new Error('Not online, cannot sync');
      }
      
      // Process based on action
      switch (action) {
        case 'send_message':
          await this.syncSendMessage(userId, payload);
          break;
        case 'update_conversation':
          await this.syncUpdateConversation(userId, payload);
          break;
        case 'create_conversation':
          await this.syncCreateConversation(userId, payload);
          break;
        case 'update_message_status':
          await this.syncUpdateMessageStatus(userId, payload);
          break;
        default:
          throw new Error(`Unknown sync action: ${action}`);
      }
      
      // Mark as completed
      job.data.status = 'completed';
      job.data.completedAt = new Date();
      job.data.updatedAt = new Date();
      
      console.log(`Sync item ${id} completed successfully`);
    } catch (error) {
      console.error(`Sync item ${id} failed:`, error);
      
      job.data.status = 'failed';
      job.data.error = error.message;
      job.data.updatedAt = new Date();
      
      // If max attempts reached, move to failed items
      if (job.data.attempts >= job.data.maxAttempts) {
        console.error(`Sync item ${id} failed after ${job.data.maxAttempts} attempts`);
        throw error; // This will cause the job to be moved to failed state
      }
      
      // Re-throw to trigger retry with backoff
      throw error;
    }
  }

  /**
   * Process a pending item
   */
  private async processPendingItem(job: Bull.Job<any>) {
    // Handle pending sync items
    console.log('Processing pending sync item:', job.data);
  }

  /**
   * Sync a sent message to the server
   */
  private async syncSendMessage(userId: string, payload: any) {
    // In a real implementation, this would make an API call to send the message
    console.log('Syncing message to server:', payload);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Sync conversation update
   */
  private async syncUpdateConversation(userId: string, payload: any) {
    // In a real implementation, this would update the conversation on the server
    console.log('Syncing conversation update:', payload);
  }

  /**
   * Sync conversation creation
   */
  private async syncCreateConversation(userId: string, payload: any) {
    // In a real implementation, this would create the conversation on the server
    console.log('Syncing conversation creation:', payload);
  }

  /**
   * Sync message status update
   */
  private async syncUpdateMessageStatus(userId: string, payload: any) {
    // In a real implementation, this would update the message status on the server
    console.log('Syncing message status update:', payload);
  }

  /**
   * Check if the system is online
   */
  async isOnline(): Promise<boolean> {
    // In a real implementation, this would check network connectivity
    // For now, simulate online status
    return true; // Assume we're online for this implementation
  }

  /**
   * Get pending sync items
   */
  async getPendingSyncItems(userId: string): Promise<SyncQueueItem[]> {
    // In a real implementation, this would fetch pending sync items from the database
    // For now, return mock data
    return [
      {
        id: `sync-${Date.now()}-1`,
        userId,
        action: 'send_message',
        payload: { conversationId: 'conv-1', content: 'Test message' },
        priority: 'high',
        status: 'pending',
        scheduledAt: new Date(),
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get offline messages for a user
   */
  async getOfflineMessages(userId: string): Promise<OfflineMessage[]> {
    // In a real implementation, this would fetch from local storage/cache
    // For now, return mock data
    return [
      {
        id: `offline-msg-${Date.now()}-1`,
        userId,
        conversationId: 'conv-1',
        content: 'Test offline message',
        channelType: 'whatsapp',
        direction: 'outbound',
        status: 'pending',
        syncAttempts: 0,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Manually trigger sync for a user
   */
  async triggerSync(userId: string): Promise<{
    syncedItems: number;
    failedItems: number;
    errorMessage?: string;
  }> {
    try {
      // Get all pending sync items for the user
      const pendingItems = await this.getPendingSyncItems(userId);
      
      let syncedCount = 0;
      let failedCount = 0;
      
      // Process each pending item
      for (const item of pendingItems) {
        try {
          await this.processSyncItem({ data: item } as any);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          failedCount++;
        }
      }
      
      // Update sync status
      await this.updateSyncStatus(userId, {
        lastSyncAt: new Date(),
        pendingItemsCount: pendingItems.length - syncedCount,
        failedItemsCount: failedCount,
        isSyncing: false
      });
      
      return {
        syncedItems: syncedCount,
        failedItems: failedCount
      };
    } catch (error) {
      console.error('Error triggering sync:', error);
      return {
        syncedItems: 0,
        failedItems: 0,
        errorMessage: error.message
      };
    }
  }

  /**
   * Update sync status for a user
   */
  async updateSyncStatus(userId: string, status: Partial<SyncStatus>): Promise<void> {
    // In a real implementation, this would update the sync status in the database
    console.log('Updating sync status for user:', userId, status);
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<SyncStatus> {
    // In a real implementation, this would fetch from the database
    // For now, return mock status
    return {
      userId,
      pendingItemsCount: 5,
      failedItemsCount: 0,
      isSyncing: false,
      createdAt: new Date()
    };
  }

  /**
   * Clear offline cache for a user
   */
  async clearOfflineCache(userId: string): Promise<void> {
    // In a real implementation, this would clear local storage/cache
    console.log('Clearing offline cache for user:', userId);
  }

  /**
   * Export offline data for backup
   */
  async exportOfflineData(userId: string): Promise<{
    messages: OfflineMessage[];
    conversations: any[]; // Would use proper type in real app
    settings: OfflineSettings;
    exportDate: Date;
  }> {
    const [messages, settings] = await Promise.all([
      this.getOfflineMessages(userId),
      this.getOfflineSettings(userId)
    ]);
    
    // In a real implementation, conversations would also be retrieved from offline storage
    const conversations = []; // Mock for now
    
    return {
      messages,
      conversations,
      settings,
      exportDate: new Date()
    };
  }

  /**
   * Import offline data (useful for device migration)
   */
  async importOfflineData(userId: string, data: {
    messages: OfflineMessage[];
    conversations: any[];
    settings: OfflineSettings;
  }): Promise<void> {
    // In a real implementation, this would save the data to offline storage
    console.log('Importing offline data for user:', userId, data);
  }

  /**
   * Get offline storage usage
   */
  async getOfflineStorageUsage(userId: string): Promise<{
    currentUsage: number; // in MB
    limit: number; // in MB
    percentageUsed: number;
  }> {
    // In a real implementation, this would calculate actual storage usage
    // For now, return mock data
    const settings = await this.getOfflineSettings(userId);
    
    return {
      currentUsage: 45, // 45MB used
      limit: settings.cacheSizeLimit,
      percentageUsed: (45 / settings.cacheSizeLimit) * 100
    };
  }

  /**
   * Handle network status change
   */
  async handleNetworkStatusChange(userId: string, isOnline: boolean): Promise<void> {
    console.log(`Network status changed for user ${userId}: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      // When coming online, trigger sync if auto-sync is enabled
      const settings = await this.getOfflineSettings(userId);
      if (settings.autoSyncWhenOnline) {
        // Delay sync to allow network to stabilize
        setTimeout(async () => {
          await this.triggerSync(userId);
        }, 2000);
      }
    }
    // When going offline, no special action needed as we already handle offline operations
  }

  /**
   * Compact offline storage to optimize space
   */
  async compactOfflineStorage(userId: string): Promise<void> {
    // In a real implementation, this would remove old/unnecessary cached data
    console.log('Compacting offline storage for user:', userId);
  }
}