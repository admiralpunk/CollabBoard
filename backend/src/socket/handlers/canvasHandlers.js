import roomService from '../../services/RoomService.js'

export const handleDraw = (socket) => (data) => {
  if (!data || typeof data !== 'object') return
  const { roomId, x0, y0, x1, y1, color, size } = data
  if (!roomId || typeof roomId !== 'string') return
  if (typeof x0 !== 'number' || typeof y0 !== 'number') return
  if (typeof x1 !== 'number' || typeof y1 !== 'number') return
  if (typeof color !== 'string') return
  if (typeof size !== 'number' || size < 1 || size > 100) return

  roomService.addDrawEvent(roomId, data)
  socket.to(data.roomId).emit("draw", data)
}

export const handleClearCanvas = (socket) => (roomId) => {
  if (!roomId || typeof roomId !== 'string') return
  roomService.clearCanvasHistory(roomId)
  socket.to(roomId).emit("clear-canvas")
}

export const handleRequestCanvasState = (socket) => (roomId) => {
  if (!roomId || typeof roomId !== 'string') return
  const history = roomService.getCanvasHistory(roomId)
  socket.emit("canvas-state", history)
}
