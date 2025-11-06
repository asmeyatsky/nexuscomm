/**
 * ReplySuggestions Component
 * Displays AI-generated reply suggestions that users can click to insert.
 */

import React from 'react';

export interface Suggestion {
  text: string;
  confidence: number;
  tone: 'professional' | 'casual' | 'empathetic' | 'humorous';
  lengthCategory: 'short' | 'medium' | 'long';
  rationale?: string;
}

export interface ReplySuggestionsProps {
  suggestions: Suggestion[];
  onSelectSuggestion: (text: string) => void;
  isLoading?: boolean;
  error?: string;
  maxDisplayed?: number;
}

const ReplySuggestions: React.FC<ReplySuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  isLoading = false,
  error,
  maxDisplayed = 3,
}) => {
  const getToneEmoji = (tone: string): string => {
    switch (tone) {
      case 'professional':
        return '💼';
      case 'casual':
        return '👋';
      case 'empathetic':
        return '❤️';
      case 'humorous':
        return '😄';
      default:
        return '💬';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'bg-green-50 border-green-200';
    if (confidence >= 0.7) return 'bg-yellow-50 border-yellow-200';
    return 'bg-orange-50 border-orange-200';
  };

  const displayedSuggestions = suggestions.slice(0, maxDisplayed);

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Failed to generate suggestions: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <div className="text-sm font-medium text-gray-600 mb-2">Generating suggestions...</div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (displayedSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✨</span>
        <span className="text-sm font-semibold text-gray-700">AI Suggestions</span>
      </div>

      <div className="space-y-2">
        {displayedSuggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(suggestion.text)}
            className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md active:scale-95 ${getConfidenceColor(
              suggestion.confidence,
            )} hover:border-blue-400`}
            title={
              suggestion.rationale
                ? `Why: ${suggestion.rationale}`
                : `Confidence: ${Math.round(suggestion.confidence * 100)}%`
            }
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm flex-shrink-0">{getToneEmoji(suggestion.tone)}</span>
                <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                  {suggestion.tone}
                </span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {suggestion.lengthCategory}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-700 flex-shrink-0">
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-800 line-clamp-2">{suggestion.text}</p>
          </button>
        ))}
      </div>

      {suggestions.length > maxDisplayed && (
        <div className="text-xs text-gray-600 pt-1 border-t border-blue-200">
          +{suggestions.length - maxDisplayed} more suggestions available
        </div>
      )}
    </div>
  );
};

export default ReplySuggestions;
