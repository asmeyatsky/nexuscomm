/**
 * Enhanced Message Controller with MCP Integration
 */

import { Request, Response } from 'express';
import pino from 'pino';
import { MCPIntegrationService } from '../services/MCPIntegrationService.js';

export class EnhancedMessageController {
  private logger: pino.Logger;
  private mcpService: MCPIntegrationService;

  constructor(
    // Existing dependencies would be injected here
    // private createMessageUseCase: CreateMessageUseCase,
    // private getMessageUseCase: GetMessageUseCase,
    // ... other use cases
  ) {
    this.logger = pino();
    this.mcpService = new MCPIntegrationService();
    
    // Initialize MCP service
    this.initializeMCPService();
  }

  private async initializeMCPService() {
    try {
      await this.mcpService.checkAvailability();
      this.logger.info('MCP service initialized successfully');
    } catch (error) {
      this.logger.warn({ error }, 'MCP service initialization failed, running without enhanced features');
    }
  }

  /**
   * Enhanced create message with MCP-powered suggestions
   */
  async createMessageWithEnhancements(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, content, channelType, enableSuggestions = false } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Create message using existing logic would go here
      // const message = await this.createMessageUseCase.execute({ ... });

      let enhancedResponse: any = { message: 'Message created successfully' };

      // If MCP is available and suggestions are enabled
      if (enableSuggestions && await this.isMCPAvailable()) {
        try {
          // Get AI reply suggestions
          const suggestionsResult = await this.mcpService.executeTool('get_reply_suggestions', {
            conversationId,
            tone: 'professional',
            context: 'New message creation'
          });

          // Get optimal timing for responses
          const timingResult = await this.mcpService.executeTool('suggest_optimal_timing', {
            conversationId,
            participantIds: [], // Would fetch from conversation
            messageType: 'casual'
          });

          // Get conversation health
          const healthResult = await this.mcpService.executeTool('check_conversation_health', {
            conversationId,
            timeframe: 7
          });

          enhancedResponse = {
            ...enhancedResponse,
            aiSuggestions: JSON.parse(suggestionsResult.content[0]?.text || '{}'),
            optimalTiming: JSON.parse(timingResult.content[0]?.text || '{}'),
            conversationHealth: JSON.parse(healthResult.content[0]?.text || '{}'),
            features: ['ai-suggestions', 'optimal-timing', 'conversation-health']
          };
        } catch (mcpError) {
          this.logger.warn({ error: mcpError }, 'MCP enhancements failed, returning basic response');
        }
      }

      res.status(201).json({
        success: true,
        data: enhancedResponse,
      });
    } catch (error) {
      this.logger.error({ error }, 'Enhanced message creation failed');
      res.status(500).json({
        error: `Message creation failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get messages with intelligent insights
   */
  async getMessagesWithInsights(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, includeInsights = false } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get messages using existing logic would go here
      // const messages = await this.getMessagesUseCase.execute({ ... });

      let response: any = { 
        messages: [], // Would contain actual messages
        conversationId 
      };

      // Add insights if requested and MCP is available
      if (includeInsights === 'true' && await this.isMCPAvailable()) {
        try {
          const insights = await this.mcpService.getSmartConversationInsights(conversationId as string);
          response.insights = insights;
          response.features = ['conversation-insights', 'sentiment-analysis', 'health-monitoring'];
        } catch (mcpError) {
          this.logger.warn({ error: mcpError }, 'Failed to get conversation insights');
        }
      }

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      this.logger.error({ error }, 'Enhanced message retrieval failed');
      res.status(500).json({
        error: `Message retrieval failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Advanced triage endpoint
   */
  async performAdvancedTriage(req: Request, res: Response): Promise<void> {
    try {
      const { includeFileSystem = false, customCriteria } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!await this.isMCPAvailable()) {
        res.status(503).json({ 
          error: 'MCP service not available',
          message: 'Advanced triage requires MCP server to be running'
        });
        return;
      }

      const triageResult = await this.mcpService.performAdvancedTriage({
        includeFileSystem,
        customCriteria
      });

      res.status(200).json({
        success: true,
        data: triageResult,
      });
    } catch (error) {
      this.logger.error({ error }, 'Advanced triage failed');
      res.status(500).json({
        error: `Triage failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Intelligent follow-up reminder endpoint
   */
  async createIntelligentReminder(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId, messageId, context, priority = 'medium' } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!await this.isMCPAvailable()) {
        res.status(503).json({ 
          error: 'MCP service not available',
          message: 'Intelligent reminders require MCP server to be running'
        });
        return;
      }

      const reminderResult = await this.mcpService.createIntelligentReminder({
        conversationId,
        messageId,
        context,
        priority
      });

      res.status(201).json({
        success: true,
        data: reminderResult,
      });
    } catch (error) {
      this.logger.error({ error }, 'Intelligent reminder creation failed');
      res.status(500).json({
        error: `Reminder creation failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get system capabilities status
   */
  async getSystemCapabilities(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const capabilities = await this.mcpService.getSystemCapabilities();

      res.status(200).json({
        success: true,
        data: capabilities,
      });
    } catch (error) {
      this.logger.error({ error }, 'System capabilities check failed');
      res.status(500).json({
        error: `Capabilities check failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Check MCP availability
   */
  private async isMCPAvailable(): Promise<boolean> {
    try {
      return await this.mcpService.checkAvailability();
    } catch {
      return false;
    }
  }

  /**
   * Get daily communication digest
   */
  async getDailyDigest(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'standard', includeAnalytics = false } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!await this.isMCPAvailable()) {
        res.status(503).json({ 
          error: 'MCP service not available',
          message: 'Daily digest requires MCP server to be running'
        });
        return;
      }

      const digestResult = await this.mcpService.executeTool('generate_daily_summary', {
        format: format as string,
        includeAnalytics: includeAnalytics === 'true'
      });

      const digest = JSON.parse(digestResult.content[0]?.text || '{}');

      res.status(200).json({
        success: true,
        data: digest,
      });
    } catch (error) {
      this.logger.error({ error }, 'Daily digest generation failed');
      res.status(500).json({
        error: `Digest generation failed: ${(error as Error).message}`,
      });
    }
  }
}