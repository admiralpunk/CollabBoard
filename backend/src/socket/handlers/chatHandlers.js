import roomService from '../../services/RoomService.js'

export const handleChatMessage = (socket, io) => ({ roomId, message }) => {
  if (!roomId || typeof roomId !== 'string') return
  if (!message || typeof message !== 'object') return
  if (!message.text || typeof message.text !== 'string') return
  if (message.text.length > 2000) return
  if (!message.socketId || typeof message.socketId !== 'string') return

  const username = roomService.getUsername(socket.id)

  const validatedMessage = {
    id: message.id,
    text: message.text,
    sender: username,
    socketId: socket.id,
    timestamp: message.timestamp || new Date().toISOString(),
  }

  io.to(roomId).emit("chat-message", { message: validatedMessage })
}

export const handleTyping = (socket) => ({ roomId, isTyping }) => {
  if (!roomId || typeof roomId !== 'string') return
  socket.to(roomId).emit("user-typing", { socketId: socket.id, isTyping })
}
