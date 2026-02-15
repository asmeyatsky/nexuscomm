'use client';

export function MessageInput({ 
  onSend, 
  placeholder, 
  enableEnhancements 
}: { 
  onSend?: (content: string) => void; 
  placeholder?: string; 
  enableEnhancements?: boolean 
}) {
  return (
    <div className="flex gap-2">
      <input 
        placeholder={placeholder || "Type a message..."} 
        className="flex-1 border p-2 rounded"
      />
      <button 
        onClick={() => onSend?.('')}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Send
      </button>
    </div>
  );
}
