import express from 'express';
import { createServer } from 'http';
import socketio from 'socket.io';
import { config } from './config/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { setupSocketEvents } from './socket/events.js';
import logger from './utils/logger.js';
import rateLimit from 'express-rate-limit';

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

// Start server
httpServer.listen(config.port, '0.0.0.0', () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`CORS Origin: ${config.corsOrigin}`);
  logger.info(`Socket Transports: ${config.socketTransports.join(', ')}`);
});

export default app;
