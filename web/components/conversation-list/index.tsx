'use client';

import { useConversationStore } from '@/lib/store';

export default function ConversationList() {
  const { conversations, selectedId, selectConversation } = useConversationStore();

  return (
    <div className="w-64 h-full bg-gray-50 border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedId === conversation.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => selectConversation(conversation.id)}
            >
              <div className="font-medium">{conversation.participantNames.join(', ')}</div>
              <div className="text-sm text-gray-600 truncate">{conversation.lastMessage}</div>
              {conversation.unreadCount > 0 && (
                <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conversation.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}