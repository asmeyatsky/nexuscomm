'use client';

import { useState } from 'react';

interface MessageInputProps {
  onSend: (content: string, options?: Record<string, unknown>) => void;
  placeholder?: string;
  enableEnhancements?: boolean;
}

/**
 * Legacy MessageInput component - kept for enhanced-page.tsx compatibility.
 * Primary message input is now in components/message-area.tsx.
 */
export function MessageInput({ onSend, placeholder = 'Type a message...' }: MessageInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border border-input rounded-md bg-background text-foreground"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
