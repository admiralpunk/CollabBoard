import {
  handleJoinRoom,
  handleJoin,
  handleDisconnecting,
  handleDisconnect,
  handleDraw,
  handleClearCanvas,
  handleUndoStroke,
  handleRedoStroke,
  handleRequestCanvasState,
  handleChatMessage,
  handleTyping,
  handleSignal
} from './handlers/index.js'

export const setupSocketEvents = (io) => {
  io.on("connection", (socket) => {

    socket.on("join-room", handleJoinRoom(socket, io))
    socket.on("join", handleJoin(socket, io))
    socket.on("disconnecting", handleDisconnecting(socket, io))
    socket.on("disconnect", handleDisconnect(socket, io))

    socket.on("draw", handleDraw(socket))
    socket.on("clear-canvas", handleClearCanvas(socket))
    socket.on("undo-stroke", handleUndoStroke(socket, io))
    socket.on("redo-stroke", handleRedoStroke(socket, io))
    socket.on("request-canvas-state", handleRequestCanvasState(socket))

    socket.on("chat-message", handleChatMessage(socket, io))
    socket.on("typing", handleTyping(socket))

    socket.on("signal", handleSignal(socket, io))
  })
}
