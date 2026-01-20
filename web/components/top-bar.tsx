'use client';

import { useAuthStore } from '@/lib/store';

export default function TopBar() {
  const { user, logout } = useAuthStore();

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-lg font-semibold text-gray-900">
        NexusComm
      </div>
      
      <div className="flex items-center space-x-4">
        {user && (
          <>
            <span className="text-sm text-gray-600">
              {user.displayName || user.email}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}