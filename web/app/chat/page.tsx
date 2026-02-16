'use client';

import { useState, useEffect, useCallback } from 'react';
import ConversationList from '@/components/conversation-list';
import MessageArea from '@/components/message-area';
import { useConversationStore } from '@/lib/store';
import { initSocket } from '@/lib/socket';
import apiClient from '@/lib/api-client';

export default function ChatPage() {
  const { selectedId, setConversations, setLoading } = useConversationStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/conversations');
      const data = response.data?.data ?? response.data;
      setConversations(data.conversations ?? []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [setConversations, setLoading]);

  useEffect(() => {
    initSocket();
    fetchConversations();
    setIsInitialized(true);
  }, [fetchConversations]);

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
