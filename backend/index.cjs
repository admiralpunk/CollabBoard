const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const socketio = require("socket.io");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Use CORS middleware for express
app.use(cors());

const httpServer = createServer(app);
// const io = socketio(httpServer, {
//   transports: process.env.SOCKET_TRANSPORTS.split(","), // Use transports from environment variables
// });

const io = socketio(httpServer, {
  transports: ["websocket", "polling"],
});

// For socket.io v2.x, set CORS headers manually if needed
io.origins('*:*');

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    const userSet = rooms.get(roomId);
    const isNewUser = !userSet.has(userId);
    userSet.add(userId);
    socket._userId = userId;
    socket._roomId = roomId;
    const users = Array.from(userSet);
    console.log("users", users);
    socket.emit("all-users", { users });
    console.log('[backend] Emitting all-users to', socket.id, 'with users:', users);
    if (isNewUser) {
      io.to(roomId).emit("user-joined", {
        userId,
        userCount: userSet.size,
      });
    }
  });

  socket.on("signal", ({ to, data }) => {
    if (to) {
      io.to(to).emit("signal", { id: socket.id, data });
      console.log(`[backend] Relaying signal from ${socket.id} to ${to}`);
    }
  });

  socket.on("draw", (data) => {
    socket.to(data.roomId).emit("draw", data);
  });

  socket.on("clear-canvas", (roomId) => {
    socket.to(roomId).emit("clear-canvas");
  });

  socket.on("chat-message", ({ roomId, message }) => {
    io.to(roomId).emit("chat-message", { message });
  });

  socket.on("join", (room) => {
    console.log(`[backend] ${socket.id} joined room ${room}`);
    socket.join(room);
    // Notify the new peer of all existing peers in the room (except itself)
    const clients = Array.from(io.sockets.adapter.rooms[room]?.sockets ? Object.keys(io.sockets.adapter.rooms[room].sockets) : []).filter(id => id !== socket.id);
    socket.emit("peers-in-room", clients);
    // Notify other peers in the room about the new peer
    socket.to(room).emit("peer-joined", socket.id);
  });

  socket.on("signal", ({ to, data }) => {
    console.log(`[backend] Signal from ${socket.id} to ${to}:`, data.type);
    if (to) {
      io.to(to).emit("signal", { id: socket.id, data });
    }
  });

  socket.on("disconnecting", () => {
    console.log(`[backend] ${socket.id} disconnecting`);
    Object.keys(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit("peer-left", socket.id);
        // Remove user from room's user set and emit updated user count
        if (rooms.has(room)) {
          const userSet = rooms.get(room);
          if (socket._userId) {
            userSet.delete(socket._userId);
            io.to(room).emit("user-left", { userId: socket._userId, userCount: userSet.size });
            // If room is empty, delete it
            if (userSet.size === 0) {
              rooms.delete(room);
            }
          }
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
