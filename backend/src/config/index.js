import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || process.env.CORS_ORIGIN_DEV || '*',
  
  // Socket.IO configuration
  socketTransports: process.env.SOCKET_TRANSPORTS?.split(',') || ['websocket', 'polling'],
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};

export default config; 