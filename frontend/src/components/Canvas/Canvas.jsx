import { useRef } from "react";
import styled from "styled-components";
import DrawingTools from "./DrawingTools";
import { useCanvas } from "../../hooks/useCanvas";

const CanvasContainer = styled.div`
  position: relative;
  margin: 20px;
`;

const StyledCanvas = styled.canvas`
  border: 2px solid #000;
  cursor: crosshair;
  background-color: white;
`;

const Canvas = ({ socket, roomId, userId, username }) => {
  const canvasRef = useRef(null);
  const {
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
  } = useCanvas(canvasRef, socket, roomId, userId, username);

  return (
    <CanvasContainer>
      <DrawingTools
        color={color}
        size={size}
        tool={tool}
        onColorChange={setColor}
        onSizeChange={setSize}
        onToolChange={setTool}
        onClear={clearCanvas}
      />
      <StyledCanvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </CanvasContainer>
  );
};

export default Canvas;
