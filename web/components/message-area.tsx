'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api-client';

interface Message {
  id: string;
  content: string;
  senderExternalId: string;
  senderName: string;
  direction: 'inbound' | 'outbound';
  channelType: string;
  createdAt: string;
  isRead: boolean;
  status: string;
}

interface MessageAreaProps {
  conversationId: string;
}

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  sms: '📱',
  email: '📧',
  instagram_dm: '📷',
  linkedin_dm: '💼',
  telegram: '✈️',
  slack: '🔔',
};

export default function MessageArea({ conversationId }: MessageAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/conversations/${conversationId}/messages`);
      const data = response.data?.data ?? response.data;
      const msgs = data.messages ?? data ?? [];
      // API returns newest first; reverse to show oldest at top
      setMessages(Array.isArray(msgs) ? [...msgs].reverse() : []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await apiClient.post('/messages', {
        conversationId,
        content: newMessage,
      });
      const msg = response.data?.data?.message ?? response.data;
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group messages by date for date separators
  const getDateKey = (ts: string) => new Date(ts).toDateString();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((message, idx) => {
            const isOutbound = message.direction === 'outbound';
            const showDate = idx === 0 || getDateKey(messages[idx - 1].createdAt) !== getDateKey(message.createdAt);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOutbound
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    {!isOutbound && (
                      <p className={`text-xs font-medium mb-1 ${isOutbound ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.senderName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : ''}`}>
                      <span className="text-[10px] opacity-60" title={message.channelType}>
                        {CHANNEL_ICONS[message.channelType] || ''}
                      </span>
                      <span className={`text-xs ${isOutbound ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
