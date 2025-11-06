/**
 * AIAdvancedPort
 * Port defining the contract for advanced AI analysis services.
 * Includes summarization, scheduling recommendations, and conversation insights.
 */

import { ConversationSummary, SummaryLength } from '../valueObjects/ConversationSummary';
import { SmartScheduleRecommendation } from '../valueObjects/SmartScheduleRecommendation';
import { ConversationInsight } from '../valueObjects/ConversationInsight';

export interface SummarizationRequest {
  conversationId: string;
  messageIds: string[]; // Messages to summarize
  length: SummaryLength; // 'brief', 'standard', 'detailed'
  userId: string;
  context?: string; // Additional context for summarization
}

export interface SchedulingRequest {
  conversationId: string;
  userId: string;
  participantIds: string[]; // Other participants in conversation
  messagePreview?: string; // Preview of message to be sent
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  timezone?: string;
  constraints?: {
    notBefore?: Date;
    notAfter?: Date;
    preferredDays?: number[]; // 0-6 (Sun-Sat)
  };
}

export interface InsightsRequest {
  conversationId: string;
  periodStart: Date;
  periodEnd: Date;
  userId?: string; // Optional: filter to specific user insights
  includePredictions?: boolean; // Include trend predictions
}

export interface AIAdvancedPort {
  /**
   * Summarize conversation or message thread
   */
  summarizeConversation(request: SummarizationRequest): Promise<ConversationSummary>;

  /**
   * Get optimal send time recommendation for message
   */
  getSchedulingRecommendation(request: SchedulingRequest): Promise<SmartScheduleRecommendation>;

  /**
   * Analyze conversation and generate insights
   */
  analyzeConversation(request: InsightsRequest): Promise<ConversationInsight>;

  /**
   * Check if service is available
   */
  isHealthy(): Promise<boolean>;
}
