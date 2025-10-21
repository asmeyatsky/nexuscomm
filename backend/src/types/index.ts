// Channel Types
export type ChannelType = 'whatsapp' | 'sms' | 'email' | 'instagram_dm' | 'linkedin_dm' | 'telegram' | 'slack';

// Message Types
export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  channelType: ChannelType;
  externalId: string;
  externalThreadId?: string;
  mediaUrls?: string[];
  timestamp: Date;
  isRead: boolean;
  direction: 'inbound' | 'outbound';
  metadata?: Record<string, any>;
}

// Conversation Types
export interface IConversation {
  id: string;
  userId: string;
  participantIds: string[];
  participantNames: string[];
  channels: ChannelType[];
  lastMessage?: string;
  lastMessageTimestamp?: Date;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
}

// Account/Identity Types
export interface IAccount {
  id: string;
  userId: string;
  channelType: ChannelType;
  identifier: string; // phone number, email, username
  displayName: string;
  isActive: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// User Types
export interface IUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Filter/Identity Types
export interface IIdentityFilter {
  id: string;
  userId: string;
  name: string;
  description?: string;
  accountIds: string[];
  color?: string;
  order: number;
}

// API Response Types
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: Date;
}

// Auth Types
export interface IAuthPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Rate Limit Types
export interface IRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Notification Types
export interface INotification {
  type: 'message' | 'mention' | 'presence' | 'system';
  data: Record<string, any>;
  recipients: string[];
  priority?: 'high' | 'normal' | 'low';
}

// WebSocket Message Types
export interface IWebSocketMessage {
  action: string;
  payload?: Record<string, any>;
  requestId?: string;
}

export interface IWebSocketEventData {
  type: 'message_received' | 'message_sent' | 'conversation_created' | 'presence_changed' | 'typing';
  data: Record<string, any>;
  timestamp: Date;
}
