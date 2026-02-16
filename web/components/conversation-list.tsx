'use client';

import { useState } from 'react';
import { Search, MessageSquare, Pin, Archive, VolumeX } from 'lucide-react';
import { useConversationStore, type Conversation } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: 'WA',
  sms: 'SM',
  email: 'EM',
  instagram_dm: 'IG',
  linkedin_dm: 'LI',
  telegram: 'TG',
  slack: 'SL',
};

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: 'bg-green-500',
  sms: 'bg-blue-500',
  email: 'bg-amber-500',
  instagram_dm: 'bg-pink-500',
  linkedin_dm: 'bg-sky-600',
  telegram: 'bg-cyan-500',
  slack: 'bg-purple-500',
};

function formatTimestamp(ts?: string): string {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(names: string[]): string {
  if (!names || names.length === 0) return '?';
  const name = names[0];
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function ConversationSkeleton() {
  return (
    <div className="p-3 flex items-start gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

interface ConversationListProps {
  onSelectConversation?: () => void;
}

export default function ConversationList({ onSelectConversation }: ConversationListProps) {
  const { conversations, selectedId, selectConversation, isLoading } = useConversationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      !searchQuery ||
      conv.participantNames?.some((n) =>
        n.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel =
      !channelFilter || conv.channels?.includes(channelFilter);

    return matchesSearch && matchesChannel;
  });

  // Sort: pinned first, then by last message timestamp
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const tsA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
    const tsB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
    return tsB - tsA;
  });

  const uniqueChannels = Array.from(
    new Set(conversations.flatMap((c) => c.channels || []))
  );

  const handleSelect = (id: string) => {
    selectConversation(id);
    onSelectConversation?.();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + Filter header */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {uniqueChannels.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setChannelFilter(null)}
              className={cn(
                'px-2 py-0.5 text-xs rounded-full border transition-colors',
                !channelFilter
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              All
            </button>
            {uniqueChannels.map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(channelFilter === ch ? null : ch)}
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full border transition-colors',
                  channelFilter === ch
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {ch.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Conversations will appear here when you receive messages'}
            </p>
          </div>
        ) : (
          <ul>
            {sortedConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onSelect={handleSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation: conv,
  isSelected,
  onSelect,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const channel = conv.channels?.[0];

  return (
    <li>
      <button
        onClick={() => onSelect(conv.id)}
        className={cn(
          'w-full p-3 flex items-start gap-3 text-left transition-colors hover:bg-accent/50',
          isSelected && 'bg-accent'
        )}
      >
        {/* Avatar with channel badge */}
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(conv.participantNames)}
            </AvatarFallback>
          </Avatar>
          {channel && (
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold ring-2 ring-card',
                CHANNEL_COLORS[channel] || 'bg-gray-500'
              )}
              title={channel}
            >
              {(CHANNEL_ICONS[channel] || '??').charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 min-w-0">
              {conv.isPinned && <Pin size={12} className="text-muted-foreground shrink-0" />}
              {conv.isMuted && <VolumeX size={12} className="text-muted-foreground shrink-0" />}
              <span className={cn(
                'text-sm truncate',
                conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'
              )}>
                {conv.participantNames?.join(', ') || 'Unnamed'}
              </span>
            </div>
            <span className={cn(
              'text-[11px] ml-2 shrink-0',
              conv.unreadCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'
            )}>
              {formatTimestamp(conv.lastMessageTimestamp)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className={cn(
              'text-xs truncate',
              conv.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {conv.lastMessageDirection === 'outbound' && (
                <span className="text-muted-foreground">You: </span>
              )}
              {conv.lastMessage || 'No messages'}
            </p>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {conv.isArchived && <Archive size={12} className="text-muted-foreground" />}
              {conv.unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}
