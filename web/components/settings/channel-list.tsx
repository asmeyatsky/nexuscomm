'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Account } from '@/lib/types/account';
import { CHANNEL_CONFIG, SYNC_STATUS_MAP } from '@/lib/types/account';

interface ChannelListProps {
  accounts: Account[];
  onDisconnect: (accountId: string) => Promise<void>;
}

export function ChannelList({ accounts, onDisconnect }: ChannelListProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No channels connected</p>
        <p className="text-sm mt-1">Connect a channel to start receiving messages.</p>
      </div>
    );
  }

  const handleDisconnect = async (account: Account) => {
    const config = CHANNEL_CONFIG[account.channelType];
    const confirmed = window.confirm(
      `Disconnect ${config.displayName} (${account.identifier})? This will stop syncing messages from this channel.`
    );
    if (confirmed) {
      await onDisconnect(account.id);
    }
  };

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const config = CHANNEL_CONFIG[account.channelType];
        const status = SYNC_STATUS_MAP[account.syncStatus] ?? SYNC_STATUS_MAP[0];

        return (
          <Card key={account.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label={config.displayName}>
                  {config.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{account.displayName || config.displayName}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{account.identifier}</p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDisconnect(account)}
              >
                Disconnect
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
