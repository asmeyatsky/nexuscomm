/**
 * Enhanced Web Components for MCP-Powered Features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Bell, 
  Brain,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface ConversationInsights {
  healthScore: number;
  healthStatus: string;
  sentiment: string;
  keyMetrics: {
    totalMessages: number;
    averageResponseTime: number;
    sentiment: string;
  };
  recommendations: string[];
}

interface AISuggestions {
  replies: string[];
  tone: string;
  confidence: number;
  reasoning: string;
}

interface SystemCapabilities {
  available: boolean;
  features: string[];
  mcpConnected: boolean;
  fileSystemAccess: boolean;
  shellAccess: boolean;
}

/**
 * Conversation Insights Widget
 */
export function ConversationInsights({ conversationId }: { conversationId: string }) {
  const [insights, setInsights] = useState<ConversationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [conversationId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/${conversationId}?includeInsights=true`);
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.data.insights);
      } else {
        setError('Failed to load insights');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) return <div className="animate-pulse">Loading insights...</div>;
  if (error) return <Alert><AlertDescription>{error}</AlertDescription></Alert>;
  if (!insights) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Conversation Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getHealthColor(insights.healthScore)}`}>
              {Math.round(insights.healthScore * 100)}%
            </div>
            <div className="text-sm text-gray-600">Health Score</div>
            <Badge variant={insights.healthStatus === 'healthy' ? 'default' : 'secondary'}>
              {insights.healthStatus}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {getSentimentIcon(insights.sentiment)}
              <span className="capitalize">{insights.sentiment}</span>
            </div>
            <div className="text-sm text-gray-600">Sentiment</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">{insights.keyMetrics.totalMessages}</div>
            <div className="text-sm text-gray-600">Messages</div>
          </div>
        </div>

        {insights.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">AI Recommendations</h4>
            <ul className="space-y-1">
              {insights.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * AI Reply Suggestions Component
 */
export function AIReplySuggestions({ 
  conversationId, 
  onSuggestionSelect 
}: { 
  conversationId: string; 
  onSuggestionSelect: (suggestion: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (tone: string = 'professional') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/reply-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, tone })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data);
      } else {
        setError('Failed to generate suggestions');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const tones = [
    { value: 'professional', label: 'Professional', icon: '💼' },
    { value: 'casual', label: 'Casual', icon: '😊' },
    { value: 'empathetic', label: 'Empathetic', icon: '🤗' },
    { value: 'humorous', label: 'Humorous', icon: '😄' }
  ];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Reply Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {tones.map((tone) => (
            <Button
              key={tone.value}
              variant="outline"
              size="sm"
              onClick={() => fetchSuggestions(tone.value)}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <span>{tone.icon}</span>
              {tone.label}
            </Button>
          ))}
        </div>

        {loading && <div className="animate-pulse">Generating suggestions...</div>}
        {error && <Alert><AlertDescription>{error}</AlertDescription></Alert>}

        {suggestions && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Confidence: {Math.round(suggestions.confidence * 100)}% • {suggestions.reasoning}
            </div>
            
            {suggestions.replies.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSuggestionSelect(suggestion)}
              >
                <div className="text-sm">{suggestion}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Advanced Triage Dashboard
 */
export function AdvancedTriage() {
  const [triageData, setTriageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [includeFileSystem, setIncludeFileSystem] = useState(false);

  const performTriage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeFileSystem })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTriageData(data.data);
      }
    } catch (error) {
      console.error('Triage failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Advanced Message Triage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={performTriage} disabled={loading}>
            {loading ? 'Analyzing...' : 'Perform Triage'}
          </Button>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeFileSystem}
              onChange={(e) => setIncludeFileSystem(e.target.checked)}
            />
            Include file system analysis
          </label>
        </div>

        {triageData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(triageData.standardTriage || {}).map(([category, messages]: [string, any]) => (
                <div key={category} className="border rounded-lg p-3">
                  <h4 className="font-medium capitalize mb-2">{category}</h4>
                  <div className="text-2xl font-bold">{messages.length}</div>
                  <div className="text-sm text-gray-600">conversations</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * System Status Widget
 */
export function SystemStatus() {
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapabilities();
  }, []);

  const fetchCapabilities = async () => {
    try {
      const response = await fetch('/api/system/capabilities');
      const data = await response.json();
      
      if (data.success) {
        setCapabilities(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch capabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse">Loading status...</div>;
  if (!capabilities) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${capabilities.mcpConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">MCP Server: {capabilities.mcpConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${capabilities.fileSystemAccess ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm">File System: {capabilities.fileSystemAccess ? 'Enabled' : 'Disabled'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${capabilities.shellAccess ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm">Shell Access: {capabilities.shellAccess ? 'Enabled' : 'Disabled'}</span>
        </div>

        {capabilities.features.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Available Features</h4>
            <div className="flex flex-wrap gap-1">
              {capabilities.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Intelligent Follow-up Component
 */
export function IntelligentFollowup({ conversationId }: { conversationId: string }) {
  const [reminder, setReminder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');

  const createReminder = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reminders/intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId, 
          context: context || undefined,
          priority: 'medium'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReminder(data.data);
      }
    } catch (error) {
      console.error('Failed to create reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Intelligent Follow-up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Context (optional)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Add context for this follow-up..."
            className="w-full p-2 border rounded-lg text-sm"
            rows={3}
          />
        </div>
        
        <Button onClick={createReminder} disabled={loading} className="w-full">
          {loading ? 'Creating...' : 'Create Intelligent Reminder'}
        </Button>

        {reminder && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Reminder scheduled for {new Date(reminder.optimalTiming.recommendedTime).toLocaleString()}
              with engagement score {Math.round(reminder.optimalTiming.engagementScore * 100)}%
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}