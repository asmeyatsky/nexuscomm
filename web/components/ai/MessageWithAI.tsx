/**
 * MessageWithAI Component
 * Displays a message with AI analysis results (sentiment, categories, etc).
 * Ready-to-use component for integrating AI insights into message display.
 */

import React, { useEffect, useState } from 'react';
import SentimentBadge from './SentimentBadge';
import CategoryTags from './CategoryTags';
import { useAIAnalysis, MessageAnalysis, MessageCategory } from '../..';

export interface MessageWithAIProps {
  messageId: string;
  content: string;
  sender: string;
  timestamp: Date;
  showAIAnalysis?: boolean;
  conversationContext?: string;
  isLoading?: boolean;
}

const MessageWithAI: React.FC<MessageWithAIProps> = ({
  messageId,
  content,
  sender,
  timestamp,
  showAIAnalysis = true,
  conversationContext,
  isLoading: externalLoading = false,
}) => {
  const { analyzeSentiment, categorizeMessage } = useAIAnalysis();
  const [sentiment, setSentiment] = useState<MessageAnalysis | null>(null);
  const [categories, setCategories] = useState<MessageCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showAIAnalysis && !sentiment && !categories && !externalLoading) {
      const analyzeMessage = async () => {
        setLoading(true);
        setError(null);
        try {
          // Fetch both in parallel
          const [sentimentResult, categoriesResult] = await Promise.all([
            analyzeSentiment(messageId, content, conversationContext).catch(() => null),
            categorizeMessage(messageId, content, conversationContext).catch(() => null),
          ]);

          if (sentimentResult) setSentiment(sentimentResult);
          if (categoriesResult) setCategories(categoriesResult);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to analyze message');
        } finally {
          setLoading(false);
        }
      };

      analyzeMessage();
    }
  }, [messageId, content, showAIAnalysis]);

  return (
    <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{sender}</span>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>
        {loading && <span className="text-xs text-blue-600">🔄 Analyzing...</span>}
      </div>

      {/* Message Content */}
      <p className="text-gray-800 mb-3">{content}</p>

      {/* AI Analysis Section */}
      {showAIAnalysis && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {sentiment && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">
                Sentiment
              </div>
              <SentimentBadge
                sentiment={sentiment.sentiment.overall}
                confidence={sentiment.sentiment.confidence}
                size="sm"
              />
            </div>
          )}

          {categories && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">
                Categories & Themes
              </div>
              <CategoryTags
                primaryCategory={categories.primaryCategory}
                secondaryCategories={categories.secondaryCategories}
                themes={categories.themes}
                showConfidence
              />
            </div>
          )}

          {sentiment?.keyInsights && sentiment.keyInsights.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">
                Insights
              </div>
              <ul className="text-xs text-gray-700 space-y-1">
                {sentiment.keyInsights.slice(0, 3).map((insight, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span>•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageWithAI;
