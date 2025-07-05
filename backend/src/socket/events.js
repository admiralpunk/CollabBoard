import {
  handleJoinRoom,
  handleJoin,
  handleDisconnecting,
  handleDraw,
  handleClearCanvas,
  handleChatMessage,
  handleSignal
} from './handlers/index.js';

export const setupSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Room events
    socket.on("join-room", handleJoinRoom(socket, io));
    socket.on("join", handleJoin(socket, io));
    socket.on("disconnecting", handleDisconnecting(socket, io));

    // Canvas events
    socket.on("draw", handleDraw(socket));
    socket.on("clear-canvas", handleClearCanvas(socket));

    // Chat events
    socket.on("chat-message", handleChatMessage(socket, io));

    // WebRTC signaling events
    socket.on("signal", handleSignal(socket, io));
  });
}; 