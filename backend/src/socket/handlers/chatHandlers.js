export const handleChatMessage = (socket, io) => ({ roomId, message }) => {
  if (!roomId || typeof roomId !== 'string') return
  if (!message || typeof message !== 'object') return
  if (!message.text || typeof message.text !== 'string') return
  if (message.text.length > 2000) return
  if (!message.socketId || typeof message.socketId !== 'string') return

  io.to(roomId).emit("chat-message", { message })
}
