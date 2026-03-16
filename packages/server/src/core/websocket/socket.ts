import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { redis } from '../queue/setup.js';

const SOCKET_EVENT_CHANNEL = 'socket:events';

let io: SocketIOServer | null = null;

// ---------------------------------------------------------------------------
// Server initialisation
// ---------------------------------------------------------------------------

export function createSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: true,
    },
  });

  // JWT auth middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
      };
      (socket as Socket & { userId: string }).userId = payload.userId;
      socket.join(`user:${payload.userId}`);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}

// ---------------------------------------------------------------------------
// Emission helpers
// ---------------------------------------------------------------------------

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  if (!io) return;
  io.emit(event, data);
}

// ---------------------------------------------------------------------------
// Redis pub/sub bridge
// ---------------------------------------------------------------------------

/**
 * Publish a socket event to the Redis channel.
 * This works even when Socket.io is not initialised (e.g. in the worker process).
 */
export async function publishSocketEvent(
  event: string,
  data: unknown,
): Promise<void> {
  try {
    await redis.publish(SOCKET_EVENT_CHANNEL, JSON.stringify({ event, data }));
  } catch (err) {
    logger.error({ err }, 'Failed to publish socket event');
  }
}

/**
 * Subscribe to the Redis channel and re-emit events via Socket.io.
 * Call this once in the HTTP server process after Socket.io is initialised.
 */
export async function subscribeToSocketEvents(): Promise<void> {
  const subscriber = redis.duplicate();

  await subscriber.subscribe(SOCKET_EVENT_CHANNEL);

  subscriber.on('message', (_channel: string, message: string) => {
    try {
      const { event, data } = JSON.parse(message) as { event: string; data: unknown };
      if (io) {
        io.emit(event, data);
      }
    } catch (err) {
      logger.error({ err }, 'Failed to process socket event from Redis');
    }
  });

  logger.info('Subscribed to Redis socket events channel');
}
