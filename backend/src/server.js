import express from 'express';
import { createServer } from 'http';
import socketio from 'socket.io';
import { config } from './config/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { setupSocketEvents } from './socket/events.js';
import { createSocketRateLimiter } from './middleware/socketRateLimiter.js';
import logger from './utils/logger.js';
import rateLimit from 'express-rate-limit';
import roomService from './services/RoomService.js'

const app = express();

app.set('trust proxy', 1);

app.use(corsMiddleware);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

const httpServer = createServer(app);

const io = socketio(httpServer, {
  transports: config.socketTransports,
});

io.origins('*:*');

io.use(createSocketRateLimiter())

setupSocketEvents(io);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

app.get('/api/rooms', (req, res) => {
  const rooms = roomService.getAllRooms(io)
  const enriched = {}
  for (const [roomId, info] of Object.entries(rooms)) {
    enriched[roomId] = {
      userCount: info.userCount
    }
  }
  res.json(enriched)
})

const PORT = process.env.PORT || config.port || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`CORS Origin: ${config.corsOrigin}`);
  logger.info(`Socket Transports: ${config.socketTransports.join(', ')}`);
});

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  httpServer.close(() => {
    logger.info('HTTP server closed');
  })

  io.close(() => {
    logger.info('Socket.IO server closed');
  })

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref()

  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

export default app;
