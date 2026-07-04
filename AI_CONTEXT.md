# AI Context — CollabBoard

## Project

Full-stack collaborative whiteboard: real-time drawing + chat + WebRTC video. Rooms are isolated sessions. No database, no auth.

## Location

Root: `/home/aniket2/Documents/pr_1/collabBoard/CollabBoard`

## Architecture Decisions (Summary)

- **Monorepo** with independent `backend/` and `frontend/` — separate package.json, no workspaces
- **In-memory state** — ES6 Maps in `RoomService.js`, all state lost on restart
- **Handler-per-feature** backend pattern — separate files per domain (room, canvas, chat, signal)
- **Feature-based frontend** — self-contained `features/<name>/` folders with barrel exports
- **Polling-only transport** — Socket.IO client uses `transports: ["polling"], upgrade: false`
- **WebRTC perfect negotiation** — polite peer (higher socket ID), ICE queuing, 3-retry reconnect
- **No auth** — username + UUID only, no sessions

## Coding Conventions

- **JavaScript only** — no TypeScript, plain `.js` / `.jsx`
- **ES Modules** — `import`/`export`, no `require()`
- **styled-components** for all UI, no CSS files except global `shared/index.css`
- **No semicolons**, no comments unless the existing code around you has them
- **Named exports** over default exports
- **PascalCase** for components, **camelCase** for hooks/utils
- **kebab-case** for Socket.IO event names (e.g. `join-room`, `chat-message`)
- **Destructure props**, use `useCallback`/`useEffect` for socket subscriptions

## Preferred Commands

```bash
npm run dev --prefix backend     # Dev server :3000
npm run dev --prefix frontend    # Dev server :5173
npm run lint --prefix frontend   # ESLint
npm run build --prefix frontend  # Vite production build
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/server.js` | Express + Socket.IO init |
| `backend/src/services/RoomService.js` | In-memory state manager |
| `backend/src/socket/events.js` | Event handler wiring |
| `frontend/src/main.jsx` | React entry + routing |
| `frontend/src/pages/App.jsx` | Health check + routes |
| `frontend/src/features/canvas/useCanvas.js` | Canvas logic |
| `frontend/src/features/video-chat/hooks/usePeerConnection.js` | WebRTC negotiation |

## Known Bugs

- Chat lost on refresh (not stored)
- No state recovery on socket reconnect

## Ongoing Tasks

- No active development. Canvas persistence was implemented (draw events stored server-side). Unused deps (`wrtc`, `@roamhq/wrtc`, `node-pre-gyp`) removed.
