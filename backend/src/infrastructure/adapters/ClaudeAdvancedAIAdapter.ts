/**
 * ClaudeAdvancedAIAdapter
 * Infrastructure adapter implementing AIAdvancedPort using Anthropic's Claude API.
 * Handles summarization, scheduling recommendations, and conversation insights.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AppDataSource } from '@config/database';
import {
  AIAdvancedPort,
  SummarizationRequest,
  SchedulingRequest,
  InsightsRequest,
} from '../../domain/ports/AIAdvancedPort';
import {
  ConversationSummary,
  SummaryMetrics,
} from '../../domain/valueObjects/ConversationSummary';
import {
  SmartScheduleRecommendation,
  EngagementWindow,
  ScheduleMetrics,
} from '../../domain/valueObjects/SmartScheduleRecommendation';
import {
  ConversationInsight,
  ParticipantStats,
  EngagementTrend,
  ConversationHealth,
  TopicDistribution,
} from '../../domain/valueObjects/ConversationInsight';
import { AIUsageLogRepository } from '@infrastructure/repositories/AIUsageLogRepository';
import pino from 'pino';

export class ClaudeAdvancedAIAdapter implements AIAdvancedPort {
  private client: Anthropic;
  private logger: pino.Logger;
  private usageLogRepository: AIUsageLogRepository;
  private readonly MODEL = 'claude-3-5-sonnet-20241022';
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_DELAY = 1000; // ms

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.logger = pino();
    this.usageLogRepository = new AIUsageLogRepository(AppDataSource);
  }

  async summarizeConversation(
    request: SummarizationRequest,
  ): Promise<ConversationSummary> {
    try {
      const prompt = this.buildSummarizationPrompt(request);
      const response = await this.callClaudeWithRetry(prompt);
      const summary = this.parseSummarizationResponse(
        response,
        request.conversationId,
        request.messageIds,
        request.length,
      );

      this.logger.info(
        {
          conversationId: request.conversationId,
          messageCount: request.messageIds.length,
          summaryLength: request.length,
        },
        'Conversation summarized successfully',
      );

      return summary;
    } catch (error) {
      this.logger.error(
        { error, conversationId: request.conversationId },
        'Failed to summarize conversation',
      );
      throw new Error(`Summarization failed: ${(error as Error).message}`);
    }
  }

  async getSchedulingRecommendation(
    request: SchedulingRequest,
  ): Promise<SmartScheduleRecommendation> {
    try {
      const prompt = this.buildSchedulingPrompt(request);
      const response = await this.callClaudeWithRetry(prompt);
      const recommendation = this.parseSchedulingResponse(
        response,
        request.conversationId,
        request.userId,
        request.urgency,
      );

      this.logger.info(
        {
          conversationId: request.conversationId,
          urgency: request.urgency,
          confidence: recommendation.engagementScore,
        },
        'Scheduling recommendation generated',
      );

      return recommendation;
    } catch (error) {
      this.logger.error(
        { error, conversationId: request.conversationId },
        'Failed to generate scheduling recommendation',
      );
      throw new Error(`Scheduling failed: ${(error as Error).message}`);
    }
  }

  async analyzeConversation(request: InsightsRequest): Promise<ConversationInsight> {
    try {
      const prompt = this.buildInsightsPrompt(request);
      const response = await this.callClaudeWithRetry(prompt);
      const insight = this.parseInsightsResponse(
        response,
        request.conversationId,
        request.periodStart,
        request.periodEnd,
      );

      this.logger.info(
        {
          conversationId: request.conversationId,
          health: insight.conversationHealth.status,
          sentiment: insight.averageSentiment,
        },
        'Conversation insights analyzed',
      );

      return insight;
    } catch (error) {
      this.logger.error(
        { error, conversationId: request.conversationId },
        'Failed to analyze conversation',
      );
      throw new Error(`Insights analysis failed: ${(error as Error).message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: this.MODEL,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'ping',
          },
        ],
      });

      return response.stop_reason === 'end_turn';
    } catch (error) {
      this.logger.error({ error }, 'Advanced AI health check failed');
      return false;
    }
  }

  // Private helper methods

  private buildSummarizationPrompt(request: SummarizationRequest): string {
    const lengthGuidelines = {
      brief: '2-3 sentences maximum, focus on most critical points',
      standard: '1-2 paragraphs, cover main topics and conclusions',
      detailed: '3-5 paragraphs, include context, discussions, and outcomes',
    };

    return `Summarize the following conversation messages in a ${request.length} summary. ${lengthGuidelines[request.length]}

Messages:
${request.messageIds.map((id, idx) => `Message ${idx + 1}: [Content would be provided in production]`).join('\n')}

${request.context ? `\nAdditional Context: ${request.context}` : ''}

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "summary": "<main summary text>",
  "keyPoints": ["<point1>", "<point2>", "<point3>"],
  "mainTopics": ["<topic1>", "<topic2>"],
  "participants": ["<participant1>", "<participant2>"],
  "wordCount": <number>,
  "confidence": <number 0-1>
}`;
  }

  private buildSchedulingPrompt(request: SchedulingRequest): string {
    const urgencyContext = {
      low: 'This can wait. Recommend the optimal engagement window.',
      medium: 'Normal priority. Recommend when recipient is most engaged.',
      high: 'Important message. Recommend sooner rather than later.',
      urgent: 'Time-sensitive. Recommend sending ASAP (within 1 hour if possible).',
    };

    return `Recommend the optimal time to send a message in this conversation.

Conversation: ${request.conversationId}
Participants: ${request.participantIds.join(', ')}
Urgency Level: ${request.urgency}
Context: ${urgencyContext[request.urgency]}
${request.timezone ? `Timezone: ${request.timezone}` : ''}
${request.messagePreview ? `Message Preview: ${request.messagePreview}` : ''}

Based on typical engagement patterns and the urgency level, recommend:
1. Best time to send (next 7 days)
2. Engagement score (0-1)
3. Alternative windows
4. Reasoning

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "recommendedTime": "<ISO 8601 datetime>",
  "engagementScore": <number 0-1>,
  "reason": "<brief explanation>",
  "alternativeWindows": [
    {
      "dayOfWeek": <0-6>,
      "hourStart": <0-23>,
      "hourEnd": <0-23>,
      "engagementScore": <number 0-1>
    }
  ],
  "peakHours": [<hours>],
  "quietHours": [<hours>]
}`;
  }

  private buildInsightsPrompt(request: InsightsRequest): string {
    return `Analyze this conversation period and provide comprehensive insights.

Conversation: ${request.conversationId}
Period: ${request.periodStart.toISOString()} to ${request.periodEnd.toISOString()}
${request.userId ? `Focus on user: ${request.userId}` : 'Include all participants'}

Provide analysis on:
1. Overall conversation health and engagement
2. Participant behavior patterns
3. Topic evolution and sentiment trends
4. Key metrics and recommendations

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "totalMessages": <number>,
  "uniqueParticipants": <number>,
  "averageResponseTimeMs": <number>,
  "averageSentiment": "positive" | "neutral" | "negative",
  "sentimentScore": <number 0-1>,
  "healthScore": <number 0-100>,
  "healthStatus": "excellent" | "good" | "fair" | "poor",
  "healthReasons": ["<reason1>", "<reason2>"],
  "recommendations": ["<recommendation1>", "<recommendation2>"],
  "topTopics": [
    {
      "topic": "<topic>",
      "messageCount": <number>,
      "sentiment": "positive" | "neutral" | "negative"
    }
  ],
  "engagementTrend": "increasing" | "decreasing" | "stable",
  "trendPercent": <number -100 to 100>
}`;
  }

  private async callClaudeWithRetry(
    prompt: string,
    retries: number = 0,
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.MODEL,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      throw new Error('Unexpected response type from Claude');
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        const delay = this.RATE_LIMIT_DELAY * Math.pow(2, retries);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.callClaudeWithRetry(prompt, retries + 1);
      }

      throw error;
    }
  }

  private parseSummarizationResponse(
    response: string,
    conversationId: string,
    messageIds: string[],
    length: 'brief' | 'standard' | 'detailed',
  ): ConversationSummary {
    const parsed = JSON.parse(response);

    const metrics: SummaryMetrics = {
      messageCount: messageIds.length,
      wordCount: parsed.wordCount || 0,
      participantCount: parsed.participants?.length || 1,
      topicCount: parsed.mainTopics?.length || 1,
    };

    return new ConversationSummary(
      conversationId,
      messageIds,
      parsed.summary,
      length,
      parsed.keyPoints || [],
      parsed.mainTopics || ['General'],
      parsed.participants || ['Unknown'],
      metrics,
    );
  }

  private parseSchedulingResponse(
    response: string,
    conversationId: string,
    userId: string,
    urgency: 'low' | 'medium' | 'high' | 'urgent',
  ): SmartScheduleRecommendation {
    const parsed = JSON.parse(response);

    const metrics: ScheduleMetrics = {
      avgResponseTimeMs: 3600000, // 1 hour default
      engagementRate: parsed.engagementScore || 0.7,
      peakHours: parsed.peakHours || [9, 13, 18],
      quietHours: parsed.quietHours || [0, 1, 2, 3, 4, 5],
      timezone: 'UTC',
    };

    const alternativeWindows: EngagementWindow[] = (parsed.alternativeWindows || []).map(
      (w: any) => ({
        dayOfWeek: w.dayOfWeek,
        hourStart: w.hourStart,
        hourEnd: w.hourEnd,
        engagementScore: w.engagementScore,
      }),
    );

    const recommendedTime = new Date(parsed.recommendedTime);

    return new SmartScheduleRecommendation(
      conversationId,
      userId,
      recommendedTime,
      parsed.engagementScore || 0.7,
      parsed.reason || 'Optimal engagement window',
      alternativeWindows,
      metrics,
      urgency,
    );
  }

  private parseInsightsResponse(
    response: string,
    conversationId: string,
    periodStart: Date,
    periodEnd: Date,
  ): ConversationInsight {
    const parsed = JSON.parse(response);

    // Mock participant stats (in production, would come from actual data)
    const participantStats: ParticipantStats[] = [
      {
        userId: 'user-1',
        messageCount: Math.floor(parsed.totalMessages * 0.5),
        averageMessageLength: 150,
        responseTimeMs: parsed.averageResponseTimeMs || 3600000,
        sentimentTrend: 'stable',
        engagementLevel: 0.8,
      },
    ];

    // Mock engagement trends
    const engagementTrends: EngagementTrend[] = [
      {
        period: '24h',
        messageCount: Math.floor(parsed.totalMessages * 0.3),
        activeParticipants: parsed.uniqueParticipants || 1,
        trend: parsed.engagementTrend || 'stable',
        trendPercent: parsed.trendPercent || 0,
      },
    ];

    // Build health assessment
    const health: ConversationHealth = {
      score: parsed.healthScore || 75,
      status: parsed.healthStatus || 'good',
      reasonsForScore: parsed.healthReasons || ['Good engagement', 'Positive sentiment'],
      recommendations: parsed.recommendations || [],
    };

    // Parse topic distributions
    const topTopics: TopicDistribution[] = (parsed.topTopics || []).map((t: any) => ({
      topic: t.topic,
      messageCount: t.messageCount,
      percentage: (t.messageCount / parsed.totalMessages) * 100,
      sentiment: t.sentiment || 'neutral',
      trend: 'stable',
    }));

    return new ConversationInsight(
      conversationId,
      periodStart,
      periodEnd,
      parsed.totalMessages || 0,
      parsed.uniqueParticipants || 1,
      parsed.averageResponseTimeMs || 0,
      participantStats,
      engagementTrends,
      health,
      topTopics,
      parsed.averageSentiment || 'neutral',
      parsed.sentimentScore || 0.5,
    );
  }
}
