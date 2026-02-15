export function ConversationInsights({ conversationId }: { conversationId: string }) {
  return <div>Conversation Insights</div>;
}

export function AIReplySuggestions({ conversationId, onSuggestionSelect }: { conversationId: string; onSuggestionSelect?: (suggestion: string) => void }) {
  return <div>AI Suggestions</div>;
}

export function IntelligentFollowup({ conversationId }: { conversationId: string }) {
  return <div>Intelligent Follow up</div>;
}
