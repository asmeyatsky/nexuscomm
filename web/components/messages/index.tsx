'use client';

export function MessageList({ conversationId }: { conversationId: string }) {
  return <div>Message List</div>;
}

export function MessageInput({ conversationId }: { conversationId: string }) {
  return <input placeholder="Type a message..." className="border p-2 w-full" />;
}
