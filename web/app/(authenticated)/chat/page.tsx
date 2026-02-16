'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import ConversationList from '@/components/conversation-list';
import MessageArea from '@/components/message-area';
import { useConversationStore } from '@/lib/store';
import { initSocket, onConversationUpdate, type ConversationUpdatePayload } from '@/lib/socket';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { selectedId, selectConversation, setConversations, setLoading, updateConversation } = useConversationStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [mobileShowMessages, setMobileShowMessages] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/conversations');
      const data = response.data?.data ?? response.data;
      setConversations(data.conversations ?? []);
    } catch {
      // Error handled silently - conversations will show empty state
    } finally {
      setLoading(false);
    }
  }, [setConversations, setLoading]);

  useEffect(() => {
    initSocket();
    fetchConversations();
    setIsInitialized(true);
  }, [fetchConversations]);

  // Listen for conversation updates via WebSocket
  useEffect(() => {
    const unsub = onConversationUpdate((data: ConversationUpdatePayload) => {
      updateConversation(data.id, {
        lastMessage: data.lastMessage,
        lastMessageDirection: data.lastMessageDirection,
        lastMessageTimestamp: data.lastMessageTimestamp,
        unreadCount: data.unreadCount,
      });
    });
    return unsub;
  }, [updateConversation]);

  const handleSelectConversation = () => {
    setMobileShowMessages(true);
  };

  const handleBack = () => {
    setMobileShowMessages(false);
    selectConversation('');
  };

  return (
    <div className="flex h-full">
      {/* Conversation list - hidden on mobile when viewing messages */}
      <div
        className={cn(
          'w-full md:w-80 border-r border-border flex flex-col shrink-0',
          mobileShowMessages ? 'hidden md:flex' : 'flex'
        )}
      >
        <ConversationList onSelectConversation={handleSelectConversation} />
      </div>

      {/* Message area or empty state */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0',
          !mobileShowMessages ? 'hidden md:flex' : 'flex'
        )}
      >
        {selectedId && isInitialized ? (
          <MessageArea conversationId={selectedId} onBack={handleBack} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Select a conversation
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
