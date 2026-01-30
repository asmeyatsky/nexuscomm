/**
 * MCP Resources
 * Resources that can be accessed via MCP protocol
 */

import { NexusCommService } from '../services/NexusCommService.js';
import { LocalSystemService } from '../services/LocalSystemService.js';
import { MCPResource } from '../types/index.js';

export function createResources(
  nexusComm: NexusCommService,
  localSystem: LocalSystemService
) {
  return {
    /**
     * Conversations list resource
     */
    conversations: {
      uri: 'nexuscomm://conversations',
      name: 'User Conversations',
      description: 'List of all user conversations with metadata',
      mimeType: 'application/json',
      handler: async () => {
        const conversations = await nexusComm.getConversations();
        return {
          contents: [{
            uri: 'nexuscomm://conversations',
            mimeType: 'application/json',
            text: JSON.stringify(conversations, null, 2),
          }],
        };
      },
    },

    /**
     * Unread messages resource
     */
    unreadMessages: {
      uri: 'nexuscomm://messages/unread',
      name: 'Unread Messages',
      description: 'All unread messages across conversations',
      mimeType: 'application/json',
      handler: async () => {
        const conversations = await nexusComm.getConversations({ unreadOnly: true });
        const unreadData = {
          totalUnread: conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0),
          conversations: conversations,
          lastUpdated: new Date().toISOString(),
        };
        
        return {
          contents: [{
            uri: 'nexuscomm://messages/unread',
            mimeType: 'application/json',
            text: JSON.stringify(unreadData, null, 2),
          }],
        };
      },
    },

    /**
     * User profile resource
     */
    userProfile: {
      uri: 'nexuscomm://user/profile',
      name: 'User Profile',
      description: 'Current user profile and preferences',
      mimeType: 'application/json',
      handler: async () => {
        const profile = await nexusComm.getUserProfile();
        return {
          contents: [{
            uri: 'nexuscomm://user/profile',
            mimeType: 'application/json',
            text: JSON.stringify(profile, null, 2),
          }],
        };
      },
    },

    /**
     * System status resource
     */
    systemStatus: {
      uri: 'system://status',
      name: 'System Status',
      description: 'Current system status and capabilities',
      mimeType: 'application/json',
      handler: async () => {
        const systemInfo = await localSystem.getSystemInfo();
        const nexusCommStatus = await nexusComm.testConnection();
        
        const status = {
          timestamp: new Date().toISOString(),
          nexusComm: {
            connected: nexusCommStatus,
            apiUrl: nexusComm['apiUrl'],
          },
          system: systemInfo,
          capabilities: {
            fileSystem: systemInfo.allowedPaths.length > 0,
            shellAccess: systemInfo.shellAccess,
            browserControl: systemInfo.browserControl,
          },
        };
        
        return {
          contents: [{
            uri: 'system://status',
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2),
          }],
        };
      },
    },

    /**
     * File system resource
     */
    fileSystem: {
      uri: 'system://files',
      name: 'File System',
      description: 'Access to allowed file system paths',
      mimeType: 'application/json',
      handler: async () => {
        const systemInfo = await localSystem.getSystemInfo();
        const fileSystemData = {
          allowedPaths: systemInfo.allowedPaths,
          homeDirectory: process.env.HOME || process.cwd(),
          currentWorkingDirectory: process.cwd(),
          platform: systemInfo.platform,
        };
        
        return {
          contents: [{
            uri: 'system://files',
            mimeType: 'application/json',
            text: JSON.stringify(fileSystemData, null, 2),
          }],
        };
      },
    },

    /**
     * Daily digest resource
     */
    dailyDigest: {
      uri: 'nexuscomm://digest/daily',
      name: 'Daily Communication Digest',
      description: 'Daily summary of communications and insights',
      mimeType: 'application/json',
      handler: async () => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const conversations = await nexusComm.getConversations();
        const summaries = [];
        let totalMessages = 0;
        let totalUnread = 0;

        for (const conversation of conversations as any[]) {
          totalMessages += conversation.messageCount || 0;
          totalUnread += conversation.unreadCount || 0;
          
          try {
            const summary = await nexusComm.getConversationSummary({
              conversationId: conversation.id,
              length: 'brief',
            });
            summaries.push({
              conversationId: conversation.id,
              name: conversation.name,
              summary: summary.summary,
              urgency: summary.urgency,
            });
          } catch (error) {
            // Skip if summary fails
          }
        }

        const digest = {
          date: today.toISOString().split('T')[0],
          totalConversations: conversations.length,
          totalMessages,
          totalUnread,
          summaries: summaries.slice(0, 10), // Limit to 10 most important
          generatedAt: new Date().toISOString(),
        };
        
        return {
          contents: [{
            uri: 'nexuscomm://digest/daily',
            mimeType: 'application/json',
            text: JSON.stringify(digest, null, 2),
          }],
        };
      },
    },

    /**
     * AI usage metrics resource
     */
    aiUsageMetrics: {
      uri: 'nexuscomm://ai/usage',
      name: 'AI Usage Metrics',
      description: 'Current AI usage statistics and costs',
      mimeType: 'application/json',
      handler: async () => {
        // This would fetch from the AI usage tracking system
        const usageData = {
          currentDate: new Date().toISOString().split('T')[0],
          requestsToday: 0, // Would be fetched from actual system
          tokensUsedToday: 0,
          costToday: 0.00,
          monthlyLimits: {
            requests: 20000,
            tokens: 1000000,
            cost: 100.00,
          },
          usage: {
            sentiment: 0,
            categorization: 0,
            suggestions: 0,
            search: 0,
          },
        };
        
        return {
          contents: [{
            uri: 'nexuscomm://ai/usage',
            mimeType: 'application/json',
            text: JSON.stringify(usageData, null, 2),
          }],
        };
      },
    },

    /**
     * Reminders resource
     */
    reminders: {
      uri: 'system://reminders',
      name: 'Active Reminders',
      description: 'All active follow-up reminders',
      mimeType: 'application/json',
      handler: async () => {
        const reminderPath = '/tmp/nexuscomm_reminders.json';
        try {
          const remindersData = await localSystem.fileSystem({
            path: reminderPath,
            operation: 'read',
          });
          const reminders = JSON.parse(remindersData);
          const activeReminders = reminders.filter((r: any) => r.status === 'pending');
          
          return {
            contents: [{
              uri: 'system://reminders',
              mimeType: 'application/json',
              text: JSON.stringify({
                active: activeReminders,
                total: activeReminders.length,
                lastUpdated: new Date().toISOString(),
              }, null, 2),
            }],
          };
        } catch {
          return {
            contents: [{
              uri: 'system://reminders',
              mimeType: 'application/json',
              text: JSON.stringify({
                active: [],
                total: 0,
                lastUpdated: new Date().toISOString(),
              }, null, 2),
            }],
          };
        }
      },
    },
  };
}