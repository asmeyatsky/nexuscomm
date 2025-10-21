'use client';

import { useState, useEffect } from 'react';
import { ConversationList } from '@/components/conversation-list';
import { MessageArea } from '@/components/message-area';
import { useConversationStore } from '@/lib/store';
import { initSocket } from '@/lib/socket';

export default function ChatPage() {
  const { selectedId } = useConversationStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    initSocket();
    setIsInitialized(true);
  }, []);

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <ConversationList />
      </div>

      {/* Message area or empty state */}
      <div className="flex-1 flex flex-col">
        {selectedId && isInitialized ? (
          <MessageArea conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-neutral-500 dark:text-neutral-400">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
