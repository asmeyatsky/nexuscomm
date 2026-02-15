'use client';

export function MessageList({ messages }: { conversationId?: string; messages?: unknown[] }) {
  if (!messages || messages.length === 0) {
    return <div className="p-4 text-gray-500">No messages yet</div>;
  }

  return (
    <div className="space-y-4">
      {(messages || []).map((msg: unknown) => {
        const m = msg as { id?: string; content?: string; senderName?: string };
        return (
        <div key={m.id} className="p-3 border rounded">
          <div className="font-medium">{m.senderName}</div>
          <div>{m.content}</div>
        </div>
        );
      })}
    </div>
  );
}
