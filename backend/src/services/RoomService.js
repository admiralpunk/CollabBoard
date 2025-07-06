class RoomService {
  constructor() {
    this.rooms = new Map();
    this.userNames = new Map(); // socket.id -> username
    this.userConnections = new Map(); // userId -> socket.id (for tracking active connections)
    this.connectionTimestamps = new Map(); // socket.id -> timestamp (for cleanup)
  }

  // Room management
  createRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      return true; // Room was created
    }
    return false; // Room already exists
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  isRoomEmpty(roomId) {
    const room = this.rooms.get(roomId);
    return !room || room.size === 0;
  }

  // User management
  addUserToRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) {
      const isNewUser = !room.has(userId);
      room.add(userId);
      return { isNewUser, userCount: room.size };
    }
    return null;
  }

  removeUserFromRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      const userCount = room.size;
      
      // Clean up empty rooms
      if (userCount === 0) {
        this.deleteRoom(roomId);
      }
      
      return { userCount };
    }
    return null;
  }

  getUsersInRoom(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room) : [];
  }

  getUserCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.size : 0;
  }

  // Username management
  setUsername(socketId, username) {
    this.userNames.set(socketId, username);
  }

  getUsername(socketId) {
    return this.userNames.get(socketId) || socketId;
  }

  removeUsername(socketId) {
    return this.userNames.delete(socketId);
  }

  // User connection tracking
  setUserConnection(userId, socketId) {
    console.log(`[RoomService] Setting user connection: ${userId} -> ${socketId}`);
    this.userConnections.set(userId, socketId);
    this.connectionTimestamps.set(socketId, Date.now());
  }

  getUserConnection(userId) {
    return this.userConnections.get(userId);
  }

  removeUserConnection(userId, socketId) {
    console.log(`[RoomService] Removing user connection: ${userId} -> ${socketId}`);
    this.userConnections.delete(userId);
    this.connectionTimestamps.delete(socketId);
  }

  // Check if user has an active connection
  hasActiveConnection(userId) {
    const socketId = this.userConnections.get(userId);
    if (!socketId) return false;
    
    // Check if the socket still exists and is recent (within last 5 seconds)
    const timestamp = this.connectionTimestamps.get(socketId);
    const isRecent = timestamp && (Date.now() - timestamp) < 5000;
    
    return isRecent;
  }

  // Check if username exists in room
  isUsernameTakenInRoom(io, roomId, username, excludeSocketId = null) {
    // First, clean up any orphaned usernames
    this.cleanupOrphanedUsernames(io);
    
    const socketsInRoom = Array.from(
      io.sockets.adapter.rooms[roomId]?.sockets 
        ? Object.keys(io.sockets.adapter.rooms[roomId].sockets) 
        : []
    );
    
    console.log(`[RoomService] Checking username "${username}" in room ${roomId}`);
    console.log(`[RoomService] Sockets in room:`, socketsInRoom);
    console.log(`[RoomService] Excluding socket:`, excludeSocketId);
    console.log(`[RoomService] Current usernames map:`, Object.fromEntries(this.userNames));
    
    // Check if any socket in the room has this username (excluding the current socket)
    for (const socketId of socketsInRoom) {
      // Skip the socket we're excluding (for reconnections)
      if (excludeSocketId && socketId === excludeSocketId) {
        console.log(`[RoomService] Skipping excluded socket ${socketId}`);
        continue;
      }
      
      const existingUsername = this.getUsername(socketId);
      console.log(`[RoomService] Socket ${socketId} has username: ${existingUsername}`);
      
      if (existingUsername === username) {
        console.log(`[RoomService] Username "${username}" is taken by socket ${socketId}`);
        return true;
      }
    }
    
    console.log(`[RoomService] Username "${username}" is available`);
    return false;
  }

  // Check if a username belongs to a specific user (for reconnection logic)
  isUsernameTakenByUser(io, roomId, username, userId) {
    // First, clean up any orphaned usernames and old connections
    this.cleanupOrphanedUsernames(io);
    this.cleanupOldConnections();
    
    const socketsInRoom = Array.from(
      io.sockets.adapter.rooms[roomId]?.sockets 
        ? Object.keys(io.sockets.adapter.rooms[roomId].sockets) 
        : []
    );
    
    console.log(`[RoomService] Checking username "${username}" for user ${userId} in room ${roomId}`);
    console.log(`[RoomService] Sockets in room:`, socketsInRoom);
    console.log(`[RoomService] User connections:`, Object.fromEntries(this.userConnections));
    
    for (const socketId of socketsInRoom) {
      const existingUsername = this.getUsername(socketId);
      if (existingUsername === username) {
        // Check if this socket belongs to the same user
        const socket = io.sockets.sockets[socketId];
        if (socket && socket._userId === userId) {
          console.log(`[RoomService] Username "${username}" belongs to the same user ${userId}, allowing reconnection`);
          return false; // Allow reconnection
        }
        console.log(`[RoomService] Username "${username}" is taken by different user`);
        return true; // Username taken by different user
      }
    }
    
    console.log(`[RoomService] Username "${username}" is available`);
    return false; // Username not taken
  }

  // Build username map for a room
  buildUsernameMap(io, roomId) {
    const socketsInRoom = Array.from(
      io.sockets.adapter.rooms[roomId]?.sockets 
        ? Object.keys(io.sockets.adapter.rooms[roomId].sockets) 
        : []
    );
    
    const usernameMap = {};
    socketsInRoom.forEach(sid => {
      usernameMap[sid] = this.getUsername(sid);
    });
    
    return usernameMap;
  }

  // Get all rooms info (for debugging/admin)
  getAllRooms() {
    const roomsInfo = {};
    this.rooms.forEach((users, roomId) => {
      roomsInfo[roomId] = {
        userCount: users.size,
        users: Array.from(users)
      };
    });
    return roomsInfo;
  }

  // Clean up orphaned usernames (usernames for sockets that no longer exist)
  cleanupOrphanedUsernames(io) {
    const orphanedSockets = [];
    
    this.userNames.forEach((username, socketId) => {
      // Check if socket exists using the correct Socket.IO API
      const socket = io.sockets.sockets[socketId];
      if (!socket) {
        console.log(`[RoomService] Found orphaned username "${username}" for socket ${socketId}`);
        orphanedSockets.push(socketId);
      }
    });
    
    orphanedSockets.forEach(socketId => {
      this.userNames.delete(socketId);
      console.log(`[RoomService] Cleaned up orphaned username for socket ${socketId}`);
    });
    
    return orphanedSockets.length;
  }

  // Clean up old connections (older than 10 seconds)
  cleanupOldConnections() {
    const now = Date.now();
    const oldConnections = [];
    
    this.connectionTimestamps.forEach((timestamp, socketId) => {
      if (now - timestamp > 10000) { // 10 seconds
        oldConnections.push(socketId);
      }
    });
    
    oldConnections.forEach(socketId => {
      // Find the userId for this socket
      for (const [userId, userSocketId] of this.userConnections.entries()) {
        if (userSocketId === socketId) {
          console.log(`[RoomService] Cleaning up old connection for user ${userId}`);
          this.removeUserConnection(userId, socketId);
          break;
        }
      }
    });
  }

  // Debug method to show current state
  debugState(io) {
    console.log(`[RoomService] Current state:`);
    console.log(`[RoomService] Rooms:`, this.getAllRooms());
    console.log(`[RoomService] Usernames:`, Object.fromEntries(this.userNames));
    
    // Check for orphaned usernames
    const orphanedCount = this.cleanupOrphanedUsernames(io);
    if (orphanedCount > 0) {
      console.log(`[RoomService] Cleaned up ${orphanedCount} orphaned usernames`);
    }
  }
}

export default new RoomService(); 