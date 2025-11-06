/**
 * SentimentBadge Component
 * Displays message sentiment analysis results with visual indicators.
 */

import React from 'react';

export interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
}

const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  confidence,
  size = 'md',
  showConfidence = true,
}) => {
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSentimentEmoji = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      case 'neutral':
        return '😐';
      default:
        return '❓';
    }
  };

  const getSizeClasses = (size: string): string => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      case 'md':
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const confidencePercentage = Math.round(confidence * 100);

  return (
    <div
      className={`inline-flex items-center gap-2 border rounded-full font-medium ${getSizeClasses(
        size,
      )} ${getSentimentColor(sentiment)}`}
      title={`${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} sentiment (${confidencePercentage}% confidence)`}
    >
      <span>{getSentimentEmoji(sentiment)}</span>
      <span>{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}</span>
      {showConfidence && <span className="opacity-70">({confidencePercentage}%)</span>}
    </div>
  );
};

export default SentimentBadge;
