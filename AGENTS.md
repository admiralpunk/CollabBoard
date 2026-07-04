# AGENTS.md — CollabBoard

Quick reference for AI assistants working on this project.

## Directory Map

```
CollabBoard/
├── backend/src/
│   ├── server.js              # Express + Socket.IO bootstrap
│   ├── config/index.js        # Env-based configuration
│   ├── services/RoomService.js # In-memory state (Map-based)
│   └── socket/
│       ├── events.js          # Connection handler, wires sub-handlers
│       └── handlers/          # roomHandlers, canvasHandlers, chatHandlers, signalHandlers
└── frontend/src/
    ├── main.jsx               # Entry: Buffer polyfill, Router
    ├── constants/config.js    # Env-derived constants
    ├── pages/                 # App.jsx (health + routing), RoomPage.jsx (room layout)
    └── features/
        ├── canvas/            # Drawing canvas + toolbar + useCanvas hook
        ├── chat/              # Chat panel (MessageList, MessageInput)
        ├── room/              # Room.jsx join/create form
        └── video-chat/        # VideoChat + VideoGrid + Controls + hooks
```

## Preferred Commands

```bash
npm run dev --prefix backend     # Backend dev on :3000
npm run dev --prefix frontend    # Frontend dev on :5173
npm run lint --prefix frontend   # ESLint
npm run build --prefix frontend  # Vite production build
npm run preview --prefix frontend# Preview production build
docker build -t collabboard-backend .  # Docker image
```

## Key Architecture Decisions

1. **Monorepo, independent packages** — no npm workspaces, separate package.jsons
2. **In-memory state only** — RoomService uses ES6 Maps, all state lost on restart
3. **Handler-per-feature** backend — each handler file is a `(socket, io) => {...}` function
4. **Feature-based frontend** — `features/<name>/` with barrel `index.js` exports
5. **Polling-only Socket.IO** — `transports: ["polling"], upgrade: false` (no WebSocket)
6. **WebRTC perfect negotiation** — polite peer (higher socket ID), ICE queuing, 3-retry reconnect
7. **No auth** — username + client UUID only

## Coding Conventions

- Plain JS/JSX — no TypeScript
- ES Modules — `import`/`export`, no `require()`
- No semicolons, no comments
- styled-components for all UI
- Named exports preferred
- PascalCase components, camelCase hooks/utils, kebab-case socket events
- Destructure props, `useCallback`/`useEffect` for socket subscriptions

## Key Facts

1. **Socket.IO v2** — uses object-based socket/room lookups, not Map
2. **Polling-only transport** — no WebSocket upgrade on the frontend
3. **No TypeScript** — plain JS/JSX everywhere
4. **No tests** — `npm test` is a placeholder in both packages
5. **styled-components** — no CSS modules, no Tailwind
6. **ES Modules** throughout — both backend and frontend use `"type": "module"`
7. **WebRTC perfect negotiation** in `usePeerConnection.js`
8. **Handler-per-feature** on backend
9. **In-memory state** — RoomService manages rooms, usernames, connections
10. **No database** — despite `.env.example` mentioning DynamoDB, it's never used
11. **Feature folders** with barrel `index.js` exports
12. **Canvas persistence** — draw events stored server-side in RoomService, replayed on join

## Debugging

- Backend logs: set `LOG_LEVEL=debug` in env for verbose Socket.IO logging
- Frontend health check: `GET /health` on backend URL, retries every 50s
- Connection test: open `test.html` in browser

## Known Bugs

- **Chat ephemeral** — messages lost on page refresh
- **No socket reconnect recovery** — room state not restored after disconnect/reconnect
- **WebRTC reconnection** — peers may not properly re-establish after full socket reconnect

## Ongoing Tasks

- No active feature development
- Canvas history persistence was implemented (Phase 1 of PLAN.md)
