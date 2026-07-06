# Resolved Issues

## 1. Inline text tool not working

- Clicking canvas with Text tool selected shows text input overlay
- Typing produces no visible characters in the input
- Pressing Enter or clicking elsewhere does not commit any text
- Replaced `window.prompt()` with inline `<textarea>` overlay for better UX, but input appears to not capture keystrokes
- Files: `frontend/src/features/canvas/useCanvas.js`, `frontend/src/features/canvas/Canvas.jsx`

### Fix

**Root cause 1 — positioning mismatch:** `TextOverlay` was absolutely positioned relative to `CanvasContainer` (which includes the ToolBar), but `textPosition` was computed in canvas-relative coordinates. The overlay appeared above the click point by the toolbar height — often behind the toolbar or off-screen, making typed characters invisible.

**Root cause 2 — missing `preventDefault`:** `startDrawing()` didn't call `e.preventDefault()` when handling the text tool, letting browser default pointer behavior interfere with the textarea.

**Changes:**
- Wrapped `<StyledCanvas>` and `<TextOverlay>` in a `<CanvasWrapper>` with `position: relative` so the text overlay's absolute position context matches the canvas, not the container.
- Added `e.preventDefault()` in `startDrawing()` when `tool === "text"` to prevent default pointer behavior.
