import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from './jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3001',
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Missing token'));
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    socket.userId = decoded.userId;
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User ${socket.userId} connected via WebSocket`);

    // Join user room for targeted events
    socket.join(`user:${socket.userId}`);

    // Event: New message received
    socket.on('message:received', (data) => {
      io.to(`user:${socket.userId}`).emit('message:new', data);
    });

    // Event: Conversation updated
    socket.on('conversation:updated', (data) => {
      io.to(`user:${socket.userId}`).emit('conversation:changed', data);
    });

    // Event: User typing
    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      io.to(`conversation:${conversationId}`).emit('typing:active', {
        userId: socket.userId,
        conversationId,
      });
    });

    // Event: User stopped typing
    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      io.to(`conversation:${conversationId}`).emit('typing:inactive', {
        userId: socket.userId,
        conversationId,
      });
    });

    // Event: Presence changed
    socket.on('presence:update', (data) => {
      io.to(`user:${socket.userId}`).emit('presence:changed', {
        userId: socket.userId,
        status: data.status,
        lastSeen: new Date(),
      });
    });

    // Event: Subscribe to conversation
    socket.on('conversation:subscribe', (data) => {
      const { conversationId } = data;
      socket.join(`conversation:${conversationId}`);
    });

    // Event: Unsubscribe from conversation
    socket.on('conversation:unsubscribe', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userId} disconnected`);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`WebSocket error for user ${socket.userId}:`, error);
    });
  });

  return io;
}

/**
 * Emit event to specific user
 */
export function emitToUser(
  io: SocketIOServer,
  userId: string,
  event: string,
  data: any
) {
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit event to conversation subscribers
 */
export function emitToConversation(
  io: SocketIOServer,
  conversationId: string,
  event: string,
  data: any
) {
  io.to(`conversation:${conversationId}`).emit(event, data);
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(
  io: SocketIOServer,
  event: string,
  data: any
) {
  io.emit(event, data);
}
