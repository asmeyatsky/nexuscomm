'use client';

import { ArrowLeft, Pin, BellOff, Archive } from 'lucide-react';
import { useConversationStore } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
  instagram_dm: 'Instagram',
  linkedin_dm: 'LinkedIn',
  telegram: 'Telegram',
  slack: 'Slack',
};

interface ConversationHeaderProps {
  onBack?: () => void;
}

export default function ConversationHeader({ onBack }: ConversationHeaderProps) {
  const { conversations, selectedId, updateConversation } = useConversationStore();
  const conversation = conversations.find((c) => c.id === selectedId);

  if (!conversation) return null;

  const names = conversation.participantNames?.join(', ') || 'Unnamed';
  const channel = conversation.channels?.[0];
  const initials = getInitials(conversation.participantNames);

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{names}</h2>
          {channel && (
            <p className="text-xs text-muted-foreground">
              via {CHANNEL_LABELS[channel] || channel}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => updateConversation(conversation.id, { isPinned: !conversation.isPinned })}
          className={cn(
            'p-2 rounded-md transition-colors',
            conversation.isPinned
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          aria-label={conversation.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={16} />
        </button>
        <button
          onClick={() => updateConversation(conversation.id, { isMuted: !conversation.isMuted })}
          className={cn(
            'p-2 rounded-md transition-colors',
            conversation.isMuted
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          aria-label={conversation.isMuted ? 'Unmute' : 'Mute'}
        >
          <BellOff size={16} />
        </button>
        <button
          onClick={() => updateConversation(conversation.id, { isArchived: !conversation.isArchived })}
          className={cn(
            'p-2 rounded-md transition-colors',
            conversation.isArchived
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          aria-label={conversation.isArchived ? 'Unarchive' : 'Archive'}
        >
          <Archive size={16} />
        </button>
      </div>
    </div>
  );
}

function getInitials(names?: string[]): string {
  if (!names || names.length === 0) return '?';
  const name = names[0];
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
