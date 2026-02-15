export type ChannelType =
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'instagram_dm'
  | 'linkedin_dm'
  | 'telegram'
  | 'slack';

export interface Account {
  id: string;
  userId: string;
  channelType: ChannelType;
  identifier: string;
  displayName: string;
  isActive: boolean;
  syncStatus: number;
  lastSyncedAt: string | null;
  connectedAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface ConnectAccountPayload {
  channelType: ChannelType;
  identifier: string;
  displayName: string;
  accessToken?: string;
}

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success';

export const SYNC_STATUS_MAP: Record<number, { label: string; variant: BadgeVariant }> = {
  0: { label: 'Not Synced', variant: 'secondary' },
  1: { label: 'Syncing', variant: 'default' },
  2: { label: 'Connected', variant: 'success' },
  3: { label: 'Error', variant: 'destructive' },
};

export interface ChannelConfig {
  displayName: string;
  icon: string;
  identifierLabel: string;
  identifierPlaceholder: string;
}

export const CHANNEL_CONFIG: Record<ChannelType, ChannelConfig> = {
  whatsapp: {
    displayName: 'WhatsApp',
    icon: '💬',
    identifierLabel: 'Phone Number',
    identifierPlaceholder: '+1 234 567 8900',
  },
  sms: {
    displayName: 'SMS',
    icon: '📱',
    identifierLabel: 'Phone Number',
    identifierPlaceholder: '+1 234 567 8900',
  },
  email: {
    displayName: 'Email',
    icon: '📧',
    identifierLabel: 'Email Address',
    identifierPlaceholder: 'user@example.com',
  },
  instagram_dm: {
    displayName: 'Instagram',
    icon: '📷',
    identifierLabel: 'Username',
    identifierPlaceholder: '@username',
  },
  linkedin_dm: {
    displayName: 'LinkedIn',
    icon: '💼',
    identifierLabel: 'Profile URL',
    identifierPlaceholder: 'linkedin.com/in/username',
  },
  telegram: {
    displayName: 'Telegram',
    icon: '✈️',
    identifierLabel: 'Username',
    identifierPlaceholder: '@username',
  },
  slack: {
    displayName: 'Slack',
    icon: '🔔',
    identifierLabel: 'Workspace Email',
    identifierPlaceholder: 'user@workspace.slack.com',
  },
};
