'use client';

import { useState } from 'react';

export default function MessageArea() {
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-center items-center text-gray-500 h-full">
          <div className="text-center">
            <div className="text-2xl mb-4">💬</div>
            <div>Welcome to NexusComm</div>
            <div className="text-sm mt-2">Select a conversation to start messaging</div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}