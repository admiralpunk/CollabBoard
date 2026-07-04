export const handleSignal = (socket, io) => ({ to, data }) => {
  if (!to || typeof to !== 'string') return
  if (!data || typeof data !== 'object') return
  if (!data.type || typeof data.type !== 'string') return

  const targetSocket = io.sockets.sockets[to]
  if (targetSocket) {
    io.to(to).emit("signal", { id: socket.id, data })
  }
}
