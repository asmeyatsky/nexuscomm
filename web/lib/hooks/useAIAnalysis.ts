/**
 * useAIAnalysis Hook
 * React hook for consuming AI analysis API endpoints.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface MessageAnalysis {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    overall: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  keyInsights: string[];
  tone: string;
}

export interface MessageCategory {
  primaryCategory: string;
  secondaryCategories: string[];
  confidence: number;
  themes: Array<{ name: string; relevance: number }>;
}

export interface ReplyOptions {
  suggestions: Array<{
    text: string;
    confidence: number;
    tone: 'professional' | 'casual' | 'empathetic' | 'humorous';
    lengthCategory: 'short' | 'medium' | 'long';
    rationale?: string;
  }>;
  contextSummary: string;
  averageConfidence: number;
}

export interface UsageStats {
  todayRequests: number;
  todayTokens: number;
  todayCost: number;
  monthRequests: number;
  monthTokens: number;
  monthCost: number;
  dailyLimitRemaining: number;
  monthlyLimitRemaining: number;
}

export const useAIAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSentiment = useCallback(
    async (messageId: string, content: string, conversationContext?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post<{ data: MessageAnalysis }>(
          `${API_URL}/api/ai/analyze-sentiment`,
          {
            messageId,
            content,
            conversationContext,
          },
        );
        return response.data.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || 'Failed to analyze sentiment';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const categorizeMessage = useCallback(
    async (messageId: string, content: string, conversationContext?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post<{ data: MessageCategory }>(
          `${API_URL}/api/ai/categorize-message`,
          {
            messageId,
            content,
            conversationContext,
          },
        );
        return response.data.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || 'Failed to categorize message';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const generateReplySuggestions = useCallback(
    async (
      messageId: string,
      conversationId: string,
      content: string,
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
      tone?: 'professional' | 'casual' | 'empathetic' | 'humorous',
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post<{ data: ReplyOptions }>(
          `${API_URL}/api/ai/reply-suggestions`,
          {
            messageId,
            conversationId,
            content,
            conversationHistory,
            tone,
          },
        );
        return response.data.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          'Failed to generate reply suggestions';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getUsageStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ data: UsageStats }>(
        `${API_URL}/api/ai/usage`,
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || 'Failed to fetch usage stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAIHealth = useCallback(async () => {
    try {
      const response = await axios.get<{
        data: { healthy: boolean; message: string };
      }>(`${API_URL}/api/ai/health`);
      return response.data.data.healthy;
    } catch {
      return false;
    }
  }, []);

  return {
    loading,
    error,
    analyzeSentiment,
    categorizeMessage,
    generateReplySuggestions,
    getUsageStats,
    checkAIHealth,
  };
};
