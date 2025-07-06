import roomService from '../../services/RoomService.js';

export const handleJoinRoom = (socket, io) => ({ roomId, userId, username }) => {
  console.log(`[handleJoinRoom] ${socket.id} trying to join room ${roomId} with username "${username}" and userId "${userId}"`);
  
  // Check if user already has an active connection
  if (roomService.hasActiveConnection(userId)) {
    const existingSocketId = roomService.getUserConnection(userId);
    console.log(`[handleJoinRoom] User ${userId} already has active connection ${existingSocketId}, rejecting new connection`);
    socket.emit("username-taken", { 
      message: `You already have an active connection. Please wait a moment before trying again.` 
    });
    return;
  }
  
  // Debug current state
  roomService.debugState(io);
  
  // Check if username is taken by a different user
  if (roomService.isUsernameTakenByUser(io, roomId, username, userId)) {
    console.log(`[handleJoinRoom] Username "${username}" is taken by a different user in room ${roomId}`);
    socket.emit("username-taken", { 
      message: `Username "${username}" is already taken in this room. Please choose a different username.` 
    });
    return;
  }

  console.log(`[handleJoinRoom] Username "${username}" is available or belongs to same user, proceeding with join`);
  
  // Remove any existing username for this socket (in case of reconnection)
  roomService.removeUsername(socket.id);
  
  // Join the room
  socket.join(roomId);
  
  // Create room if it doesn't exist
  const roomCreated = roomService.createRoom(roomId);
  
  // Add user to room
  const result = roomService.addUserToRoom(roomId, userId);
  
  // Store user info on socket
  socket._userId = userId;
  socket._roomId = roomId;
  roomService.setUsername(socket.id, username);
  
  // Track this user connection
  roomService.setUserConnection(userId, socket.id);
  
  // Get room data
  const users = roomService.getUsersInRoom(roomId);
  const usernameMap = roomService.buildUsernameMap(io, roomId);
  
  // Emit events
  socket.emit("all-users", { users, usernameMap });
  
  if (roomCreated) {
    socket.emit("room-created", { roomId });
  }
  
  io.to(roomId).emit("usernames-update", { usernameMap });
  
  if (result && result.isNewUser) {
    io.to(roomId).emit("user-joined", {
      userId,
      userCount: result.userCount,
    });
  }
};

export const handleJoin = (socket, io) => (room) => {
  console.log(`[backend] ${socket.id} requesting WebRTC join for room ${room}`);
  
  // Check if socket is already in the room
  const isInRoom = socket.rooms.hasOwnProperty(room);
  console.log(`[backend] ${socket.id} already in room ${room}: ${isInRoom}`);
  
  if (!isInRoom) {
    socket.join(room);
    console.log(`[backend] ${socket.id} joined room ${room} for WebRTC`);
  }
  
  // Notify the new peer of all existing peers in the room (except itself)
  const clients = Array.from(
    io.sockets.adapter.rooms[room]?.sockets 
      ? Object.keys(io.sockets.adapter.rooms[room].sockets) 
      : []
  ).filter(id => id !== socket.id);
  
  console.log(`[backend] ${socket.id} peers in room ${room}:`, clients);
  socket.emit("peers-in-room", clients);
  
  // Notify other peers in the room about the new peer
  socket.to(room).emit("peer-joined", socket.id);
  console.log(`[backend] ${socket.id} notified peers in room ${room} about new peer`);
};

export const handleDisconnecting = (socket, io) => () => {
  console.log(`[backend] ${socket.id} disconnecting`);
  
  Object.keys(socket.rooms).forEach(room => {
    if (room !== socket.id) {
      socket.to(room).emit("peer-left", socket.id);
      
      // Remove user from room's user set and emit updated user count
      if (socket._userId) {
        const result = roomService.removeUserFromRoom(room, socket._userId);
        if (result) {
          io.to(room).emit("user-left", { 
            userId: socket._userId, 
            userCount: result.userCount 
          });
        }
      }
    }
  });
  
  // Clean up connection tracking
  if (socket._userId) {
    roomService.removeUserConnection(socket._userId, socket.id);
  }
  roomService.removeUsername(socket.id);
};

export const handleDisconnect = (socket, io) => () => {
  console.log(`[backend] ${socket.id} disconnected`);
  
  // Ensure cleanup happens even if disconnecting event didn't fire
  Object.keys(socket.rooms).forEach(room => {
    if (room !== socket.id) {
      socket.to(room).emit("peer-left", socket.id);
      
      // Remove user from room's user set and emit updated user count
      if (socket._userId) {
        const result = roomService.removeUserFromRoom(room, socket._userId);
        if (result) {
          io.to(room).emit("user-left", { 
            userId: socket._userId, 
            userCount: result.userCount 
          });
        }
      }
    }
  });
  
  // Clean up connection tracking
  if (socket._userId) {
    roomService.removeUserConnection(socket._userId, socket.id);
  }
  roomService.removeUsername(socket.id);
}; 