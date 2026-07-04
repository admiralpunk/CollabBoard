# CollabBoard — Conventions & Patterns

## Architecture Overview

- **Monorepo** — `backend/` and `frontend/` are independent. The root `package.json` only runs `npm install --prefix backend` via `preinstall`.
- **In-memory state** — `RoomService.js` manages rooms, usernames, and connections via ES6 Maps. No database.
- **Handler-per-feature** — Each backend handler file receives `(socket, io)` and registers its own events.
- **Feature-folders** — Frontend features are self-contained under `features/<name>/` with their own components and hooks.

## Coding Conventions

- **Language:** Plain JavaScript (`.js` / `.jsx`), no TypeScript
- **Modules:** ES Modules (`import`/`export`), no `require()`
- **Semicolons:** Not used — follow the existing style
- **Comments:** Do not add comments unless the surrounding code has them
- **Styling:** styled-components only. Global styles in `shared/index.css`.
- **Exports:** Prefer named exports over default exports
- **Naming:**
  - Components: PascalCase (`Canvas.jsx`, `VideoGrid.jsx`)
  - Hooks/utils: camelCase (`useCanvas.js`, `usePeerConnection.js`)
  - Socket events: kebab-case (`join-room`, `chat-message`, `clear-canvas`)
  - Variables: camelCase
- **Props:** Always destructure in function signatures
- **Hooks:** Use `useCallback` and `useEffect` for socket event subscriptions;

## Backend Patterns

- Handler signature: `module.exports = (socket, io) => { socket.on('event', cb) }`
- Wire handlers in `events.js`: import handler, call it with `(socket, io)`
- Socket.IO v2 API specifics:
  - `io.sockets.sockets` is a plain object (keyed by socket ID), not a Map
  - `io.sockets.adapter.rooms[roomId]?.sockets` is a plain object
  - Use `socket.join(roomId)` / `socket.to(roomId).emit(event, data)`
- Validate all inputs at the handler level
- RoomService methods: `getUsersInRoom()`, `addUser()`, `removeUser()`, `isUsernameTaken()`, `getAllRooms()`, `getUserIdsInRoom()`

## Frontend Patterns

- **Routing:** React Router 7.6 with `BrowserRouter` in `main.jsx`
- **Socket connection:** Created in `RoomPage.jsx`, passed down via props (no context)
- **Socket.IO client v2:** `socket.on(event, cb)` / `socket.emit(event, data)`
- **Transport:** Always `transports: ["polling"], upgrade: false`
- **Canvas:** The `useCanvas.js` hook manages drawing state and socket sync
- **WebRTC perfect negotiation** (see `usePeerConnection.js`):
  - Offer/answer collision resolved by "polite" flag (higher socket ID is polite)
  - ICE candidates queued during signaling state transitions
  - Auto-reconnect on ICE disconnection/failure (3 attempts)
  - STUN/TURN config comes from env vars via `constants/config.js`

## Git Conventions

- Do not commit or push unless explicitly asked
- Commit messages match existing style: concise, lowercase prefix (`fix:`, `task:`, `docs:`, `config:`)
- No force-push, no interactive rebase
- Before any commit: inspect `git status`, `git diff`, `git log --oneline -10`
