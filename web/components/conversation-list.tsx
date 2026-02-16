'use client';

import { useConversationStore } from '@/lib/store';

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  sms: '📱',
  email: '📧',
  instagram_dm: '📷',
  linkedin_dm: '💼',
  telegram: '✈️',
  slack: '🔔',
};

function formatTimestamp(ts?: string): string {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ConversationList() {
  const { conversations, selectedId, selectConversation, isLoading } = useConversationStore();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-gray-500 text-sm">No conversations yet</div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {conversations.map((conv) => (
            <li key={conv.id}>
              <button
                onClick={() => selectConversation(conv.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedId === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm" title={conv.channels?.[0]}>
                      {CHANNEL_ICONS[conv.channels?.[0]] || '💬'}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {conv.participantNames?.join(', ') || 'Unnamed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(conv.lastMessageTimestamp)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate pl-6">
                  {conv.lastMessageDirection === 'outbound' && (
                    <span className="text-gray-400">You: </span>
                  )}
                  {conv.lastMessage || 'No messages'}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
