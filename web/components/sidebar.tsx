'use client';

import { useThemeStore } from '@/lib/store';

export default function Sidebar() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className={`w-64 h-full ${isDark ? 'bg-gray-800' : 'bg-white'} border-r border-gray-200`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            NexusComm
          </h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
          >
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>
        
        <nav className="space-y-2">
          <a
            href="/chat"
            className={`block px-3 py-2 rounded-lg transition-colors ${
              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            💬 Chat
          </a>
          <a
            href="/settings"
            className={`block px-3 py-2 rounded-lg transition-colors ${
              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⚙️ Settings
          </a>
        </nav>
      </div>
    </div>
  );
}