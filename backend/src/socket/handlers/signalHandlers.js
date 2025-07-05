export const handleSignal = (socket, io) => ({ to, data }) => {
  console.log(`[backend] Signal from ${socket.id} to ${to}:`, data.type);
  if (to) {
    const targetSocket = io.sockets.sockets[to];
    if (targetSocket) {
      console.log(`[backend] Forwarding signal to ${to}`);
      io.to(to).emit("signal", { id: socket.id, data });
    } else {
      console.warn(`[backend] Target socket ${to} not found for signal from ${socket.id}`);
    }
  } else {
    console.warn(`[backend] Signal from ${socket.id} has no target`);
  }
}; 