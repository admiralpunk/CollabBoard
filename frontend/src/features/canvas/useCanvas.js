import { useState, useEffect, useRef } from "react"

export const useCanvas = (canvasRef, socket, roomId, userId, username) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [size, setSize] = useState(5)
  const [tool, setTool] = useState("pen")
  const lastPosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    canvas.width = 800
    canvas.height = 600

    context.fillStyle = "white"
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.lineCap = "round"
    context.lineJoin = "round"

    socket.on("draw", (data) => {
      const ctx = canvas.getContext("2d")
      ctx.save()
      if (data.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out"
        ctx.strokeStyle = "#000000"
      } else {
        ctx.strokeStyle = data.color
      }
      ctx.lineWidth = data.size
      ctx.beginPath()
      ctx.moveTo(data.x0, data.y0)
      ctx.lineTo(data.x1, data.y1)
      ctx.stroke()
      ctx.restore()
    })

    socket.on("clear-canvas", () => {
      const ctx = canvas.getContext("2d")
      ctx.save()
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    })

    socket.on("canvas-state", (history) => {
      const ctx = canvas.getContext("2d")
      ctx.save()
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      ctx.save()
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      for (const data of history) {
        if (data.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out"
          ctx.strokeStyle = "#000000"
        } else {
          ctx.globalCompositeOperation = "source-over"
          ctx.strokeStyle = data.color
        }
        ctx.lineWidth = data.size
        ctx.beginPath()
        ctx.moveTo(data.x0, data.y0)
        ctx.lineTo(data.x1, data.y1)
        ctx.stroke()
      }
      ctx.restore()
    })

    return () => {
      socket.off("draw")
      socket.off("clear-canvas")
      socket.off("canvas-state")
    }
  }, [socket])

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    lastPosition.current = { x, y }
    const context = canvas.getContext("2d")
    context.beginPath()
    context.moveTo(x, y)
    if (tool === "eraser") {
      context.strokeStyle = "#000000"
      context.globalCompositeOperation = "destination-out"
    } else {
      context.strokeStyle = color
      context.globalCompositeOperation = "source-over"
    }
    context.lineWidth = size
  }

  const draw = (e) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const context = canvas.getContext("2d")
    context.lineTo(x, y)
    context.stroke()

    socket.emit("draw", {
      roomId,
      x0: lastPosition.current.x,
      y0: lastPosition.current.y,
      x1: x,
      y1: y,
      color,
      size,
      tool,
    })

    lastPosition.current = { x, y }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    context.save()
    context.globalCompositeOperation = "source-over"
    context.fillStyle = "white"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.restore()
    socket.emit("clear-canvas", roomId)
  }

  return {
    isDrawing,
    color,
    size,
    tool,
    startDrawing,
    draw,
    stopDrawing,
    setColor,
    setSize,
    setTool,
    clearCanvas,
  }
}
