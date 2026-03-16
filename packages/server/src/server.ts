import http from 'http';
import { createApp } from './app.js';
import { createSocketServer, subscribeToSocketEvents } from './core/websocket/socket.js';
import { db } from './core/database/connection.js';
import { logger } from './core/logger.js';
import { config } from './core/config.js';

async function start() {
  // Run any pending migrations
  await db.migrate.latest();
  logger.info('Database migrations up to date');

  const app = createApp();
  const httpServer = http.createServer(app);

  // Attach Socket.io to the HTTP server
  createSocketServer(httpServer);

  // Subscribe to Redis socket events so they are forwarded to connected clients
  await subscribeToSocketEvents();

  httpServer.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'BlackBear CRM server started');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    httpServer.close(async () => {
      await db.destroy();
      logger.info('Server shut down cleanly');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
