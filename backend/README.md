# CollabBoard Backend

A real-time collaborative whiteboard backend server with Socket.IO for real-time communication and WebRTC signaling.

## 🏗️ Directory Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── index.js      # Environment variables and app config
│   ├── middleware/       # Express middleware
│   │   └── cors.js       # CORS configuration
│   ├── routes/           # Express routes (future use)
│   ├── controllers/      # Route controllers (future use)
│   ├── services/         # Business logic services
│   │   └── RoomService.js # Room and user management
│   ├── socket/           # Socket.IO related files
│   │   ├── handlers/     # Socket event handlers
│   │   │   ├── roomHandlers.js    # Room management events
│   │   │   ├── canvasHandlers.js  # Canvas drawing events
│   │   │   ├── chatHandlers.js    # Chat messaging events
│   │   │   ├── signalHandlers.js  # WebRTC signaling events
│   │   │   └── index.js
│   │   └── events.js     # Main socket event setup
│   ├── utils/            # Utility functions
│   │   └── logger.js     # Logging utility
│   └── server.js         # Main server file
├── package.json
├── vercel.json
└── README.md
```

## 🚀 Features

### **Real-time Communication**
- **Socket.IO**: WebSocket-based real-time communication
- **Room Management**: Create, join, and manage collaborative rooms
- **User Tracking**: Track users and their usernames in rooms

### **Canvas Collaboration**
- **Drawing Sync**: Real-time drawing synchronization across users
- **Canvas Clearing**: Synchronized canvas clearing

### **Video Chat Support**
- **WebRTC Signaling**: Relay signaling messages for peer-to-peer connections
- **Peer Management**: Handle peer joining and leaving events

### **Chat System**
- **Real-time Messaging**: Instant message delivery within rooms
- **User Identification**: Messages include sender information

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=your_frontend_url
CORS_ORIGIN_DEV=http://localhost:5173

# Socket.IO Configuration
SOCKET_TRANSPORTS=websocket,polling

# Logging
LOG_LEVEL=info
```

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
cd backend
npm install
```

### Running the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Health Check
```bash
curl http://localhost:3000/health
```

## 📡 Socket Events

### Room Events
- `join-room`: Join a collaborative room
- `join`: Join WebRTC room for video chat
- `disconnecting`: Handle user disconnection

### Canvas Events
- `draw`: Broadcast drawing data to room
- `clear-canvas`: Clear canvas for all users in room

### Chat Events
- `chat-message`: Send and receive chat messages

### WebRTC Events
- `signal`: Relay WebRTC signaling messages between peers
- `peer-joined`: Notify when a new peer joins
- `peer-left`: Notify when a peer leaves

## 🏛️ Architecture

### **Service Layer**
- **RoomService**: Manages room state, user tracking, and username mapping
- **Logger**: Centralized logging with configurable levels

### **Socket Handlers**
- **Modular Design**: Each feature has its own handler file
- **Separation of Concerns**: Clear separation between room, canvas, chat, and signaling logic
- **Reusable**: Handlers can be easily tested and modified

### **Configuration Management**
- **Centralized Config**: All environment variables and settings in one place
- **Environment Aware**: Different settings for development and production

## 🔄 Adding New Features

### 1. Add New Socket Event
```javascript
// src/socket/handlers/newFeatureHandlers.js
export const handleNewEvent = (socket, io) => (data) => {
  // Handle the event
  io.to(data.roomId).emit("new-event", data);
};

// src/socket/handlers/index.js
export * from './newFeatureHandlers.js';

// src/socket/events.js
import { handleNewEvent } from './handlers/index.js';

export const setupSocketEvents = (io) => {
  io.on("connection", (socket) => {
    socket.on("new-event", handleNewEvent(socket, io));
  });
};
```

### 2. Add New Service
```javascript
// src/services/NewService.js
class NewService {
  // Service methods
}

export default new NewService();
```

### 3. Add New Route
```javascript
// src/routes/newRoutes.js
import express from 'express';
const router = express.Router();

router.get('/new-endpoint', (req, res) => {
  res.json({ message: 'New endpoint' });
});

export default router;

// src/server.js
import newRoutes from './routes/newRoutes.js';
app.use('/api', newRoutes);
```

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Testing Strategy
- **Unit Tests**: For individual services and utilities
- **Integration Tests**: For socket event handlers
- **E2E Tests**: For complete socket communication flows

## 🚀 Deployment

### Vercel (Current)
```bash
vercel --prod
```

### Other Platforms
- **Heroku**: Automatic deployment from Git
- **AWS**: EC2 or Lambda deployment
- **Docker**: Containerized deployment

## 📊 Monitoring

### Health Check Endpoint
- `GET /health`: Returns server status and configuration

### Logging
- **Structured Logging**: All logs include timestamps and levels
- **Configurable Levels**: Set log level via environment variable
- **Development Friendly**: Detailed logging in development mode

## 🔗 API Reference

### HTTP Endpoints
- `GET /health`: Health check endpoint

### Socket Events
See the [Socket Events](#-socket-events) section for detailed event documentation.

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Follow the modular structure**
4. **Add tests for new features**
5. **Submit a pull request**

## 📄 License

This project is licensed under the ISC License. 