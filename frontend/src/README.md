# CollabBoard Frontend

A real-time collaborative whiteboard application with video chat, text chat, and drawing capabilities.

## 🏗️ Directory Structure

This project follows a **feature-based organization** pattern for better maintainability and scalability.

```
src/
├── features/           # Feature-based modules
│   ├── canvas/        # Canvas drawing functionality
│   │   ├── Canvas.jsx
│   │   ├── DrawingTools.jsx
│   │   ├── useCanvas.js
│   │   ├── hooks/
│   │   │   └── index.js
│   │   └── index.js
│   ├── video-chat/    # Video chat functionality
│   │   ├── VideoChat.jsx
│   │   ├── VideoGrid.jsx
│   │   ├── Controls.jsx
│   │   ├── hooks/
│   │   │   ├── useMediaStream.js
│   │   │   ├── usePeerConnection.js
│   │   │   ├── useSocketId.js
│   │   │   └── index.js
│   │   ├── components/
│   │   │   ├── ConnectionStatus.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   └── index.js
│   │   └── index.js
│   ├── chat/          # Text chat functionality
│   │   ├── Chat.jsx
│   │   ├── MessageList.jsx
│   │   ├── MessageInput.jsx
│   │   └── index.js
│   └── room/          # Room management
│       ├── Room.jsx
│       └── index.js
├── shared/            # Shared resources
│   ├── components/    # Reusable components
│   ├── hooks/         # Generic hooks (currently empty - all hooks are feature-specific)
│   │   └── index.js
│   ├── utils/         # Utility functions
│   └── index.css      # Global styles
├── pages/             # Page components
│   ├── App.jsx
│   └── App.css
├── layouts/           # Layout components
├── constants/         # Constants and configuration
│   └── config.js
├── types/             # TypeScript types (if needed)
├── assets/            # Static assets
└── main.jsx          # Application entry point
```

## 🚀 Features

### 🎨 **Canvas Drawing**
- Real-time collaborative drawing
- Multiple drawing tools (pen, eraser)
- Color picker and brush size control
- Synchronized across all users in the room

### 📹 **Video Chat**
- WebRTC-based peer-to-peer video communication
- Audio/video controls (mute, camera toggle)
- Automatic peer connection management
- STUN/TURN server support for NAT traversal

### 💬 **Text Chat**
- Real-time messaging
- User identification
- Message history within session

### 🏠 **Room Management**
- Create or join rooms
- User count tracking
- Room ID generation
- Username management

## 📦 Import Patterns

### Feature Imports
```javascript
// Import from features
import { Canvas } from '../features/canvas';
import { VideoChat } from '../features/video-chat';
import { Chat } from '../features/chat';
import { Room } from '../features/room';
```

### Shared Imports
```javascript
// Import shared utilities (when available)
import { utilityFunction } from '../shared/utils';

// Import constants
import { BACKEND_URL, SOCKET_TRANSPORTS } from '../constants/config';
```

### Path Aliases (Configured in vite.config.js)
```javascript
// Available aliases
import Component from '@/shared/components/Component';
import { useHook } from '@/shared/hooks';
import { CONFIG } from '@/constants/config';
import { Feature } from '@/features/feature';
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend Configuration
VITE_BACKEND_URL=your_backend_url
VITE_BACKEND_URL_DEV=http://localhost:3000

# Socket Configuration
VITE_SOCKET_TRANSPORTS=websocket,polling

# WebRTC STUN/TURN Servers
VITE_STUN_URL_1=stun:stun.l.google.com:19302
VITE_STUN_URL_2=stun:stun1.l.google.com:19302
VITE_TURN_URL=your_turn_server
VITE_TURN_USERNAME=your_username
VITE_TURN_CREDENTIAL=your_credential
```

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Running the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or next available port).

### Building for Production
```bash
npm run build
```

## 🏛️ Architecture

### **Feature-Based Organization**
- **Scalability**: Easy to add new features without cluttering existing code
- **Maintainability**: Clear separation of concerns
- **Team Collaboration**: Multiple developers can work on different features
- **Code Reviews**: Easier to review feature-specific changes

### **Real-Time Communication**
- **Socket.IO**: For real-time messaging and room management
- **WebRTC**: For peer-to-peer video/audio communication
- **Canvas API**: For collaborative drawing

### **State Management**
- **React Hooks**: Local component state
- **Socket Events**: Real-time state synchronization
- **Refs**: For DOM manipulation and persistent values

## 📁 Adding New Features

1. **Create Feature Directory**
   ```bash
   mkdir src/features/new-feature
   ```

2. **Add Components**
   ```javascript
   // src/features/new-feature/NewFeature.jsx
   import React from 'react';
   
   const NewFeature = () => {
     return <div>New Feature</div>;
   };
   
   export default NewFeature;
   ```

3. **Create Index File**
   ```javascript
   // src/features/new-feature/index.js
   export { default as NewFeature } from './NewFeature';
   ```

4. **Import and Use**
   ```javascript
   import { NewFeature } from '@/features/new-feature';
   ```

## 🔄 Adding Shared Resources

1. **Add to Appropriate Directory**
   ```bash
   # For hooks
   touch src/shared/hooks/useNewHook.js
   
   # For components
   touch src/shared/components/NewComponent.jsx
   
   # For utilities
   touch src/shared/utils/newUtil.js
   ```

2. **Update Index Files**
   ```javascript
   // src/shared/hooks/index.js
   export { default as useNewHook } from './useNewHook';
   ```

3. **Import and Use**
   ```javascript
   import { useNewHook } from '@/shared/hooks';
   ```

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Testing Strategy
- **Unit Tests**: For individual components and hooks
- **Integration Tests**: For feature interactions
- **E2E Tests**: For complete user workflows

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Other Platforms
The application is configured for deployment on various platforms:
- **Netlify**: Automatic deployment from Git
- **AWS S3**: Static hosting
- **Docker**: Containerized deployment

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Follow the feature-based organization**
4. **Add tests for new features**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Canvas Drawing Issues**
- Ensure WebSocket connection is established
- Check browser console for errors
- Verify room ID is correct

**Video Chat Issues**
- Check microphone/camera permissions
- Verify STUN/TURN server configuration
- Ensure HTTPS in production

**Import Errors**
- Verify path aliases in `vite.config.js`
- Check file extensions (.jsx, .js)
- Ensure index files are properly exported

## 🔗 Related Documentation

- [React Documentation](https://react.dev/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Canvas API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) 