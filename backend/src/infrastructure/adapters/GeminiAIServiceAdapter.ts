/**
 * Gemini AI Service Adapter
 * Uses Google's Gemini API for AI analysis
 * Free tier available at: https://aistudio.google.com/app/apikey
 */

import axios from 'axios';
import pino from 'pino';
import { MessageAnalysis, SentimentScore, MessageCategory, MessageTheme } from '../../domain/valueObjects/MessageAnalysis';
import { MessageSuggestion, SuggestedReply } from '../../domain/valueObjects/MessageSuggestion';
import {
  AIAnalysisPort,
  AnalysisRequest,
  SentimentAnalysisRequest,
  CategorizationRequest,
  SuggestionRequest,
  SemanticSearchRequest,
  EmbeddingRequest,
  SemanticSearchResult,
} from '../../domain/ports/AIAnalysisPort';
import { AppDataSource } from '@config/database';
import { AIUsageLogRepository } from '@infrastructure/repositories/AIUsageLogRepository';

export class GeminiAIServiceAdapter implements AIAnalysisPort {
  private logger: pino.Logger;
  private usageLogRepository: AIUsageLogRepository;
  private readonly MODEL = 'gemini-2.0-flash';
  private readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private apiKey?: string) {
    this.logger = pino();
    this.usageLogRepository = new AIUsageLogRepository(AppDataSource);
  }

  private getClient() {
    const key = this.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required');
    }
    return axios.create({
      baseURL: `${this.API_URL}/models`,
      params: { key },
      timeout: 30000,
    });
  }

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<MessageAnalysis> {
    const prompt = `Analyze the sentiment of this message. Return a JSON with:
- positive: number 0-1
- neutral: number 0-1
- negative: number 0-1
- overall: "positive" | "neutral" | "negative"
- confidence: number 0-1

Message: "${request.content}"`;

    try {
      const response = await this.getClient().post(`/${this.MODEL}:generateContent`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = this.parseJsonResponse(text);

      const sentiment: SentimentScore = {
        positive: Number(parsed.positive) || 0.33,
        neutral: Number(parsed.neutral) || 0.33,
        negative: Number(parsed.negative) || 0.33,
        overall: (parsed.overall as 'positive' | 'neutral' | 'negative') || 'neutral',
        confidence: Number(parsed.confidence) || 0.5,
      };

      const category: MessageCategory = {
        primary: 'general',
        confidence: 0.7,
      };

      return new MessageAnalysis(
        request.messageId,
        sentiment,
        category,
        [],
        [],
      );
    } catch (error) {
      this.logger.error({ error, request }, 'Failed to analyze sentiment with Gemini');
      return this.getDefaultAnalysis(request.messageId);
    }
  }

  async categorizeMessage(request: CategorizationRequest): Promise<MessageAnalysis> {
    const prompt = `Categorize this message. Return JSON with:
- primary: main category
- confidence: number 0-1

Categories: work, personal, urgent, informational, casual

Message: "${request.content}"`;

    try {
      const response = await this.getClient().post(`/${this.MODEL}:generateContent`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = this.parseJsonResponse(text);

      const category: MessageCategory = {
        primary: String(parsed.primary) || 'general',
        confidence: Number(parsed.confidence) || 0.7,
      };

      const sentiment: SentimentScore = {
        positive: 0.33,
        neutral: 0.34,
        negative: 0.33,
        overall: 'neutral',
        confidence: 0.5,
      };

      return new MessageAnalysis(
        request.messageId,
        sentiment,
        category,
        [],
        [],
      );
    } catch (error) {
      this.logger.error({ error }, 'Failed to categorize message');
      return this.getDefaultAnalysis(request.messageId);
    }
  }

  async generateSuggestions(request: SuggestionRequest): Promise<MessageSuggestion> {
    const prompt = `Generate 3 reply suggestions. Return JSON with:
- suggestions: array of {text, confidence, tone, lengthCategory}

Tone options: professional, casual, empathetic, humorous
Length: short, medium, long

Conversation:
${request.conversationHistory?.map((m) => `${m.role}: ${m.content}`).join('\n')}`;

    try {
      const response = await this.getClient().post(`/${this.MODEL}:generateContent`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = this.parseJsonResponse(text);

      const suggestions: SuggestedReply[] = (Array.isArray(parsed.suggestions) ? parsed.suggestions : []).slice(0, 5).map((s: unknown) => {
        const si = s as { text?: string; confidence?: number; tone?: string; lengthCategory?: string };
        return {
          text: si.text || 'Thanks for your message',
          confidence: si.confidence ?? 0.7,
          tone: (si.tone as 'professional' | 'casual' | 'empathetic' | 'humorous') || 'professional',
          lengthCategory: (si.lengthCategory as 'short' | 'medium' | 'long') || 'medium',
        };
      });

      return new MessageSuggestion(
        request.messageId,
        request.conversationId,
        suggestions,
        'Conversation context',
      );
    } catch (error) {
      this.logger.error({ error }, 'Failed to generate suggestions');
      return new MessageSuggestion(
        request.messageId,
        request.conversationId,
        [{ text: 'Thanks for your message', confidence: 0.5, tone: 'professional', lengthCategory: 'short' }],
        'Conversation context',
      );
    }
  }

  async semanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResult[]> {
    return [];
  }

  async generateEmbedding(request: EmbeddingRequest): Promise<number[]> {
    try {
      const response = await this.getClient().post('/embedding-001:embedContent', {
        content: { parts: [{ text: request.text }] },
      });

      return response.data?.embedding?.values || [];
    } catch (error) {
      this.logger.error({ error }, 'Failed to generate embeddings');
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.get('/');
      return true;
    } catch {
      return false;
    }
  }

  async getUsageMetrics(): Promise<{
    requestsToday: number;
    tokensUsedToday: number;
    estimatedCostToday: number;
  }> {
    return {
      requestsToday: 0,
      tokensUsedToday: 0,
      estimatedCostToday: 0,
    };
  }

  private parseJsonResponse(text: string): Record<string, unknown> {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Ignore parse errors
    }
    return {};
  }

  private getDefaultAnalysis(messageId: string): MessageAnalysis {
    const sentiment: SentimentScore = {
      positive: 0.33,
      neutral: 0.34,
      negative: 0.33,
      overall: 'neutral',
      confidence: 0,
    };

    const category: MessageCategory = {
      primary: 'general',
      confidence: 0,
    };

    return new MessageAnalysis(messageId, sentiment, category, [], []);
  }
}
