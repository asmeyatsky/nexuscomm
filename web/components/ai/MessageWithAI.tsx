/**
 * MessageWithAI Component
 * Displays a message with AI analysis results (sentiment, categories, etc).
 */

import React from 'react';

export interface MessageWithAIProps {
  messageId: string;
  content: string;
  sender: string;
  timestamp: Date;
}

const MessageWithAI: React.FC<MessageWithAIProps> = ({
  content,
  sender,
  timestamp,
}) => {
  return (
    <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{sender}</span>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
      <p className="text-gray-800">{content}</p>
    </div>
  );
};

export default MessageWithAI;
