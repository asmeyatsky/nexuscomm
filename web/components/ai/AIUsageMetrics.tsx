/**
 * AIUsageMetrics Component
 * Displays user's AI quota usage and cost tracking.
 */

import React, { useEffect, useState } from 'react';

export interface UsageMetrics {
  todayRequests: number;
  todayTokens: number;
  todayCost: number;
  monthRequests: number;
  monthTokens: number;
  monthCost: number;
  dailyLimitRemaining: number;
  monthlyLimitRemaining: number;
}

export interface AIUsageMetricsProps {
  metrics?: UsageMetrics;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

const AIUsageMetrics: React.FC<AIUsageMetricsProps> = ({
  metrics,
  isLoading = false,
  error,
  onRefresh,
}) => {
  const [displayMode, setDisplayMode] = useState<'daily' | 'monthly'>('daily');

  const getProgressColor = (used: number, limit: number): string => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressPercentage = (used: number, limit: number): number => {
    return Math.min((used / limit) * 100, 100);
  };

  const renderProgressBar = (used: number, limit: number, label: string): JSX.Element => {
    const percentage = getProgressPercentage(used, limit);
    const color = getProgressColor(used, limit);

    return (
      <div key={label} className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-600">
            {used.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-sm text-gray-600">No usage data available</p>
      </div>
    );
  }

  const isDailyHeavy = (metrics.todayRequests / 1000) * 100 >= 80;
  const isMonthlyHeavy = (metrics.monthRequests / 20000) * 100 >= 80;

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold text-gray-800">AI Usage</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDisplayMode('daily')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              displayMode === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDisplayMode('monthly')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              displayMode === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {(displayMode === 'daily' && isDailyHeavy) ||
      (displayMode === 'monthly' && isMonthlyHeavy) ? (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          ⚠️ Approaching quota limit. Consider limiting AI operations.
        </div>
      ) : null}

      {/* Metrics */}
      <div className="space-y-4">
        {displayMode === 'daily' ? (
          <>
            {renderProgressBar(
              metrics.todayRequests,
              1000,
              'Requests (1,000/day)',
            )}
            {renderProgressBar(
              metrics.todayTokens,
              100000,
              'Tokens (100K/day)',
            )}

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Estimated Cost Today</span>
                <span className="text-sm font-bold text-gray-900">
                  ${metrics.todayCost.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600">Daily limit: $10.00</div>
            </div>
          </>
        ) : (
          <>
            {renderProgressBar(
              metrics.monthRequests,
              20000,
              'Requests (20K/month)',
            )}
            {renderProgressBar(
              metrics.monthTokens,
              1000000,
              'Tokens (1M/month)',
            )}

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Estimated Cost This Month</span>
                <span className="text-sm font-bold text-gray-900">
                  ${metrics.monthCost.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600">Monthly limit: $100.00</div>
            </div>
          </>
        )}
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="mt-4 w-full px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      )}
    </div>
  );
};

export default AIUsageMetrics;
