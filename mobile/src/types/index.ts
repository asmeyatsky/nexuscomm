export type ChannelType = 'whatsapp' | 'sms' | 'email' | 'instagram_dm' | 'linkedin_dm' | 'telegram' | 'slack';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  isEmailVerified: boolean;
}

export interface Account {
  id: string;
  userId: string;
  channelType: ChannelType;
  identifier: string;
  displayName: string;
  isActive: boolean;
  syncStatus: number;
  lastSyncedAt?: Date;
  connectedAt: Date;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  userId: string;
  participantIds: string[];
  participantNames: string[];
  participantAvatars: string[];
  channels: ChannelType[];
  lastMessage?: string;
  lastMessageTimestamp?: Date;
  lastMessageDirection?: 'inbound' | 'outbound';
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  senderExternalId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  channelType: ChannelType;
  externalId: string;
  mediaUrls: string[];
  isRead: boolean;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'queued';
  readAt?: Date;
  createdAt: Date;
}

export interface IdentityFilter {
  id: string;
  userId: string;
  name: string;
  description?: string;
  accountIds: string[];
  color: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ConversationState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  total: number;
}

export interface MessageState {
  messages: Message[];
  selectedConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  total: number;
}

export interface AccountState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
}

export interface FilterState {
  filters: IdentityFilter[];
  selectedFilterId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  conversations: ConversationState;
  messages: MessageState;
  accounts: AccountState;
  filters: FilterState;
}
