class RoomService {
  constructor() {
    this.rooms = new Map();
    this.userNames = new Map(); // socket.id -> username
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

  // Check if username exists in room
  isUsernameTakenInRoom(io, roomId, username) {
    const socketsInRoom = Array.from(
      io.sockets.adapter.rooms[roomId]?.sockets 
        ? Object.keys(io.sockets.adapter.rooms[roomId].sockets) 
        : []
    );
    
    return socketsInRoom.some(socketId => {
      const existingUsername = this.getUsername(socketId);
      return existingUsername === username;
    });
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
}

export default new RoomService(); 