'use client';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface MessageListProps {
  messages: Message[];
}

/**
 * Legacy MessageList component - kept for enhanced-page.tsx compatibility.
 * Primary message rendering is now in components/message-area.tsx.
 */
export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs px-4 py-2 rounded-lg ${
              message.isOwn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
          >
            {!message.isOwn && (
              <p className="text-xs font-medium mb-1 opacity-70">{message.sender}</p>
            )}
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
