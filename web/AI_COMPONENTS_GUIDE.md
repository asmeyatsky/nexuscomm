# AI Components Guide

Complete guide to using AI-powered React components in NexusComm web app.

## Overview

The AI components provide a ready-to-use React interface for displaying AI analysis results, managing quotas, and generating suggestions.

## Components

### 1. SentimentBadge

Displays message sentiment analysis with visual indicators.

```tsx
import { SentimentBadge } from '@/components/ai';

<SentimentBadge
  sentiment="positive"
  confidence={0.95}
  size="md"
  showConfidence={true}
/>
```

**Props:**
- `sentiment`: 'positive' | 'neutral' | 'negative'
- `confidence`: 0-1 confidence score
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `showConfidence`: boolean (default: true)

**Features:**
- Color-coded by sentiment (green/gray/red)
- Emoji indicators (😊/😐/😞)
- Confidence percentage display

### 2. CategoryTags

Shows message categories and themes.

```tsx
import { CategoryTags } from '@/components/ai';

<CategoryTags
  primaryCategory="question"
  secondaryCategories={['urgent', 'customer-feedback']}
  themes={[
    { name: 'pricing', relevance: 0.9 },
    { name: 'support', relevance: 0.7 }
  ]}
  maxTags={5}
/>
```

**Props:**
- `primaryCategory`: string (required)
- `secondaryCategories`: string[] (default: [])
- `themes`: Array<{name, relevance}> (default: [])
- `showConfidence`: boolean (default: true)
- `maxTags`: number (default: 5)

**Features:**
- Different colors for primary/secondary/themes
- Relevance score display
- Emoji indicators for each type

### 3. ReplySuggestions

Displays AI-generated reply suggestions.

```tsx
import { ReplySuggestions } from '@/components/ai';

<ReplySuggestions
  suggestions={[
    {
      text: "Thank you for reaching out!",
      confidence: 0.95,
      tone: "professional",
      lengthCategory: "short"
    }
  ]}
  onSelectSuggestion={(text) => setComposerText(text)}
  isLoading={false}
  maxDisplayed={3}
/>
```

**Props:**
- `suggestions`: Suggestion[] (required)
- `onSelectSuggestion`: (text: string) => void (required)
- `isLoading`: boolean (default: false)
- `error`: string (optional)
- `maxDisplayed`: number (default: 3)

**Features:**
- One-click insertion of suggestions
- Tone and length indicators
- Confidence scoring
- Loading state with skeleton loaders

### 4. AIUsageMetrics

Shows user's AI quota usage and costs.

```tsx
import { AIUsageMetrics } from '@/components/ai';

<AIUsageMetrics
  metrics={metricsData}
  isLoading={false}
  onRefresh={() => fetchMetrics()}
/>
```

**Props:**
- `metrics`: UsageMetrics (optional)
- `isLoading`: boolean (default: false)
- `error`: string (optional)
- `onRefresh`: () => void (optional)

**Features:**
- Daily and monthly view toggle
- Progress bars for quotas
- Cost tracking in USD
- Warning alerts when near limits
- Refresh button

### 5. MessageWithAI

Complete message component with integrated AI analysis.

```tsx
import { MessageWithAI } from '@/components/ai';

<MessageWithAI
  messageId="msg-123"
  content="Hello, how can I help you?"
  sender="John Doe"
  timestamp={new Date()}
  showAIAnalysis={true}
  conversationContext="Customer support chat"
/>
```

**Props:**
- `messageId`: string (required)
- `content`: string (required)
- `sender`: string (required)
- `timestamp`: Date (required)
- `showAIAnalysis`: boolean (default: true)
- `conversationContext`: string (optional)

**Features:**
- Automatic sentiment and categorization
- Displays insights
- Loading states
- Error handling

### 6. AIPanel

Main AI features panel with tabs for insights, suggestions, and usage.

```tsx
import { AIPanel } from '@/components/ai';

<AIPanel
  conversationId="conv-123"
  messageId="msg-456"
  messageContent="User's message here"
  onSuggestionSelected={(text) => insertReply(text)}
  compact={false}
/>
```

**Props:**
- `conversationId`: string (required)
- `messageId`: string (optional)
- `messageContent`: string (optional)
- `onSuggestionSelected`: (text: string) => void (optional)
- `compact`: boolean (default: false)

**Features:**
- Three tabs: Insights, Suggestions, Usage
- Automatic message analysis
- Suggestion generation on demand
- Real-time usage metrics
- Health status checking

## useAIAnalysis Hook

React hook for consuming AI API endpoints.

```tsx
import { useAIAnalysis } from '@/lib/hooks/useAIAnalysis';

const MyComponent = () => {
  const {
    analyzeSentiment,
    categorizeMessage,
    generateReplySuggestions,
    getUsageStats,
    checkAIHealth,
    loading,
    error
  } = useAIAnalysis();

  const handleAnalyze = async () => {
    const result = await analyzeSentiment('msg-1', 'Hello!');
    console.log(result);
  };

  return <button onClick={handleAnalyze}>Analyze</button>;
};
```

**Methods:**
- `analyzeSentiment(messageId, content, context?)`: Promise<MessageAnalysis>
- `categorizeMessage(messageId, content, context?)`: Promise<MessageCategory>
- `generateReplySuggestions(messageId, conversationId, content, history?, tone?)`: Promise<ReplyOptions>
- `getUsageStats()`: Promise<UsageStats>
- `checkAIHealth()`: Promise<boolean>

**Returns:**
- `loading`: boolean
- `error`: string | null

## Usage Examples

### Basic Message Display with AI

```tsx
import { MessageWithAI } from '@/components/ai';

export const ConversationView = () => {
  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <MessageWithAI
          key={msg.id}
          messageId={msg.id}
          content={msg.content}
          sender={msg.senderName}
          timestamp={msg.createdAt}
          showAIAnalysis={true}
        />
      ))}
    </div>
  );
};
```

### Message Composer with Suggestions

```tsx
import { useAIAnalysis, ReplySuggestions } from '@/components/ai';
import { useState } from 'react';

export const MessageComposer = ({ conversationId, lastMessageId }) => {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const { generateReplySuggestions, loading } = useAIAnalysis();

  const handleGetSuggestions = async () => {
    try {
      const result = await generateReplySuggestions(
        lastMessageId,
        conversationId,
        text
      );
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error('Failed to get suggestions', err);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message..."
        className="w-full p-3 border rounded-lg"
      />

      <button
        onClick={handleGetSuggestions}
        disabled={!text || loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        Get AI Suggestions
      </button>

      {suggestions.length > 0 && (
        <ReplySuggestions
          suggestions={suggestions}
          onSelectSuggestion={(suggestion) => {
            setText(suggestion);
            setSuggestions([]);
          }}
        />
      )}
    </div>
  );
};
```

### Sidebar with AI Insights and Usage

```tsx
import { AIPanel, AIUsageMetrics } from '@/components/ai';
import { useState } from 'react';

export const Sidebar = ({ conversationId, currentMessageId }) => {
  return (
    <div className="w-80 bg-gray-50 p-4 space-y-6">
      <AIPanel
        conversationId={conversationId}
        messageId={currentMessageId}
      />
    </div>
  );
};
```

## Styling

All components use Tailwind CSS for styling. Ensure your app includes:

```tsx
// tailwind.config.ts
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
};
```

## Error Handling

All components include built-in error handling:

```tsx
<ReplySuggestions
  suggestions={[]}
  onSelectSuggestion={() => {}}
  error="Failed to generate suggestions"
/>
```

## Environment Setup

Required environment variable in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Accessibility

All components include:
- ARIA labels and descriptions
- Keyboard navigation support
- Color-independent indicators (not relying on color alone)
- Loading states with clear feedback

## Performance

Components are optimized for:
- Memoization of suggestions and analysis
- Lazy loading of expensive analyses
- Caching of usage metrics
- Debounced API calls

## Type Safety

All components are fully typed with TypeScript:

```tsx
import type { SentimentBadgeProps, MessageAnalysis } from '@/components/ai';
```

## Integration Checklist

- [ ] Install components in your message display
- [ ] Set up `useAIAnalysis` hook in your app
- [ ] Add `NEXT_PUBLIC_API_URL` to `.env.local`
- [ ] Test sentiment badges on sample messages
- [ ] Test suggestion generation
- [ ] Verify usage metrics display
- [ ] Test error states
- [ ] Ensure loading states work correctly
- [ ] Test responsive design on mobile
- [ ] Verify accessibility with screen reader

## Troubleshooting

### Components not showing

1. Check `NEXT_PUBLIC_API_URL` is set correctly
2. Verify backend API is running
3. Check browser console for errors
4. Ensure Tailwind CSS is included

### API errors (429 Rate Limit)

User has exceeded quota. Check usage metrics:

```tsx
const { getUsageStats } = useAIAnalysis();
const stats = await getUsageStats();
// User should wait until daily/monthly reset
```

### Suggestions not appearing

1. Ensure `generateReplySuggestions` completes
2. Check message content is not empty
3. Verify conversation ID is valid
4. Check error state in component

## Future Enhancements

- [ ] Caching layer for analysis results
- [ ] Optimistic UI updates
- [ ] Batch analysis for multiple messages
- [ ] Analytics tracking
- [ ] A/B testing different suggestions
- [ ] Custom category definitions
