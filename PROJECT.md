# CollabBoard

A full-stack collaborative whiteboard platform for real-time team collaboration.

## Features

- **Real-time Collaborative Drawing** — Shared HTML5 Canvas with multiple simultaneous users
- **Instant Chat** — Text chat panel alongside the whiteboard
- **Peer-to-Peer Video Chat** — WebRTC-based video conferencing between room participants
- **Room Management** — Create or join named, isolated collaboration sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.3, Vite 6, React Router 7.6, styled-components 6.1 |
| Backend | Node.js (ESM), Express 4.21, Socket.IO 2.4 |
| Real-time | Socket.IO (polling-only on frontend), WebRTC via simple-peer 9.11 |
| Styling | styled-components |
| Tooling | ESLint 9, Vite |
| Deployment | Vercel, Docker (Node 20-alpine), Google Cloud Run |

## Architecture Decisions

- **Monorepo with independent packages** — Backend (`backend/`) and frontend (`frontend/`) each have their own `package.json`, `node_modules`, and build pipeline. The root `package.json` only orchestrates global scripts. No npm workspaces, no lerna.
- **In-memory state only** — All room/user state lives in ES6 Maps inside `RoomService.js`. No database (despite `.env.example` mentioning DynamoDB). State is ephemeral — lost on server restart.
- **Handler-per-feature pattern** — Socket.IO event handlers are split into `roomHandlers.js`, `canvasHandlers.js`, `chatHandlers.js`, `signalHandlers.js`. Each is a higher-order function `(socket, io) => (data) => {...}` wired up in `events.js`.
- **Feature-based frontend folders** — Each feature (`canvas/`, `chat/`, `room/`, `video-chat/`) is self-contained with components, hooks, and a barrel `index.js` exports file.
- **Polling-only transport** — Frontend Socket.IO client forces `transports: ["polling"]` with `upgrade: false`. This avoids WebSocket limitations in serverless deployments (Vercel).
- **WebRTC perfect negotiation** — The `usePeerConnection.js` hook implements the standard perfect negotiation pattern. The peer with the higher socket ID acts as "polite" to resolve offer/answer collisions. Includes ICE candidate queuing and auto-reconnection (3 retries).
- **No authentication** — Users are identified by a self-chosen username + client-generated UUID. No passwords, sessions, tokens, or cookies.
- **Security via rate limiting** — `express-rate-limit` enforces 100 requests per 15 minutes per IP. CORS is configurable via `FRONTEND_ORIGIN` env var.
- **Health-check gating** — The frontend polls `GET /health` on the backend URL every 50 seconds until the backend responds, providing readiness-aware routing.
- **Socket.IO v2 API** — Uses `io.sockets.sockets` (object) and `io.sockets.adapter.rooms` (object) directly, not the Map-based API from v4.
- **Canvas persistence** — Draw events are stored in `RoomService.canvasHistory` Map. On `join-room`, the history is emitted as `canvas-state` to replay on the joining client's canvas.

## Project Structure

```
CollabBoard/
├── package.json              # Root orchestrator
├── Dockerfile                # Node 20-alpine
├── test.html                 # Socket.IO connectivity test
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point (Vercel serverless)
│   │   ├── server.js         # Express + Socket.IO setup
│   │   ├── config/index.js   # Env config
│   │   ├── middleware/cors.js
│   │   ├── services/RoomService.js  # In-memory room/user state
│   │   ├── socket/events.js  # Socket.IO connection handler
│   │   ├── socket/handlers/
│   │   │   ├── roomHandlers.js
│   │   │   ├── canvasHandlers.js
│   │   │   ├── chatHandlers.js
│   │   │   └── signalHandlers.js
│   │   └── utils/logger.js
│   └── vercel.json
└── frontend/
    └── src/
        ├── main.jsx          # React entry (BrowserRouter)
        ├── constants/config.js
        ├── pages/
        │   ├── App.jsx       # Health check + routing
        │   └── RoomPage.jsx  # Room layout
        ├── shared/index.css  # Global styles
        └── features/
            ├── canvas/       # Canvas.jsx, DrawingTools.jsx, useCanvas.js
            ├── chat/         # Chat.jsx, MessageList.jsx, MessageInput.jsx
            ├── room/         # Room.jsx (join/create form)
            └── video-chat/   # VideoChat.jsx, VideoGrid.jsx, Controls.jsx, hooks/
```

## Socket.IO Events

### Client → Server
| Event | Payload | Handler |
|-------|---------|---------|
| `join-room` | `{ roomId, userId, username }` | roomHandlers |
| `join` | `room` (string) | roomHandlers |
| `draw` | `{ roomId, x0, y0, x1, y1, color, size }` | canvasHandlers |
| `clear-canvas` | `roomId` | canvasHandlers |
| `chat-message` | `{ roomId, message }` | chatHandlers |
| `signal` | `{ to: socketId, data }` | signalHandlers |

### Server → Client
| Event | Payload |
|-------|---------|
| `all-users` | `{ users, usernameMap }` |
| `user-joined` | `{ userId, userCount }` |
| `user-left` | `{ userId, userCount }` |
| `usernames-update` | `{ usernameMap }` |
| `room-created` | `{ roomId }` |
| `username-taken` | `{ message }` |
| `draw` | `{ x0, y0, x1, y1, color, size }` |
| `clear-canvas` | — |
| `chat-message` | `{ message }` |
| `peers-in-room` | `string[]` |
| `peer-joined` | `socketId` |
| `peer-left` | `socketId` |
| `signal` | `{ id, data }` |

## Preferred Commands

```bash
# Backend
npm run dev --prefix backend     # Start dev server (nodemon) on :3000
npm start --prefix backend       # Production start
npm run build --prefix backend   # Build (currently no-op)

# Frontend
npm run dev --prefix frontend    # Start Vite dev server on :5173
npm run build --prefix frontend  # Production build
npm run preview --prefix frontend# Preview production build
npm run lint --prefix frontend   # ESLint

# Docker
docker build -t collabboard-backend .   # Build image from repo root
docker run -p 3000:3000 collabboard-backend

# Git
npm install                      # Install backend deps via preinstall hook
```

## Ongoing Tasks

- No active feature development. Past completed tasks include: eraser tool fix, dark theme fix, rate limiting, rapid reload handling, duplicate username popup, RoomService refactor, frontend debug log cleanup, canvas persistence, unused dependency cleanup.

## Known Bugs

- **Chat ephemeral** — Messages are broadcast but never stored. Refreshing the page loses all chat history.
- **No reconnection state recovery** — If a socket reconnects after disconnect, room state (canvas content, chat history) is not restored.
- **Video peers on reconnect** — WebRTC peers may not properly re-establish after a socket reconnection. The auto-reconnect logic in `usePeerConnection.js` handles ICE failures but not full socket-level reconnection.
