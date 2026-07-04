import roomService from '../../services/RoomService.js'

export const handleJoinRoom = (socket, io) => ({ roomId, userId, username }) => {
  if (!roomId || typeof roomId !== 'string') return
  if (!userId || typeof userId !== 'string') return
  if (!username || typeof username !== 'string') return
  if (username.length < 1 || username.length > 30) return

  // Check if user already has an active connection
  if (roomService.hasActiveConnection(userId, io)) {
    const existingSocketId = roomService.getUserConnection(userId)
    socket.emit("username-taken", {
      message: `You already have an active connection. Please wait a moment before trying again.`
    })
    return
  }

  roomService.debugState(io)

  if (roomService.isUsernameTakenByUser(io, roomId, username, userId)) {
    socket.emit("username-taken", {
      message: `Username "${username}" is already taken in this room. Please choose a different username.`
    })
    return
  }

  roomService.removeUsername(socket.id)

  socket.join(roomId)

  const roomCreated = roomService.createRoom(roomId)
  const result = roomService.addUserToRoom(roomId, userId)

  socket._userId = userId
  socket._roomId = roomId
  roomService.setUsername(socket.id, username)

  roomService.setUserConnection(userId, socket.id)

  const users = roomService.getUsersInRoom(roomId)
  const usernameMap = roomService.buildUsernameMap(io, roomId)

  socket.emit("all-users", { users, usernameMap })

  if (roomCreated) {
    socket.emit("room-created", { roomId })
  }

  // Send current canvas state to the joining user
  const canvasHistory = roomService.getCanvasHistory(roomId)
  if (canvasHistory.length > 0) {
    socket.emit("canvas-state", canvasHistory)
  }

  io.to(roomId).emit("usernames-update", { usernameMap })

  if (result && result.isNewUser) {
    io.to(roomId).emit("user-joined", {
      userId,
      userCount: result.userCount,
    })
  }
}

export const handleJoin = (socket, io) => (room) => {
  if (!room || typeof room !== 'string') return

  const isInRoom = socket.rooms.hasOwnProperty(room)

  if (!isInRoom) {
    socket.join(room)
  }

  const clients = Array.from(
    io.sockets.adapter.rooms[room]?.sockets
      ? Object.keys(io.sockets.adapter.rooms[room].sockets)
      : []
  ).filter(id => id !== socket.id)

  socket.emit("peers-in-room", clients)

  socket.to(room).emit("peer-joined", socket.id)
}

export const handleDisconnecting = (socket, io) => () => {
  Object.keys(socket.rooms).forEach(room => {
    if (room !== socket.id) {
      socket.to(room).emit("peer-left", socket.id)

      if (socket._userId) {
        const result = roomService.removeUserFromRoom(room, socket._userId)
        if (result) {
          io.to(room).emit("user-left", {
            userId: socket._userId,
            userCount: result.userCount
          })
        }
      }
    }
  })

  if (socket._userId) {
    roomService.removeUserConnection(socket._userId, socket.id)
  }
  roomService.removeUsername(socket.id)
}

export const handleDisconnect = (socket, io) => () => {
  // Fallback cleanup only — primary cleanup happens in handleDisconnecting
  // This catches edge cases where disconnecting didn't fire
  if (socket._userId) {
    const rooms = roomService.getUsersInRoom(socket._roomId)
    if (rooms.length > 0 && socket._roomId) {
      const result = roomService.removeUserFromRoom(socket._roomId, socket._userId)
      if (result) {
        io.to(socket._roomId).emit("user-left", {
          userId: socket._userId,
          userCount: result.userCount
        })
      }
    }
    roomService.removeUserConnection(socket._userId, socket.id)
  }
  roomService.removeUsername(socket.id)
}
