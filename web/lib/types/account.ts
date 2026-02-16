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
  metadata?: Record<string, unknown>;
}

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success';

export const SYNC_STATUS_MAP: Record<number, { label: string; variant: BadgeVariant }> = {
  0: { label: 'Not Synced', variant: 'secondary' },
  1: { label: 'Syncing', variant: 'default' },
  2: { label: 'Connected', variant: 'success' },
  3: { label: 'Error', variant: 'destructive' },
};

export interface ChannelField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'password';
}

export interface ChannelConfig {
  displayName: string;
  icon: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  supported: boolean;
  fields: ChannelField[];
}

export const CHANNEL_CONFIG: Record<ChannelType, ChannelConfig> = {
  whatsapp: {
    displayName: 'WhatsApp',
    icon: '💬',
    identifierLabel: 'Phone Number',
    identifierPlaceholder: '+1 234 567 8900',
    supported: true,
    fields: [
      { key: 'phoneId', label: 'Phone Number ID', placeholder: 'From Meta Business dashboard', required: true, type: 'text' },
      { key: 'accountId', label: 'Business Account ID', placeholder: 'WhatsApp Business Account ID', required: true, type: 'text' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Permanent access token', required: true, type: 'password' },
      { key: 'webhookVerifyToken', label: 'Webhook Verify Token', placeholder: 'Custom verify token for webhook', required: true, type: 'text' },
    ],
  },
  sms: {
    displayName: 'SMS',
    icon: '📱',
    identifierLabel: 'Phone Number',
    identifierPlaceholder: '+1 234 567 8900',
    supported: false,
    fields: [],
  },
  email: {
    displayName: 'Email',
    icon: '📧',
    identifierLabel: 'Email Address',
    identifierPlaceholder: 'user@example.com',
    supported: true,
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'Google OAuth access token', required: true, type: 'password' },
    ],
  },
  instagram_dm: {
    displayName: 'Instagram',
    icon: '📷',
    identifierLabel: 'Username',
    identifierPlaceholder: '@username',
    supported: true,
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'Instagram Graph API token', required: true, type: 'password' },
      { key: 'igUserId', label: 'Business Account ID', placeholder: 'Instagram Business Account ID', required: false, type: 'text' },
    ],
  },
  linkedin_dm: {
    displayName: 'LinkedIn',
    icon: '💼',
    identifierLabel: 'Profile URL',
    identifierPlaceholder: 'linkedin.com/in/username',
    supported: true,
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'LinkedIn OAuth access token', required: true, type: 'password' },
      { key: 'personUrn', label: 'Person URN', placeholder: 'urn:li:person:xxxxxxxx', required: false, type: 'text' },
    ],
  },
  telegram: {
    displayName: 'Telegram',
    icon: '✈️',
    identifierLabel: 'Username',
    identifierPlaceholder: '@username',
    supported: false,
    fields: [],
  },
  slack: {
    displayName: 'Slack',
    icon: '🔔',
    identifierLabel: 'Workspace Email',
    identifierPlaceholder: 'user@workspace.slack.com',
    supported: false,
    fields: [],
  },
};
