import { useState, useEffect, useRef, useCallback } from "react"

const THROTTLE_MS = 30
const SHAPE_TOOLS = ["rectangle", "circle", "line"]

export const useCanvas = (canvasRef, socket, roomId) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [size, setSize] = useState(5)
  const [tool, setTool] = useState("pen")
  const [editingText, setEditingText] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [textValue, setTextValue] = useState("")
  const lastPosition = useRef({ x: 0, y: 0 })
  const throttleTimer = useRef(null)
  const strokeIdRef = useRef(0)
  const hasDrawnRef = useRef(false)
  const isDrawingRef = useRef(false)
  const textEditingRef = useRef(false)
  const resizeObserverRef = useRef(null)
  const snapshotRef = useRef(null)
  const snapshotStartRef = useRef({ x: 0, y: 0 })

  const drawOnCanvas = useCallback((ctx, data) => {
    ctx.save()

    ctx.lineWidth = data.size
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (data.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
      ctx.strokeStyle = "#000000"
    } else {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = data.color
    }

    if (data.tool === "rectangle") {
      ctx.strokeRect(data.startX, data.startY, data.endX - data.startX, data.endY - data.startY)
    } else if (data.tool === "circle") {
      const cx = (data.startX + data.endX) / 2
      const cy = (data.startY + data.endY) / 2
      const rx = Math.abs(data.endX - data.startX) / 2
      const ry = Math.abs(data.endY - data.startY) / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else if (data.tool === "line") {
      ctx.beginPath()
      ctx.moveTo(data.startX, data.startY)
      ctx.lineTo(data.endX, data.endY)
      ctx.stroke()
    } else if (data.tool === "text") {
      ctx.font = `${Math.max(12, data.size * 4)}px sans-serif`
      ctx.fillStyle = data.color
      ctx.textBaseline = "top"
      ctx.fillText(data.text, data.startX, data.startY)
    } else {
      ctx.beginPath()
      ctx.moveTo(data.x0, data.y0)
      ctx.lineTo(data.x1, data.y1)
      ctx.stroke()
    }

    ctx.restore()
  }, [])

  const drawShapePreview = (ctx, start, end) => {
    ctx.save()
    ctx.globalCompositeOperation = "source-over"
    ctx.strokeStyle = color
    ctx.lineWidth = size
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (tool === "rectangle") {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
    } else if (tool === "circle") {
      const cx = (start.x + end.x) / 2
      const cy = (start.y + end.y) / 2
      const rx = Math.abs(end.x - start.x) / 2
      const ry = Math.abs(end.y - start.y) / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else if (tool === "line") {
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    ctx.restore()
  }

  const replayHistory = useCallback((ctx, history) => {
    ctx.save()
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.restore()

    for (const data of history) {
      drawOnCanvas(ctx, data)
    }
  }, [drawOnCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    const parent = canvas.parentElement
    const initW = parent ? Math.min(parent.getBoundingClientRect().width - 40, 800) : 800
    canvas.width = Math.max(initW, 320)
    canvas.height = 600

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    socket.on("draw", drawOnCanvas.bind(null, ctx))

    socket.on("clear-canvas", () => {
      ctx.save()
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.restore()
    })

    socket.on("canvas-state", (history) => {
      replayHistory(ctx, history)
    })

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const maxW = Math.min(rect.width - 40, 1000)
      const maxH = Math.min(window.innerHeight * 0.7, 700)

      const prevData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = maxW
      canvas.height = maxH
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.putImageData(prevData, 0, 0)
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserverRef.current.observe(canvas.parentElement)

    return () => {
      socket.off("draw")
      socket.off("clear-canvas")
      socket.off("canvas-state")
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [socket, drawOnCanvas, replayHistory])

  const getPointerPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX
    const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY
    if (clientX === undefined) return null
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    const pos = getPointerPos(e)
    if (!pos) return

    strokeIdRef.current++
    lastPosition.current = pos

    if (tool === "text") {
      if (textEditingRef.current) return
      e.preventDefault()
      textEditingRef.current = true
      setTextPosition({ x: pos.x, y: pos.y })
      setTextValue("")
      setEditingText(true)
      return
    }

    hasDrawnRef.current = false
    isDrawingRef.current = true
    setIsDrawing(true)

    const isShape = SHAPE_TOOLS.includes(tool)
    if (isShape) {
      snapshotStartRef.current = { x: pos.x, y: pos.y }
      snapshotRef.current = canvasRef.current.getContext("2d").getImageData(
        0, 0, canvasRef.current.width, canvasRef.current.height
      )
    }

    const ctx = canvasRef.current.getContext("2d")
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    if (tool === "eraser") {
      ctx.strokeStyle = "#000000"
      ctx.globalCompositeOperation = "destination-out"
    } else if (!isShape) {
      ctx.strokeStyle = color
      ctx.globalCompositeOperation = "source-over"
    }
    ctx.lineWidth = size
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }

  const draw = (e) => {
    if (!isDrawingRef.current) return
    e.preventDefault?.()

    const pos = getPointerPos(e)
    if (!pos) return

    const isShape = SHAPE_TOOLS.includes(tool)
    if (isShape) {
      hasDrawnRef.current = true
      const ctx = canvasRef.current.getContext("2d")
      ctx.putImageData(snapshotRef.current, 0, 0)
      drawShapePreview(ctx, snapshotStartRef.current, pos)
      lastPosition.current = pos
      return
    }

    const ctx = canvasRef.current.getContext("2d")
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    hasDrawnRef.current = true

    if (throttleTimer.current) return
    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null
    }, THROTTLE_MS)

    socket.emit("draw", {
      roomId,
      x0: lastPosition.current.x,
      y0: lastPosition.current.y,
      x1: pos.x,
      y1: pos.y,
      color,
      size,
      tool,
      strokeId: strokeIdRef.current,
    })

    lastPosition.current = pos
  }

  const stopDrawing = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    setIsDrawing(false)

    const isShape = SHAPE_TOOLS.includes(tool)
    if (isShape) {
      if (!hasDrawnRef.current) return
      const ctx = canvasRef.current.getContext("2d")
      const start = snapshotStartRef.current
      const end = lastPosition.current
      ctx.putImageData(snapshotRef.current, 0, 0)
      drawOnCanvas(ctx, {
        tool, startX: start.x, startY: start.y,
        endX: end.x, endY: end.y,
        color, size, strokeId: strokeIdRef.current,
      })
      socket.emit("draw", {
        roomId, tool,
        startX: start.x, startY: start.y,
        endX: end.x, endY: end.y,
        color, size, strokeId: strokeIdRef.current,
      })
      return
    }

    if (throttleTimer.current) {
      clearTimeout(throttleTimer.current)
      throttleTimer.current = null
    }

    if (!hasDrawnRef.current) return

    const pos = lastPosition.current
    socket.emit("draw", {
      roomId,
      x0: pos.x,
      y0: pos.y,
      x1: pos.x,
      y1: pos.y,
      color,
      size,
      tool,
      strokeId: strokeIdRef.current,
      final: true,
    })
  }

  const commitText = useCallback(() => {
    textEditingRef.current = false
    if (!textValue.trim()) {
      setEditingText(false)
      setTextValue("")
      return
    }
    const ctx = canvasRef.current.getContext("2d")
    const drawData = {
      tool: "text",
      startX: textPosition.x,
      startY: textPosition.y,
      text: textValue.trim(),
      color,
      size,
      strokeId: strokeIdRef.current,
    }
    drawOnCanvas(ctx, drawData)
    socket.emit("draw", { roomId, ...drawData })
    setEditingText(false)
    setTextValue("")
  }, [textValue, textPosition, color, size, socket, roomId, drawOnCanvas])

  const cancelText = useCallback(() => {
    textEditingRef.current = false
    setEditingText(false)
    setTextValue("")
  }, [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    ctx.save()
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    socket.emit("clear-canvas", roomId)
  }

  const undo = () => {
    socket.emit("undo-stroke", roomId)
  }

  const redo = () => {
    socket.emit("redo-stroke", roomId)
  }

  return {
    isDrawing,
    color,
    size,
    tool,
    editingText,
    textPosition,
    textValue,
    setTextValue,
    startDrawing,
    draw,
    stopDrawing,
    setColor,
    setSize,
    setTool,
    clearCanvas,
    undo,
    redo,
    commitText,
    cancelText,
  }
}
