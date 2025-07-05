export const handleChatMessage = (socket, io) => ({ roomId, message }) => {
  io.to(roomId).emit("chat-message", { message });
}; 