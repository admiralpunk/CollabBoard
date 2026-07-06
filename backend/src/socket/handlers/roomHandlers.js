import roomService from '../../services/RoomService.js'
import logger from '../../utils/logger.js'

export const handleJoinRoom = (socket, io) => ({ roomId, userId, username }) => {
  if (!roomId || typeof roomId !== 'string' || roomId.length > 30) return
  if (!userId || typeof userId !== 'string') return
  if (!username || typeof username !== 'string') return
  if (username.length < 2 || username.length > 20) return
  if (!/^[a-zA-Z0-9_\u0080-\uFFFF]+$/.test(username)) return

  if (roomService.hasActiveConnection(userId, io)) {
    socket.emit("username-taken", {
      message: `You already have an active connection. Please wait a moment before trying again.`
    })
    return
  }

  if (roomService.isUsernameTakenByUser(io, roomId, username, userId)) {
    socket.emit("username-taken", {
      message: `Username "${username}" is already taken in this room. Please choose a different username.`
    })
    return
  }

  roomService.removeUsername(socket.id)

  const roomExisted = !!io.sockets.adapter.rooms?.[roomId]
  socket.join(roomId)

  const userCount = roomService.getUserCountInRoom(io, roomId)

  socket._userId = userId
  socket._roomId = roomId
  roomService.setUsername(socket.id, username)
  roomService.setUserConnection(userId, socket.id)

  const users = roomService.getUsersInRoom(io, roomId)
  const usernameMap = roomService.buildUsernameMap(io, roomId)

  socket.emit("all-users", { users, usernameMap })

  if (!roomExisted) {
    socket.emit("room-created", { roomId })
  }

  const canvasHistory = roomService.getCanvasHistory(roomId)
  if (canvasHistory.length > 0) {
    socket.emit("canvas-state", canvasHistory)
  }

  io.to(roomId).emit("usernames-update", { usernameMap })
  io.to(roomId).emit("user-joined", {
    userId,
    userCount,
  })
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
        const count = roomService.getUserCountInRoom(io, room)
        io.to(room).emit("user-left", {
          userId: socket._userId,
          userCount: Math.max(0, count - 1)
        })
      }
    }
  })

  if (socket._userId) {
    roomService.removeUserConnection(socket._userId, socket.id)
  }
  roomService.removeUsername(socket.id)
}

export const handleDisconnect = (socket, io) => () => {
  if (socket._userId) {
    const roomId = socket._roomId
    if (roomId) {
      const count = roomService.getUserCountInRoom(io, roomId)
      if (count > 0) {
        io.to(roomId).emit("user-left", {
          userId: socket._userId,
          userCount: Math.max(0, count - 1)
        })
      }
    }
    roomService.removeUserConnection(socket._userId, socket.id)
  }
  roomService.removeUsername(socket.id)
}
