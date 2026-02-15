'use client';

import { useState } from 'react';
import { useThemeStore } from '@/lib/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConnectedChannels } from '@/components/settings/connected-channels';

export default function SettingsPage() {
  const { isDark, toggleTheme } = useThemeStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="channels">
        <TabsList>
          <TabsTrigger value="channels">Connected Channels</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="mt-6">
          <ConnectedChannels />
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <div className="space-y-6">
            {/* Appearance */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-neutral-500">Toggle dark theme</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDark ? 'bg-blue-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Notifications */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Notifications</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-neutral-500">Receive message notifications</p>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-blue-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div>
                    <p className="font-medium">Sound</p>
                    <p className="text-sm text-neutral-500">Play sound for new messages</p>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      soundEnabled ? 'bg-blue-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Account */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Account</h2>
              <div className="space-y-3">
                <a
                  href="/auth/login"
                  className="block p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <p className="font-medium text-red-600">Sign Out</p>
                  <p className="text-sm text-neutral-500">Log out of your account</p>
                </a>
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
