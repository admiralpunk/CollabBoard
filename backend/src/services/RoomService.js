import logger from '../utils/logger.js'

class RoomService {
  constructor() {
    this.userNames = new Map()
    this.userConnections = new Map()
    this.connectionTimestamps = new Map()
    this.canvasHistory = new Map()
    this.canvasUndoStack = new Map()
  }

  getSocketsInRoom(io, roomId) {
    const room = io.sockets.adapter.rooms?.[roomId]
    if (!room?.sockets) return []
    return Object.keys(room.sockets)
  }

  getUserCountInRoom(io, roomId) {
    return this.getSocketsInRoom(io, roomId).length
  }

  isRoomEmpty(io, roomId) {
    return this.getUserCountInRoom(io, roomId) === 0
  }

  getUsersInRoom(io, roomId) {
    return this.getSocketsInRoom(io, roomId)
  }

  setUsername(socketId, username) {
    this.userNames.set(socketId, username)
  }

  getUsername(socketId) {
    return this.userNames.get(socketId) || socketId
  }

  removeUsername(socketId) {
    return this.userNames.delete(socketId)
  }

  setUserConnection(userId, socketId) {
    logger.debug(`Setting user connection: ${userId} -> ${socketId}`)
    this.userConnections.set(userId, socketId)
    this.connectionTimestamps.set(socketId, Date.now())
  }

  getUserConnection(userId) {
    return this.userConnections.get(userId)
  }

  removeUserConnection(userId, socketId) {
    logger.debug(`Removing user connection: ${userId} -> ${socketId}`)
    this.userConnections.delete(userId)
    this.connectionTimestamps.delete(socketId)
  }

  addDrawEvent(roomId, data) {
    if (!this.canvasHistory.has(roomId)) {
      this.canvasHistory.set(roomId, [])
    }
    this.canvasHistory.get(roomId).push(data)
  }

  getCanvasHistory(roomId) {
    return this.canvasHistory.get(roomId) || []
  }

  clearCanvasHistory(roomId) {
    this.canvasHistory.delete(roomId)
    this.canvasUndoStack.delete(roomId)
  }

  undoLastStroke(roomId) {
    const history = this.canvasHistory.get(roomId)
    if (!history || history.length === 0) return null

    let undoStack = this.canvasUndoStack.get(roomId)
    if (!undoStack) {
      undoStack = []
      this.canvasUndoStack.set(roomId, undoStack)
    }

    const lastStrokeId = history[history.length - 1].strokeId
    const removed = []
    while (history.length > 0 && history[history.length - 1].strokeId === lastStrokeId) {
      removed.unshift(history.pop())
    }
    undoStack.push(...removed)
    return this.getCanvasHistory(roomId)
  }

  redoLastStroke(roomId) {
    const undoStack = this.canvasUndoStack.get(roomId)
    if (!undoStack || undoStack.length === 0) return null

    const lastStrokeId = undoStack[undoStack.length - 1].strokeId
    const restored = []
    while (undoStack.length > 0 && undoStack[undoStack.length - 1].strokeId === lastStrokeId) {
      restored.unshift(undoStack.pop())
    }
    restored.forEach(d => this.addDrawEvent(roomId, d))
    return this.getCanvasHistory(roomId)
  }

  hasActiveConnection(userId, io) {
    const socketId = this.userConnections.get(userId)
    if (!socketId) return false

    const socket = io.sockets.sockets[socketId]
    if (socket && socket.connected) {
      return true
    }

    this.userConnections.delete(userId)
    this.connectionTimestamps.delete(socketId)
    return false
  }

  isUsernameTakenInRoom(io, roomId, username, excludeSocketId = null) {
    this.cleanupOrphanedUsernames(io)

    const socketsInRoom = this.getSocketsInRoom(io, roomId)

    logger.debug(`Checking username "${username}" in room ${roomId}`)
    logger.debug(`Sockets in room:`, socketsInRoom)
    logger.debug(`Excluding socket:`, excludeSocketId)

    for (const socketId of socketsInRoom) {
      if (excludeSocketId && socketId === excludeSocketId) {
        logger.debug(`Skipping excluded socket ${socketId}`)
        continue
      }

      const existingUsername = this.getUsername(socketId)
      logger.debug(`Socket ${socketId} has username: ${existingUsername}`)

      if (existingUsername === username) {
        logger.debug(`Username "${username}" is taken by socket ${socketId}`)
        return true
      }
    }

    logger.debug(`Username "${username}" is available`)
    return false
  }

  isUsernameTakenByUser(io, roomId, username, userId) {
    this.cleanupOrphanedUsernames(io)
    this.cleanupOldConnections()

    const socketsInRoom = this.getSocketsInRoom(io, roomId)

    logger.debug(`Checking username "${username}" for user ${userId} in room ${roomId}`)
    logger.debug(`Sockets in room:`, socketsInRoom)

    for (const socketId of socketsInRoom) {
      const existingUsername = this.getUsername(socketId)
      if (existingUsername === username) {
        const socket = io.sockets.sockets[socketId]
        if (socket && socket._userId === userId) {
          logger.debug(`Username "${username}" belongs to the same user ${userId}, allowing reconnection`)
          return false
        }
        logger.debug(`Username "${username}" is taken by different user`)
        return true
      }
    }

    logger.debug(`Username "${username}" is available`)
    return false
  }

  buildUsernameMap(io, roomId) {
    const socketsInRoom = this.getSocketsInRoom(io, roomId)
    const usernameMap = {}
    socketsInRoom.forEach(sid => {
      usernameMap[sid] = this.getUsername(sid)
    })
    return usernameMap
  }

  getAllRooms(io) {
    const rooms = io?.sockets?.adapter?.rooms
    const connectedSockets = io?.sockets?.sockets || {}
    if (!rooms) return {}

    const socketIds = new Set(Object.keys(connectedSockets))

    const roomsInfo = {}
    for (const roomId of Object.keys(rooms)) {
      if (socketIds.has(roomId)) continue

      const sockets = Object.keys(rooms[roomId]?.sockets || {})
      if (sockets.length === 0) continue

      roomsInfo[roomId] = {
        userCount: sockets.length
      }
    }
    return roomsInfo
  }

  cleanupOrphanedUsernames(io) {
    const orphanedSockets = []

    this.userNames.forEach((username, socketId) => {
      const socket = io.sockets.sockets[socketId]
      if (!socket) {
        logger.debug(`Found orphaned username "${username}" for socket ${socketId}`)
        orphanedSockets.push(socketId)
      }
    })

    orphanedSockets.forEach(socketId => {
      this.userNames.delete(socketId)
      logger.debug(`Cleaned up orphaned username for socket ${socketId}`)
    })

    return orphanedSockets.length
  }

  cleanupOldConnections() {
    const now = Date.now()
    const oldConnections = []

    this.connectionTimestamps.forEach((timestamp, socketId) => {
      if (now - timestamp > 10000) {
        oldConnections.push(socketId)
      }
    })

    oldConnections.forEach(socketId => {
      for (const [userId, userSocketId] of this.userConnections.entries()) {
        if (userSocketId === socketId) {
          logger.debug(`Cleaning up old connection for user ${userId}`)
          this.removeUserConnection(userId, socketId)
          break
        }
      }
    })
  }
}

export default new RoomService()
