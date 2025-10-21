import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@store/index';

const WS_URL = 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, Function> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Message event handlers
    this.socket.on('message:new', (data) => {
      this.handleEvent('message:new', data);
    });

    this.socket.on('conversation:changed', (data) => {
      this.handleEvent('conversation:changed', data);
    });

    this.socket.on('typing:active', (data) => {
      this.handleEvent('typing:active', data);
    });

    this.socket.on('typing:inactive', (data) => {
      this.handleEvent('typing:inactive', data);
    });

    this.socket.on('presence:changed', (data) => {
      this.handleEvent('presence:changed', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, handler: Function) {
    this.messageHandlers.set(event, handler);
  }

  off(event: string) {
    this.messageHandlers.delete(event);
  }

  private handleEvent(event: string, data: any) {
    const handler = this.messageHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  // Emit events
  emitNewMessage(data: any) {
    this.socket?.emit('message:received', data);
  }

  emitConversationUpdate(data: any) {
    this.socket?.emit('conversation:updated', data);
  }

  emitTypingStart(conversationId: string) {
    this.socket?.emit('typing:start', { conversationId });
  }

  emitTypingStopp(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  emitPresenceUpdate(status: string) {
    this.socket?.emit('presence:update', { status });
  }

  subscribeToConversation(conversationId: string) {
    this.socket?.emit('conversation:subscribe', { conversationId });
  }

  unsubscribeFromConversation(conversationId: string) {
    this.socket?.emit('conversation:unsubscribe', { conversationId });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const webSocketService = new WebSocketService();
