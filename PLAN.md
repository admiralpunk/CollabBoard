# CollabBoard — Improvement Plan

> Checkboxes are ticked as items are completed.

---

## Phase 1: Critical Fixes (Bugs & Gaps)

- [x] **Canvas persistence** — Server stores draw events per room, replays to late joiners via `canvas-state` event
- [x] **Fix `"join"` event duplication** — Removed duplicate `socket.emit("join", roomId)` from `RoomPage.jsx` (only `usePeerConnection.js` emits it)
- [x] **Fix `disconnecting`/`disconnect` handler duplication** — Consolidated cleanup to `disconnecting` only; `disconnect` is a fallback safety net
- [x] **Fix `hasActiveConnection` race condition** — Now checks if the existing socket is actually connected, no arbitrary time window
- [x] **Fix eraser** — Switched from painting white (`#FFFFFF`) to proper `destination-out` compositing for true erasing
- [x] **Add input validation** — Added validation across all backend handlers (draw, chat, signal, join-room)

---

## Phase 2: Feature Improvements

### Canvas
- [ ] **Undo/redo** — Stroke history stack on client, undo/redo socket events for real-time sync
- [ ] **Shape tools** — Rectangles, circles, lines, text tool with preview rendering
- [ ] **Touch/pointer events** — `onPointerDown/Move/Up` to unify mouse + touch
- [ ] **Drawing throttling** — Batch `draw` emits every 50ms instead of every mousemove
- [ ] **Canvas resize** — Use `ResizeObserver` instead of hardcoded `800x600`

### Chat
- [ ] **Message timestamps** — Already in data, just not rendered in `MessageList.jsx`
- [ ] **Auto-scroll to bottom** — `useEffect` to scroll on new messages
- [ ] **Typing indicators** — `typing`/`stop-typing` events with debounce
- [ ] **Server-validated sender** — Backend overwrites `sender` field using `socket._roomId` + `RoomService.userNames`
- [ ] **Message char limit & Shift+Enter** — For multiline support

### Video Chat
- [ ] **Use `onLeaveRoom` prop in `VideoChat.jsx`** — Add "End Call" button
- [ ] **Leave-room button in Controls** — Alongside audio/video toggles
- [ ] **Screen sharing** — `getDisplayMedia` support via new button
- [ ] **Device selection** — Choose camera/mic from available devices

### Room Management
- [ ] **Room listing/discovery** — `list-rooms` endpoint + room browser on landing page
- [ ] **Username validation** — Min/max length + character restrictions (client + server)
- [ ] **Room ID validation** — Handle non-existent rooms gracefully

---

## Phase 3: UI/UX Improvements

### Loading States (currently all plain text)
- [ ] Replace `"Please wait 50 seconds..."` with loading spinner + progress indicator
- [ ] Add skeleton loaders for chat (message placeholders) and video grid (dark rectangles)
- [ ] Add spinner overlay on Join/Create buttons to prevent double-clicks
- [ ] Show loading state in `VideoChat` while `getUserMedia` initializes

### Error States
- [ ] Replace all `alert()` calls with inline toast/notification components
- [ ] Add dismiss button + retry action to `ErrorMessage.jsx`
- [ ] Surface socket disconnection prominently ("Connection Lost — Reconnecting...")
- [ ] Add `prefers-reduced-motion` support to all animations

### Empty States
- [ ] Chat: `"No messages yet. Start the conversation!"` with icon
- [ ] Video: Style existing "No video streams available" consistently with design system

### Responsive Design
- [ ] Replace hardcoded `RightPanel: 350px` with responsive breakpoints
- [ ] Add `flex-wrap` to `ContentContainer` so panels wrap on narrow viewports
- [ ] Make canvas responsive via `ResizeObserver` + CSS `max-width: 100%`
- [ ] Add media queries for tablet (`768px`) and mobile (`480px`)
- [ ] Use `clamp()` for font sizes instead of fixed pixels

### Design System
- [ ] Establish CSS custom properties in `index.css` (colors, spacing, radii, shadows)
- [ ] Migrate hardcoded values across styled-components to use CSS variables
- [ ] Add `ThemeProvider` for future theming (dark mode)
- [ ] Normalize border radii to 2-3 consistent values
- [ ] Normalize button styles (primary `#FFE082`, secondary gray)

### Accessibility
- [ ] Add `aria-label` to all emoji-only buttons (`💬`, `🎤`, `🔇`, `📹`, `🎥`)
- [ ] Add `role="alert"` to error messages + `aria-live="polite"` to chat list
- [ ] Add focus trapping + `aria-modal` to username-taken popup
- [ ] Wrap canvas in focusable element with keyboard drawing (arrow keys)
- [ ] Migrate all inline `style` objects to styled-components

### Visual Polish
- [ ] Remove `DrawingTools.jsx` dead code or integrate into `Canvas.jsx`
- [ ] Fix `Controls.jsx` `$active` prop (inverted logic)
- [ ] Add confirmation dialog before "Clear Canvas" (destructive, no undo)
- [ ] Add hover/active states to all interactive elements
- [ ] Add page transition when entering a room
- [ ] Add toast/notification system for join/leave events

---

## Phase 4: Architectural Improvements

- [ ] **Graceful backend shutdown** — Handle `SIGTERM`/`SIGINT` in `server.js`
- [ ] **Global error boundary** — React error boundary wrapping the app
- [ ] **Socket middleware** — Per-socket event rate limiting (max 60 draw/sec)
- [ ] **`React.memo`** — Wrap `MessageList`, `VideoGrid`, `MessageInput`
- [ ] **Backend Logger audit** — Replace `console.log` with `logger` module everywhere
- [ ] **RoomService refactor** — Combine dual-tracking (Socket.IO rooms + RoomService Maps) into single source of truth
- [ ] **`wrtc` / `@roamhq/wrtc` cleanup** — Remove unused dependencies
