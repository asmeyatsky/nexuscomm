import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store';

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
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

// Event listeners
export function onMessageReceived(callback: (data: any) => void): void {
  const s = socket || initSocket();
  s.on('message:received', callback);
}

export function onConversationUpdate(callback: (data: any) => void): void {
  const s = socket || initSocket();
  s.on('conversation:updated', callback);
}

export function onTypingStart(callback: (data: any) => void): void {
  const s = socket || initSocket();
  s.on('typing:started', callback);
}

export function onTypingStop(callback: (data: any) => void): void {
  const s = socket || initSocket();
  s.on('typing:stopped', callback);
}

export function onPresenceChanged(callback: (data: any) => void): void {
  const s = socket || initSocket();
  s.on('presence:changed', callback);
}

// Event emitters
export function emitMessage(data: any): void {
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
