/**
 * MCP Integration Service
 * Bridges NexusComm with MCP server for enhanced capabilities
 */

import axios, { AxiosInstance } from 'axios';
import pino from 'pino';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export interface MCPResourceResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

export class MCPIntegrationService {
  private client: AxiosInstance;
  private logger: pino.Logger;
  private isAvailable: boolean = false;

  constructor(
    private mcpServerUrl: string = 'http://localhost:3001', // Default MCP server port
    private apiKey?: string
  ) {
    this.client = axios.create({
      baseURL: mcpServerUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });

    this.logger = pino({ name: 'MCPIntegrationService' });
  }

  /**
   * Check if MCP server is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      this.isAvailable = response.status === 200;
      return this.isAvailable;
    } catch (error) {
      this.logger.warn({ error }, 'MCP server not available');
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Get available tools from MCP server
   */
  async getAvailableTools(): Promise<MCPTool[]> {
    if (!this.isAvailable) {
      throw new Error('MCP server is not available');
    }

    try {
      const response = await this.client.post('/tools/list');
      return response.data.tools || [];
    } catch (error) {
      this.logger.error({ error }, 'Failed to get MCP tools');
      throw error;
    }
  }

  /**
   * Execute an MCP tool
   */
  async executeTool(toolName: string, arguments_: any): Promise<MCPToolResult> {
    if (!this.isAvailable) {
      throw new Error('MCP server is not available');
    }

    try {
      const response = await this.client.post('/tools/call', {
        name: toolName,
        arguments: arguments_
      });
      return response.data;
    } catch (error) {
      this.logger.error({ error, toolName, arguments_ }, 'Failed to execute MCP tool');
      throw error;
    }
  }

  /**
   * Get available resources from MCP server
   */
  async getAvailableResources(): Promise<MCPResource[]> {
    if (!this.isAvailable) {
      throw new Error('MCP server is not available');
    }

    try {
      const response = await this.client.post('/resources/list');
      return response.data.resources || [];
    } catch (error) {
      this.logger.error({ error }, 'Failed to get MCP resources');
      throw error;
    }
  }

  /**
   * Read an MCP resource
   */
  async readResource(uri: string): Promise<MCPResourceResult> {
    if (!this.isAvailable) {
      throw new Error('MCP server is not available');
    }

    try {
      const response = await this.client.post('/resources/read', { uri });
      return response.data;
    } catch (error) {
      this.logger.error({ error, uri }, 'Failed to read MCP resource');
      throw error;
    }
  }

  // Convenience methods for common NexusComm-enhanced operations

  /**
   * Get smart conversation insights using MCP
   */
  async getSmartConversationInsights(conversationId: string): Promise<any> {
    try {
      // Check conversation health
      const healthResult = await this.executeTool('check_conversation_health', {
        conversationId,
        timeframe: 7 // days
      });

      // Get conversation summary
      const summaryResult = await this.executeTool('get_conversation_summary', {
        conversationId,
        length: 'standard'
      });

      // Analyze recent sentiment
      const messagesResult = await this.executeTool('get_messages', {
        conversationId,
        limit: 10
      });

      if (messagesResult.content?.[0]?.text) {
        const messages = JSON.parse(messagesResult.content[0].text);
        const messageIds = messages.map((m: any) => m.id).filter(Boolean);

        if (messageIds.length > 0) {
          const sentimentResult = await this.executeTool('analyze_sentiment', {
            messageIds
          });

          return {
            conversationId,
            health: JSON.parse(healthResult.content[0]?.text || '{}'),
            summary: JSON.parse(summaryResult.content[0]?.text || '{}'),
            sentiment: JSON.parse(sentimentResult.content[0]?.text || '{}'),
            enhanced: true,
            timestamp: new Date().toISOString()
          };
        }
      }

      return {
        conversationId,
        health: JSON.parse(healthResult.content[0]?.text || '{}'),
        summary: JSON.parse(summaryResult.content[0]?.text || '{}'),
        enhanced: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error({ error, conversationId }, 'Failed to get smart conversation insights');
      throw error;
    }
  }

  /**
   * Perform advanced triage with system integration
   */
  async performAdvancedTriage(options: {
    includeFileSystem?: boolean;
    customCriteria?: any;
  } = {}): Promise<any> {
    try {
      // Standard message triage
      const triageResult = await this.executeTool('triage_messages', options.customCriteria || {});

      // If file system access is enabled, look for related files
      let fileInsights = null;
      if (options.includeFileSystem && this.isAvailable) {
        try {
          const filesResult = await this.executeTool('file_system', {
            path: '/Users/username/Documents', // Would be user-configurable
            operation: 'search',
            pattern: 'meeting|project|urgent'
          });
          fileInsights = JSON.parse(filesResult.content[0]?.text || '[]');
        } catch (fileError) {
          this.logger.warn({ error: fileError }, 'File system triage failed');
        }
      }

      // Get daily summary for context
      const dailyResult = await this.executeTool('generate_daily_summary', {
        format: 'brief',
        includeAnalytics: true
      });

      return {
        standardTriage: JSON.parse(triageResult.content[0]?.text || '{}'),
        fileInsights,
        dailyContext: JSON.parse(dailyResult.content[0]?.text || '{}'),
        advanced: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to perform advanced triage');
      throw error;
    }
  }

  /**
   * Create intelligent follow-up reminder with system integration
   */
  async createIntelligentReminder(params: {
    conversationId: string;
    messageId?: string;
    context?: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<any> {
    try {
      // Analyze conversation for optimal timing
      const timingResult = await this.executeTool('suggest_optimal_timing', {
        conversationId: params.conversationId,
        participantIds: [], // Would need to be fetched from conversation
        messageType: params.priority === 'high' ? 'urgent' : 'important'
      });

      const timing = JSON.parse(timingResult.content[0]?.text || '{}');

      // Set the reminder with optimal timing
      const reminderResult = await this.executeTool('set_follow_up_reminder', {
        conversationId: params.conversationId,
        messageId: params.messageId,
        reminderTime: timing.recommendedTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reminderType: 'notification',
        customMessage: params.context
      });

      // If file system access is available, create a note
      let noteCreated = null;
      if (this.isAvailable) {
        try {
          await this.executeTool('file_system', {
            path: '/tmp/followup_notes.txt',
            operation: 'write',
            content: `Follow-up reminder created:\nConversation: ${params.conversationId}\nContext: ${params.context || 'N/A'}\nTime: ${timing.recommendedTime}\n\n`
          });
          noteCreated = true;
        } catch (noteError) {
          this.logger.warn({ error: noteError }, 'Failed to create follow-up note');
        }
      }

      return {
        reminder: JSON.parse(reminderResult.content[0]?.text || '{}'),
        optimalTiming: timing,
        noteCreated,
        intelligent: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error({ error, params }, 'Failed to create intelligent reminder');
      throw error;
    }
  }

  /**
   * Get system status and capabilities
   */
  async getSystemCapabilities(): Promise<any> {
    try {
      const serverInfo = await this.executeTool('mcp_server_info', {});
      const systemStatus = await this.readResource('system://status');

      return {
        serverInfo: JSON.parse(serverInfo.content[0]?.text || '{}'),
        systemStatus: JSON.parse(systemStatus.contents[0]?.text || '{}'),
        available: this.isAvailable,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to get system capabilities');
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}