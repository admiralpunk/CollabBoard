const WINDOW_MS = 1000
const MAX_DRAWS_PER_WINDOW = 60

const rateCounters = new Map()

const cleanup = () => {
  const now = Date.now()
  for (const [socketId, counter] of rateCounters.entries()) {
    if (now - counter.resetAt > WINDOW_MS * 2) {
      rateCounters.delete(socketId)
    }
  }
}

setInterval(cleanup, 30000).unref()

export const createSocketRateLimiter = () => {
  return (socket, next) => {
    const originalEmit = socket.emit
    const originalOn = socket.onevent

    const counters = {}

    socket.use((packet, next) => {
      const eventName = packet[0]

      if (eventName === 'draw') {
        if (!counters.draw) {
          counters.draw = { count: 0, resetAt: Date.now() + WINDOW_MS }
        }

        if (Date.now() > counters.draw.resetAt) {
          counters.draw = { count: 0, resetAt: Date.now() + WINDOW_MS }
        }

        counters.draw.count++

        if (counters.draw.count > MAX_DRAWS_PER_WINDOW) {
          return
        }
      }

      next()
    })

    next()
  }
}
