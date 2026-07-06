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

### Canvas, 
- [x] **Undo/redo** — Stroke history stack on client, undo/redo socket events for real-time sync
- [x] **Shape tools** — Rectangles, circles, lines, text tool with preview rendering
- [x] **Touch/pointer events** — `onPointerDown/Move/Up` to unify mouse + touch
- [x] **Drawing throttling** — Batch `draw` emits every 30ms instead of every mousemove
- [x] **Canvas resize** — Use `ResizeObserver` instead of hardcoded `800x600`

### Chat
- [x] **Message timestamps** — Rendered in `MessageList.jsx` using `toLocaleTimeString`
- [x] **Auto-scroll to bottom** — `useEffect` + ref to scroll on new messages
- [x] **Typing indicators** — `typing`/`user-typing` events with 1.5s debounce
- [x] **Server-validated sender** — Backend overwrites `sender` using `RoomService.getUsername(socket.id)`
- [x] **Message char limit & Shift+Enter** — Textarea with 500 char limit, Shift+Enter for newline

### Video Chat
- [x] **Use `onLeaveRoom` prop in `VideoChat.jsx`** — Passed from `RoomPage`, renders red Leave button
- [x] **Leave-room button in Controls** — Added alongside audio/video toggles
- [x] **Screen sharing** — `getDisplayMedia` support via new toggle button
- [ ] **Device selection** — Choose camera/mic from available devices

### Room Management
- [x] **Room listing/discovery** — `GET /api/rooms` endpoint + room browser on landing page
- [x] **Username validation** — 2-20 chars, alphanumeric + underscore (client + server)
- [x] **Room ID validation** — 1-30 chars, alphanumeric + hyphens + underscores (client + server)

---

## Phase 3: UI/UX Improvements

### Loading States
- [x] Replace `"Please wait 50 seconds..."` with loading spinner + progress indicator
- [x] Add skeleton loaders for chat (message placeholders) and video grid (dark rectangles)
- [x] Add spinner overlay on Join/Create buttons to prevent double-clicks
- [x] Show loading state in `VideoChat` while `getUserMedia` initializes

### Error States
- [x] Replace all `alert()` calls with inline toast/notification components
- [x] Add dismiss button + retry action to `ErrorMessage.jsx`
- [x] Surface socket disconnection prominently ("Connection Lost — Reconnecting...")
- [x] Add `prefers-reduced-motion` support to all animations

### Empty States
- [x] Chat: `"No messages yet. Start the conversation!"` with icon
- [x] Video: Style existing "No video streams available" consistently with design system

### Responsive Design
- [x] Replace hardcoded `RightPanel: 350px` with responsive breakpoints
- [x] Add `flex-wrap` to `ContentContainer` so panels wrap on narrow viewports
- [x] Make canvas responsive via `ResizeObserver` + CSS `max-width: 100%`
- [x] Add media queries for tablet (`768px`) and mobile (`480px`)
- [ ] Use `clamp()` for font sizes instead of fixed pixels

### Design System
- [x] Establish CSS custom properties in `index.css` (colors, spacing, radii, shadows)
- [x] Migrate hardcoded values across styled-components to use CSS variables
- [x] Add `ThemeProvider` for future theming (dark mode)
- [x] Normalize border radii to 2-3 consistent values
- [x] Normalize button styles (primary `#FFE082`, secondary gray)

### Accessibility
- [x] Add `aria-label` to all emoji-only buttons (`💬`, `🎤`, `🔇`, `📹`, `🎥`)
- [x] Add `role="alert"` to error messages + `aria-live="polite"` to chat list
- [x] Add focus trapping + `aria-modal` to username-taken popup
- [ ] Wrap canvas in focusable element with keyboard drawing (arrow keys)
- [x] Migrate all inline `style` objects to styled-components

### Visual Polish
- [x] Remove `DrawingTools.jsx` dead code or integrate into `Canvas.jsx`
- [x] Fix `Controls.jsx` `$active` prop (inverted logic)
- [x] Add confirmation dialog before "Clear Canvas" (destructive, no undo)
- [x] Add hover/active states to all interactive elements
- [x] Add page transition when entering a room
- [x] Add toast/notification system for join/leave events

---

## Phase 4: Architectural Improvements

- [x] **Graceful backend shutdown** — Handle `SIGTERM`/`SIGINT` in `server.js`
- [x] **Global error boundary** — React error boundary wrapping the app
- [x] **Socket middleware** — Per-socket event rate limiting (max 60 draw/sec)
- [x] **`React.memo`** — Wrap `MessageList`, `VideoGrid`, `MessageInput`
- [x] **Backend Logger audit** — Replace `console.log` with `logger` module everywhere
- [x] **RoomService refactor** — Combine dual-tracking (Socket.IO rooms + RoomService Maps) into single source of truth
- [x] **`wrtc` / `@roamhq/wrtc` cleanup** — Removed unused dependencies

---

## Phase 5: UI/UX Overhaul

### A. Color Palette & Contrast Overhaul

**Rationale:** 26+ hardcoded hex colors duplicate CSS variables. Some lack sufficient contrast (e.g., `#FFE082` on `#fff`). No dark mode despite `prefers-color-scheme` being set.

- [ ] **Define proper color scale** — Add `--color-primary-50` through `--color-primary-900` (amber) and gray/slate/danger/success scales to `index.css`
- [ ] **Add semantic aliases** — `--color-text-primary`, `--color-text-on-primary`, `--color-bg-input`, `--color-bg-hover`, `--color-border-focus`
- [ ] **Replace all hardcoded `#333`** (8+ occurrences: button text, room names, etc.) with `--color-text-primary`
- [ ] **Replace all hardcoded `#2c3e50`** (chat header, message text, minimize button, input text) with dark-slate variable or `--color-text-primary`
- [ ] **Replace all hardcoded `#1a1a1a`** (video container bg) with `--color-bg-dark`
- [ ] **Replace `#f8f9fa`** (video placeholder) with `--color-surface-alt`
- [ ] **Replace `#e0e0e0`** (RoomEntry border) with `--color-border`
- [ ] **Add WCAG AA contrast pass** — Ensure all text/background combos meet 4.5:1 ratio for normal text and 3:1 for large text
- [ ] **Implement proper dark mode** — Actual `prefers-color-scheme: dark` overrides with dark beige/charcoal palette
- [ ] **Add `--color-success-bg`, `--color-info`, `--color-info-bg`** for completeness

### B. Typography System

**Rationale:** Only `Inter` specified via `font-family` stack. No font weights, heading hierarchy, or line-height scale. Font sizes mix `px`, `em`, and CSS variables.

- [ ] **Load Inter font** via Google Fonts `@import` in `index.css` with weights 400, 500, 600, 700
- [ ] **Define heading scale** — `--heading-xxl: 2rem`, `--heading-xl: 1.5rem`, `--heading-lg: 1.25rem`, `--heading-md: 1.1rem`
- [ ] **Define body scale** — `--body-sm: 0.75rem`, `--body-md: 0.875rem`, `--body-lg: 1rem`
- [ ] **Define line-height scale** — `--leading-tight: 1.2`, `--leading-normal: 1.5`, `--leading-relaxed: 1.7`
- [ ] **Define font-weight scale** — `--weight-normal: 400`, `--weight-medium: 500`, `--weight-semibold: 600`, `--weight-bold: 700`
- [ ] **Replace all hardcoded `font-size` values** with typography variables (18px→`--body-lg`, 16px→`--body-lg`, 14px→`--body-md`, 12px→`--body-sm`, `0.7em`→`--body-sm`, `0.85em`→`--body-sm`, `0.9em`→`--body-sm`)
- [ ] **Replace all hardcoded `font-weight` values** with weight variables

### C. Spacing & Layout Refinement

**Rationale:** Spacing CSS variables used inconsistently. Many elements use raw `px` values. Layout hierarchy is flat.

- [ ] **Audit and replace raw `px` margins/paddings** across all components with spacing variables
- [ ] **Standardize gaps** — Use `--space-sm` `--space-md` `--space-lg` consistently across all flex/grid gaps
- [ ] **Refine Room.jsx layout** — Reduce `padding-top: 10vh` to balanced `padding-top: 15vh` or `min-height: 80vh` with centering
- [ ] **Add consistent section spacing** — Standardize gap between canvas toolbar and canvas element
- [ ] **Refine RoomPage two-panel layout** — Add min/max width constraints for ultra-wide screens
- [ ] **Improve Chat container height** — `max-height` instead of fixed `380px`; clamp between `300px` and `50vh`
- [ ] **Standardize input heights** — All text inputs use consistent padding/height

### D. Visual Hierarchy & Component Polish

**Rationale:** Page lacks clear visual zones. Buttons, inputs, panels blend together with similar backgrounds and borders.

- [ ] **Add subtle backdrop to main canvas area** — Light card background with slight shadow
- [ ] **Elevate Chat panel** — Increase shadow separation to emphasize it as secondary panel
- [ ] **Add visual separation between toolbar and canvas** — Subtle divider line or shadow below toolbar
- [ ] **Style active tool button more distinctly** — Add underline bar or left accent indicator
- [ ] **Refine VideoGrid containers** — Subtle border/glow for active speaking peer
- [ ] **Style room info header** — Background card, better typography for room name/user count/username

### E. Border Radius Normalization

**Rationale:** 7 distinct radius values in use: `4px`, `8px`, `16px`, plus hardcoded `18px`, `20px`, `6px`, `3px`.

- [ ] **Replace `border-radius: 16px`** in Canvas toolbar buttons with `var(--radius-lg)`
- [ ] **Replace `border-radius: 18px`** in MessageList message bubbles with `var(--radius-lg)`
- [ ] **Replace `border-radius: 20px`** in MessageInput textarea/send button with `var(--radius-lg)`
- [ ] **Replace `border-radius: 6px`** in Chat minimize button with `var(--radius-sm)` or `var(--radius-md)`
- [ ] **Use `var(--radius-full)`** (9999px) for pill-shaped elements (LoadingSpinner, badges)

### F. Animation & Micro-interactions

**Rationale:** Basic transitions exist but lack personality. No micro-interactions, staggered animations, or page transitions.

- [ ] **Add button press ripple effect** — `transform: scale(0.97)` on `:active` for primary buttons
- [ ] **Add toast entrance/exit animation** — Fade + slide-in, fade + slide-out on dismiss
- [ ] **Add message bubble entrance animation** — Slide up + fade (`translateY(10px)` → `0`, `opacity 0` → `1`)
- [ ] **Add skeleton shimmer polish** — Smoother gradient, slower (`1.8s`) for elegance
- [ ] **Add ConfirmationDialog entrance** — Overlay fades in, dialog scales up from 0.95
- [ ] **Add tooltip on hover for icon-only buttons** — After 500ms delay for emoji/SVG buttons
- [ ] **Add video connection status pulse** — Subtle pulsing dot next to "Connected peers" count
- [ ] **Verify all animations respect `prefers-reduced-motion`** — Already partially implemented

### G. Unified Icon System

**Rationale:** Raw emoji characters used for all icons (🎤🔇📹🎥📞💬↩↪⚠️×+−). Emoji rendering varies by OS, lacks consistent sizing, and isn't accessible as icons.

- [ ] **Install `lucide-react`** — Lightweight icon library (~30kB gzipped, tree-shakeable)
- [ ] **Create `<Icon name="..." size="..." />` component** — Wraps Lucide icons with `aria-hidden="true"` and `focusable="false"`
- [ ] **Replace emoji icons in Controls.jsx** — `mic`/`mic-off` (🎤/🔇), `camera`/`camera-off` (📹/🎥), `phone-off` (📞)
- [ ] **Replace emoji icons in MessageInput** — `send` (▶️/arrow)
- [ ] **Replace emoji icons in EmptyState** — `message-circle` (💬), `video` (📹)
- [ ] **Replace emoji icons in Canvas toolbar** — `undo`/`redo` (↩/↪), `plus`/`minus` (+/−)
- [ ] **Replace emoji icons in Toast/Error** — `x` (×), `alert-triangle` (⚠️)
- [ ] **Define standard icon sizes** — `--icon-sm: 14px`, `--icon-md: 18px`, `--icon-lg: 24px`

### H. Empty States & Feedback

**Rationale:** Room list "Loading..." is plain text. No onboarding hints.

- [ ] **Replace Room.jsx `"Loading..."`** with styled Skeleton placeholders matching room list layout
- [ ] **Add tooltip/helper text for first-time users** — Subtle hint below canvas: "Select a tool and start drawing"
- [ ] **Refine VideoGrid empty state** — Secondary text: "Your video will appear here once someone joins"
- [ ] **Add success feedback on room create** — Toast appears consistently
- [ ] **Add error feedback for socket disconnection** — Show reconnection attempt count

### I. Form & Input Polish

**Rationale:** Room join form and username inputs have thin borders and minimal styling.

- [ ] **Refine Room.jsx input fields** — Subtle inner shadow, increased padding, icon prefix (🔑 for room ID, 👤 for username)
- [ ] **Add focus state ring** — Replace `outline` with consistent `box-shadow` ring using `--color-primary` at `0 0 0 3px`
- [ ] **Refine form submit buttons** — Subtle gradient overlay on hover, larger border-radius
- [ ] **Add inline validation styling** — Red/green border on invalid/valid inputs with icon indicator
- [ ] **Style disabled states** — Consistent muted appearance with `not-allowed` cursor

### J. Canvas Toolbar Redesign

**Rationale:** Flat row of identical-looking buttons with no visual grouping.

- [ ] **Group tools into logical sections** — Drawing tools | Shapes | Text | Actions (Undo, Redo, Clear)
- [ ] **Add visual separators between groups** — Thin vertical divider lines
- [ ] **Replace text labels with icon+label** — Small SVG icons next to each tool name
- [ ] **Refine active state** — Colored background + inset shadow + colored text
- [ ] **Add tooltip on hover** — Tool name + keyboard shortcut if applicable

### K. Responsive & Mobile Refinements

**Rationale:** Basic `flex-wrap` and one `768px` media query exist.

- [ ] **Add `480px` mobile breakpoint** — Stack panels vertically, reduce padding, compact toolbar
- [ ] **Add `1024px` tablet breakpoint** — Slightly narrower right panel (`300px`), smaller gaps
- [ ] **Ensure canvas scrolls horizontally on small screens** — `overflow-x: auto` container
- [ ] **Reduce font sizes on mobile** — Use `clamp()` for key text elements

### L. Accessibility Deep Pass

**Rationale:** Good baseline from Phase 3, but gaps remain.

- [ ] **Add skip-to-content link** — First focusable element for keyboard users
- [ ] **Add focus indicators** — Visible focus styles on ALL interactive elements
- [ ] **Add `aria-busy` on loading states** — For skeleton loaders and spinners
- [ ] **Add `aria-controls` on expandable sections** — Chat minimize button references chat panel
- [ ] **Add `aria-expanded` on minimize button** — Reflects chat panel state
- [ ] **Add `aria-atomic="true"` on toast container** — Screen readers announce entire toast
- [ ] **Ensure proper heading hierarchy** — `h1` → `h2` → `h3` progression throughout pages

### M. Technical Cleanup

- [ ] **Remove deprecated `DrawingTools.jsx`** — After confirming no imports reference it
- [ ] **Remove unused `App.css`** — Vite boilerplate, not imported anywhere
- [ ] **Fix `z-index` overlap** — `ConfirmationDialog` (1000) vs inline `PopupOverlay` (1000); rename or consolidate
- [ ] **Remove `connectionStatus` prop from `ConnectionStatus`** — Destructured but never rendered
- [ ] **Install `lucide-react`** — Add to `frontend/package.json`
