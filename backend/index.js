import express from "express";
import cors from "cors"; // Import cors
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Use CORS middleware for express
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN, // Allow only your frontend domain
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN, // Allow only your frontend domain
    methods: ["GET", "POST"],
  },
  transports: process.env.SOCKET_TRANSPORTS.split(","), // Use transports from environment variables
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    io.to(roomId).emit("user-joined", {
      userId: socket.id,
      userCount: rooms.get(roomId).size,
    });
  });

  socket.on("signal", ({ userId, signal }) => {
    io.to(userId).emit("signal", { userId: socket.id, signal });
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

  socket.on("disconnect", () => {
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        io.to(roomId).emit("user-left", {
          userId: socket.id,
          userCount: users.size,
        });
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
