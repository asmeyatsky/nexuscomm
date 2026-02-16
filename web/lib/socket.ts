import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store';

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface SocketMessage {
  id: string;
  conversationId: string;
  content: string;
  senderExternalId: string;
  senderName: string;
  direction: 'inbound' | 'outbound';
  channelType: string;
  createdAt: string;
  isRead: boolean;
  status: string;
}

export interface ConversationUpdatePayload {
  id: string;
  lastMessage?: string;
  lastMessageDirection?: 'inbound' | 'outbound';
  lastMessageTimestamp?: string;
  unreadCount?: number;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  displayName: string;
}

export function initSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const { accessToken } = useAuthStore.getState();

  socket = io(SOCKET_URL, {
    auth: {
      token: accessToken,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function closeSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function onMessageReceived(callback: (data: SocketMessage) => void): () => void {
  const s = socket || initSocket();
  s.on('message:received', callback);
  return () => { s.off('message:received', callback); };
}

export function onConversationUpdate(callback: (data: ConversationUpdatePayload) => void): () => void {
  const s = socket || initSocket();
  s.on('conversation:updated', callback);
  return () => { s.off('conversation:updated', callback); };
}

export function onTypingStart(callback: (data: TypingPayload) => void): () => void {
  const s = socket || initSocket();
  s.on('typing:started', callback);
  return () => { s.off('typing:started', callback); };
}

export function onTypingStop(callback: (data: TypingPayload) => void): () => void {
  const s = socket || initSocket();
  s.on('typing:stopped', callback);
  return () => { s.off('typing:stopped', callback); };
}

export function emitMessage(data: { conversationId: string; content: string }): void {
  const s = socket || initSocket();
  s.emit('message:send', data);
}

export function emitTyping(conversationId: string): void {
  const s = socket || initSocket();
  s.emit('typing:start', { conversationId });
}

export function emitTypingStop(conversationId: string): void {
  const s = socket || initSocket();
  s.emit('typing:stop', { conversationId });
}

export function subscribeToConversation(conversationId: string): void {
  const s = socket || initSocket();
  s.emit('conversation:subscribe', { conversationId });
}

export function unsubscribeFromConversation(conversationId: string): void {
  const s = socket || initSocket();
  s.emit('conversation:unsubscribe', { conversationId });
}
