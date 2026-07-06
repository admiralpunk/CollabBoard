import roomService from '../../services/RoomService.js'

const VALID_TOOLS = ["pen", "eraser", "rectangle", "circle", "line", "text"]

export const handleDraw = (socket) => (data) => {
  if (!data || typeof data !== 'object') return
  const { roomId, tool, x0, y0, x1, y1, startX, startY, endX, endY, color, size } = data
  if (!roomId || typeof roomId !== 'string') return
  if (!tool || !VALID_TOOLS.includes(tool)) return
  if (typeof color !== 'string') return
  if (typeof size !== 'number' || size < 1 || size > 100) return

  if (tool === "text") {
    if (typeof startX !== 'number' || typeof startY !== 'number') return
    if (typeof data.text !== 'string' || !data.text.trim() || data.text.length > 200) return
  } else if (["rectangle", "circle", "line"].includes(tool)) {
    if (typeof startX !== 'number' || typeof startY !== 'number') return
    if (typeof endX !== 'number' || typeof endY !== 'number') return
  } else if (tool === "pen" || tool === "eraser") {
    if (typeof x0 !== 'number' || typeof y0 !== 'number') return
    if (typeof x1 !== 'number' || typeof y1 !== 'number') return
  }

  roomService.addDrawEvent(roomId, data)
  socket.to(roomId).emit("draw", data)
}

export const handleClearCanvas = (socket) => (roomId) => {
  if (!roomId || typeof roomId !== 'string') return
  roomService.clearCanvasHistory(roomId)
  socket.to(roomId).emit("clear-canvas")
}

export const handleUndoStroke = (socket, io) => (roomId) => {
  if (!roomId || typeof roomId !== 'string') return
  const history = roomService.undoLastStroke(roomId)
  if (history) {
    io.to(roomId).emit("canvas-state", history)
  }
}

export const handleRedoStroke = (socket, io) => (roomId) => {
  if (!roomId || typeof roomId !== 'string') return
  const history = roomService.redoLastStroke(roomId)
  if (history) {
    io.to(roomId).emit("canvas-state", history)
  }
}

export const handleRequestCanvasState = (socket) => (roomId) => {
  if (!roomId || typeof roomId !== 'string') return
  const history = roomService.getCanvasHistory(roomId)
  socket.emit("canvas-state", history)
}
