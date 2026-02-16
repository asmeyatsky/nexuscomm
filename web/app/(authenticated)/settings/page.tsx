'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConnectedChannels } from '@/components/settings/connected-channels';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Settings</h1>

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
              <h2 className="text-lg font-semibold mb-4 text-foreground">Appearance</h2>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                </div>
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDark ? 'bg-primary' : 'bg-muted'
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
              <h2 className="text-lg font-semibold mb-4 text-foreground">Notifications</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive message notifications</p>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Sound</p>
                    <p className="text-sm text-muted-foreground">Play sound for new messages</p>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      soundEnabled ? 'bg-primary' : 'bg-muted'
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
              <h2 className="text-lg font-semibold mb-4 text-foreground">Account</h2>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border">
                  <p className="font-medium text-destructive">Sign Out</p>
                  <p className="text-sm text-muted-foreground">Use the menu in the top bar to sign out</p>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
