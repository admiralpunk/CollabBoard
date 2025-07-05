import { useRef, useState } from 'react';
import styled from 'styled-components';
import { useCanvas } from './hooks';

const CanvasContainer = styled.div`
  position: relative;
  margin: 20px;
`;

const StyledCanvas = styled.canvas`
  border: 2px solid #000;
  cursor: crosshair;
`;

const ToolBar = styled.div`
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ColorPicker = styled.input`
  width: 50px;
  height: 30px;
`;

const SizeInput = styled.input`
  width: 100px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #45a049;
  }
`;

const Canvas = ({ socket, roomId, userId, username }) => {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'

  const {
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas
  } = useCanvas(canvasRef, socket, roomId, userId, username);

  return (
    <CanvasContainer>
      <ToolBar>
        <ColorPicker
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={tool === 'eraser'}
        />
        <SizeInput
          type="range"
          min="1"
          max="50"
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
        />
        <Button onClick={() => setTool('pen')} style={{ backgroundColor: tool === 'pen' ? '#45a049' : '#4CAF50' }}>
          Pen
        </Button>
        <Button onClick={() => setTool('eraser')} style={{ backgroundColor: tool === 'eraser' ? '#45a049' : '#4CAF50' }}>
          Eraser
        </Button>
        <Button onClick={clearCanvas}>Clear Canvas</Button>
      </ToolBar>
      <StyledCanvas
        ref={canvasRef}
        onMouseDown={(e) => startDrawing(e, tool, color, size)}
        onMouseMove={(e) => draw(e, tool, color, size)}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </CanvasContainer>
  );
};

export default Canvas;