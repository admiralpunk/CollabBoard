export const handleDraw = (socket) => (data) => {
  socket.to(data.roomId).emit("draw", data);
};

export const handleClearCanvas = (socket) => (roomId) => {
  socket.to(roomId).emit("clear-canvas");
}; 