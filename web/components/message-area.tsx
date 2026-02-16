'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, AlertCircle, ArrowDown, Check, CheckCheck, Clock, Paperclip } from 'lucide-react';
import { useAuthStore, useConversationStore } from '@/lib/store';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import ConversationHeader from '@/components/conversation-header';
import {
  onMessageReceived,
  onTypingStart,
  onTypingStop,
  subscribeToConversation,
  unsubscribeFromConversation,
  type SocketMessage,
  type TypingPayload,
} from '@/lib/socket';

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
  _optimistic?: boolean;
  _failed?: boolean;
}

interface MessageAreaProps {
  conversationId: string;
  onBack?: () => void;
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
  instagram_dm: 'Instagram',
  linkedin_dm: 'LinkedIn',
  telegram: 'Telegram',
  slack: 'Slack',
};

export default function MessageArea({ conversationId, onBack }: MessageAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();
  const { addMessageToConversation } = useConversationStore();

  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get(`/conversations/${conversationId}/messages`);
      const data = response.data?.data ?? response.data;
      const msgs = data.messages ?? data ?? [];
      setMessages(Array.isArray(msgs) ? [...msgs].reverse() : []);
    } catch (err) {
      setError('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom('instant');
    }
  }, [messages, isNearBottom, scrollToBottom]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollButton(!isNearBottom());
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isNearBottom]);

  // WebSocket: subscribe to conversation and listen for new messages
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    subscribeToConversation(conversationId);

    const unsubMessage = onMessageReceived((data: SocketMessage) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    });

    const unsubTypingStart = onTypingStart((data: TypingPayload) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUser(data.displayName);
      }
    });

    const unsubTypingStop = onTypingStop((data: TypingPayload) => {
      if (data.conversationId === conversationId) {
        setTypingUser(null);
      }
    });

    return () => {
      unsubscribeFromConversation(conversationId);
      unsubMessage();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [conversationId, user?.id]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      content,
      senderExternalId: user?.id || '',
      senderName: user?.displayName || 'You',
      direction: 'outbound',
      channelType: '',
      createdAt: new Date().toISOString(),
      isRead: false,
      status: 'sending',
      _optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    addMessageToConversation(conversationId, content, 'outbound');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await apiClient.post('/messages', {
        conversationId,
        content,
      });
      const msg = response.data?.data?.message ?? response.data;
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...msg, _optimistic: false } : m))
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...m, _failed: true, status: 'failed' } : m
        )
      );
    }
  };

  const retryMessage = async (failedMsg: Message) => {
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    setNewMessage(failedMsg.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Auto-grow
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
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

  const getDateKey = (ts: string) => new Date(ts).toDateString();

  const getStatusIcon = (msg: Message) => {
    if (msg._failed) return <AlertCircle size={12} className="text-destructive" />;
    if (msg._optimistic) return <Clock size={12} className="text-blue-200" />;
    if (msg.isRead) return <CheckCheck size={12} className="text-blue-200" />;
    if (msg.status === 'delivered') return <CheckCheck size={12} className="text-blue-200/60" />;
    return <Check size={12} className="text-blue-200/60" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <ConversationHeader onBack={onBack} />

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 relative"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <AlertCircle size={32} className="text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={loadMessages}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Send size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((message, idx) => {
            const isOutbound = message.direction === 'outbound';
            const showDate =
              idx === 0 ||
              getDateKey(messages[idx - 1].createdAt) !== getDateKey(message.createdAt);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    'flex mb-1',
                    isOutbound ? 'justify-end' : 'justify-start',
                    message._optimistic && !message._failed && 'opacity-70'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[75%] lg:max-w-md px-3.5 py-2 rounded-2xl message-enter',
                      isOutbound
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md',
                      message._failed && 'ring-2 ring-destructive/50'
                    )}
                  >
                    {!isOutbound && (
                      <p className="text-[11px] font-medium mb-0.5 opacity-70">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1',
                      isOutbound ? 'justify-end' : ''
                    )}>
                      {message.channelType && (
                        <span className="text-[10px] opacity-50">
                          {CHANNEL_LABELS[message.channelType] || message.channelType}
                        </span>
                      )}
                      <span className={cn(
                        'text-[10px]',
                        isOutbound ? 'opacity-70' : 'text-muted-foreground'
                      )}>
                        {formatTime(message.createdAt)}
                      </span>
                      {isOutbound && getStatusIcon(message)}
                    </div>
                    {message._failed && (
                      <button
                        onClick={() => retryMessage(message)}
                        className="text-[11px] mt-1 underline opacity-80 hover:opacity-100"
                      >
                        Tap to retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 bg-card border border-border shadow-lg rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
            aria-label="Scroll to latest messages"
          >
            <ArrowDown size={16} />
          </button>
        )}
      </div>

      {/* Typing indicator */}
      {typingUser && (
        <div className="px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
          <span className="typing-indicator flex gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          </span>
          <span>{typingUser} is typing...</span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 bg-card">
        <div className="flex items-end gap-2">
          <button
            disabled
            className="p-2 rounded-md text-muted-foreground opacity-40 cursor-not-allowed"
            aria-label="Attach file (coming soon)"
            title="Attachments coming soon"
          >
            <Paperclip size={20} />
          </button>
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring max-h-40"
            style={{ height: 'auto', minHeight: '40px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              newMessage.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-muted-foreground bg-muted cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 ml-10">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
