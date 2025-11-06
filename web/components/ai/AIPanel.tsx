/**
 * AIPanel Component
 * Main AI features panel showing insights, suggestions, and usage metrics.
 * Can be displayed as a sidebar or modal.
 */

import React, { useEffect, useState } from 'react';
import SentimentBadge from './SentimentBadge';
import CategoryTags from './CategoryTags';
import ReplySuggestions, { Suggestion } from './ReplySuggestions';
import AIUsageMetrics, { UsageMetrics } from './AIUsageMetrics';
import { useAIAnalysis } from '../../lib/hooks/useAIAnalysis';

export interface AIPanelProps {
  conversationId: string;
  messageId?: string;
  messageContent?: string;
  onSuggestionSelected?: (text: string) => void;
  compact?: boolean;
}

type PanelTab = 'insights' | 'suggestions' | 'usage';

const AIPanel: React.FC<AIPanelProps> = ({
  conversationId,
  messageId,
  messageContent,
  onSuggestionSelected,
  compact = false,
}) => {
  const {
    analyzeSentiment,
    categorizeMessage,
    generateReplySuggestions,
    getUsageStats,
    checkAIHealth,
    loading,
    error,
  } = useAIAnalysis();

  const [activeTab, setActiveTab] = useState<PanelTab>('insights');
  const [aiHealthy, setAIHealthy] = useState(true);
  const [sentiment, setSentiment] = useState<any>(null);
  const [categories, setCategories] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);

  // Check AI service health on mount
  useEffect(() => {
    const check = async () => {
      const healthy = await checkAIHealth();
      setAIHealthy(healthy);
    };
    check();
  }, []);

  // Analyze current message if provided
  useEffect(() => {
    if (messageId && messageContent) {
      const analyze = async () => {
        try {
          const [sent, cat] = await Promise.all([
            analyzeSentiment(messageId, messageContent),
            categorizeMessage(messageId, messageContent),
          ]);
          setSentiment(sent);
          setCategories(cat);
        } catch (err) {
          console.error('Error analyzing message:', err);
        }
      };
      analyze();
    }
  }, [messageId, messageContent]);

  // Generate suggestions if message is provided
  const handleGenerateSuggestions = async () => {
    if (!messageId || !messageContent) return;

    setPanelLoading(true);
    try {
      const result = await generateReplySuggestions(
        messageId,
        conversationId,
        messageContent,
      );
      setSuggestions(result.suggestions);
      setActiveTab('suggestions');
    } catch (err) {
      console.error('Error generating suggestions:', err);
    } finally {
      setPanelLoading(false);
    }
  };

  // Load usage metrics
  const handleLoadUsage = async () => {
    setPanelLoading(true);
    try {
      const metrics = await getUsageStats();
      setUsageMetrics(metrics);
      setActiveTab('usage');
    } catch (err) {
      console.error('Error loading usage metrics:', err);
    } finally {
      setPanelLoading(false);
    }
  };

  if (!aiHealthy) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm font-medium text-red-800 mb-2">
          🚫 AI Service Unavailable
        </p>
        <p className="text-xs text-red-700">
          AI features are temporarily unavailable. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h3 className="font-semibold text-gray-800">AI Insights</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-blue-200">
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'insights'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          📊 Insights
        </button>
        <button
          onClick={handleGenerateSuggestions}
          disabled={!messageId || panelLoading}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 disabled:opacity-50 ${
            activeTab === 'suggestions'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          💬 Suggestions
        </button>
        <button
          onClick={handleLoadUsage}
          disabled={panelLoading}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 disabled:opacity-50 ${
            activeTab === 'usage'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          📈 Usage
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <>
            {!sentiment && !categories && !messageId ? (
              <p className="text-sm text-gray-600">
                Select a message to see AI insights
              </p>
            ) : (
              <>
                {sentiment && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2">
                      Sentiment
                    </div>
                    <SentimentBadge
                      sentiment={sentiment.sentiment.overall}
                      confidence={sentiment.sentiment.confidence}
                    />
                    {sentiment.keyInsights?.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-700 space-y-1">
                        {sentiment.keyInsights.map((insight: string, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span>•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {categories && (
                  <div className="pt-3 border-t border-blue-200">
                    <div className="text-xs font-semibold text-gray-600 mb-2">
                      Categories
                    </div>
                    <CategoryTags
                      primaryCategory={categories.primaryCategory}
                      secondaryCategories={categories.secondaryCategories}
                      themes={categories.themes}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <>
            {suggestions.length > 0 ? (
              <ReplySuggestions
                suggestions={suggestions}
                onSelectSuggestion={(text) => {
                  onSuggestionSelected?.(text);
                  setSuggestions([]);
                  setActiveTab('insights');
                }}
                isLoading={panelLoading}
              />
            ) : (
              <p className="text-sm text-gray-600">
                {panelLoading
                  ? 'Generating suggestions...'
                  : 'No suggestions yet. Select a message to generate.'}
              </p>
            )}
          </>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <AIUsageMetrics
            metrics={usageMetrics || undefined}
            isLoading={panelLoading}
            onRefresh={handleLoadUsage}
          />
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default AIPanel;
