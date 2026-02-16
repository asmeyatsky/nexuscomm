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
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setSelectedChannel(null);
    setDisplayName('');
    setIdentifier('');
    setFieldValues({});
    setIsSubmitting(false);
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !identifier.trim()) return;

    const config = CHANNEL_CONFIG[selectedChannel];

    // Validate required fields
    for (const field of config.fields) {
      if (field.required && !fieldValues[field.key]?.trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Separate accessToken from metadata fields
      const accessToken = fieldValues['accessToken']?.trim();
      const metadata: Record<string, unknown> = {};
      for (const field of config.fields) {
        if (field.key !== 'accessToken' && fieldValues[field.key]?.trim()) {
          metadata[field.key] = fieldValues[field.key].trim();
        }
      }

      const payload: ConnectAccountPayload = {
        channelType: selectedChannel,
        identifier: identifier.trim(),
        displayName: displayName.trim() || config.displayName,
      };

      if (accessToken) {
        payload.accessToken = accessToken;
      }

      if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
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
                  onClick={() => ch.supported && setSelectedChannel(type)}
                  disabled={!ch.supported}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${
                    ch.supported
                      ? 'hover:bg-accent cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl">{ch.icon}</span>
                  <span className="text-xs font-medium">{ch.displayName}</span>
                  {!ch.supported && (
                    <span className="text-[10px] text-muted-foreground">Coming soon</span>
                  )}
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

            {config!.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {!field.required && (
                    <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
                  )}
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={fieldValues[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  required={field.required}
                />
              </div>
            ))}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedChannel(null);
                  setFieldValues({});
                }}
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
