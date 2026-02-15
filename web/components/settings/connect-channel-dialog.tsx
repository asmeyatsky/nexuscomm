'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ChannelType, ConnectAccountPayload } from '@/lib/types/account';
import { CHANNEL_CONFIG } from '@/lib/types/account';

interface ConnectChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (payload: ConnectAccountPayload) => Promise<unknown>;
}

const CHANNEL_TYPES = Object.keys(CHANNEL_CONFIG) as ChannelType[];

export function ConnectChannelDialog({
  open,
  onOpenChange,
  onConnect,
}: ConnectChannelDialogProps) {
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setSelectedChannel(null);
    setDisplayName('');
    setIdentifier('');
    setAccessToken('');
    setIsSubmitting(false);
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !identifier.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ConnectAccountPayload = {
        channelType: selectedChannel,
        identifier: identifier.trim(),
        displayName: displayName.trim() || CHANNEL_CONFIG[selectedChannel].displayName,
      };
      if (accessToken.trim()) {
        payload.accessToken = accessToken.trim();
      }
      await onConnect(payload);
      handleOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect channel';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = selectedChannel ? CHANNEL_CONFIG[selectedChannel] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedChannel ? `Connect ${config!.displayName}` : 'Connect Channel'}
          </DialogTitle>
          <DialogDescription>
            {selectedChannel
              ? `Enter your ${config!.displayName} account details.`
              : 'Select a messaging channel to connect.'}
          </DialogDescription>
        </DialogHeader>

        {!selectedChannel ? (
          <div className="grid grid-cols-3 gap-2 py-4">
            {CHANNEL_TYPES.map((type) => {
              const ch = CHANNEL_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedChannel(type)}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <span className="text-2xl">{ch.icon}</span>
                  <span className="text-xs font-medium">{ch.displayName}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder={config!.displayName}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">{config!.identifierLabel}</Label>
              <Input
                id="identifier"
                placeholder={config!.identifierPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token (optional)</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Paste token here"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedChannel(null)}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting || !identifier.trim()}>
                {isSubmitting ? 'Connecting...' : 'Connect'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
