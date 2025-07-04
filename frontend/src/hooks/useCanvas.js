import { useState, useEffect, useRef } from "react";

export const useCanvas = (canvasRef, socket, roomId, userId, username) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState("pen");
  const lastPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 600;

    context.lineCap = "round";
    context.lineJoin = "round";

    socket.on("draw", (data) => {
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.beginPath();
      ctx.moveTo(data.x0, data.y0);
      ctx.lineTo(data.x1, data.y1);
      ctx.stroke();
    });

    socket.on("clear-canvas", () => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("draw");
      socket.off("clear-canvas");
    };
  }, [socket]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    lastPosition.current = { x, y };
    const context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = tool === "pen" ? color : "#FFFFFF";
    context.lineWidth = size;
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const context = canvas.getContext("2d");
    context.lineTo(x, y);
    context.stroke();

    socket.emit("draw", {
      roomId,
      x0: lastPosition.current.x,
      y0: lastPosition.current.y,
      x1: x,
      y1: y,
      color: tool === "pen" ? color : "#FFFFFF",
      size,
    });

    lastPosition.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-canvas", roomId);
  };

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
  };
};
