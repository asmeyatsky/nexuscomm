'use client';

import { useConversationStore } from '@/lib/store';

export default function ConversationList() {
  const { conversations, selectedId, selectConversation } = useConversationStore();

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
                  <span className="font-medium text-gray-900 dark:text-white">
                    {conv.participantNames?.join(', ') || 'Unnamed'}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
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
