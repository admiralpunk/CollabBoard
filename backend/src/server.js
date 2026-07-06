import express from 'express';
import { createServer } from 'http';
import socketio from 'socket.io';
import { config } from './config/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { setupSocketEvents } from './socket/events.js';
import logger from './utils/logger.js';
import rateLimit from 'express-rate-limit';
import roomService from './services/RoomService.js'

const app = express();

// ADD THIS LINE
app.set('trust proxy', 1);

// Middleware
app.use(corsMiddleware);

// Rate limiting middleware: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
const io = socketio(httpServer, {
  transports: config.socketTransports,
});

// For socket.io v2.x, set CORS headers manually if needed
io.origins('*:*');

// Setup socket events
setupSocketEvents(io);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Room listing endpoint
app.get('/api/rooms', (req, res) => {
  const rooms = roomService.getAllRooms()
  const enriched = {}
  for (const [roomId, info] of Object.entries(rooms)) {
    enriched[roomId] = {
      userCount: info.userCount,
      users: info.users.map(sid => ({
        username: roomService.getUsername(sid)
      }))
    }
  }
  res.json(enriched)
})

// Start server
const PORT = process.env.PORT || config.port || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`CORS Origin: ${config.corsOrigin}`);
  logger.info(`Socket Transports: ${config.socketTransports.join(', ')}`);
});

export default app;
