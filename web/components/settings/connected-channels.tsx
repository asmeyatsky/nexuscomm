'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/lib/hooks/use-accounts';
import { ChannelList } from './channel-list';
import { ConnectChannelDialog } from './connect-channel-dialog';

export function ConnectedChannels() {
  const { accounts, isLoading, error, connect, disconnect } = useAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading channels...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">
        <p>Failed to load channels: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Connected Channels</h2>
          <p className="text-sm text-muted-foreground">
            Manage your messaging channels and integrations.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Connect Channel</Button>
      </div>

      <ChannelList accounts={accounts} onDisconnect={disconnect} />

      <ConnectChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnect={connect}
      />
    </div>
  );
}
