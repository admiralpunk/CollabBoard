import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

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

const Canvas = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Set default styles
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    socket.on('draw', (data) => {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.beginPath();
      ctx.moveTo(data.x0, data.y0);
      ctx.lineTo(data.x1, data.y1);
      ctx.stroke();
    });

    socket.on('clear-canvas', () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off('draw');
      socket.off('clear-canvas');
    };
  }, [socket]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = tool === 'pen' ? color : '#FFFFFF';
    context.lineWidth = size;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const context = canvas.getContext('2d');
    context.lineTo(x, y);
    context.stroke();

    socket.emit('draw', {
      roomId,
      x0: context.moveTo.x,
      y0: context.moveTo.y,
      x1: x,
      y1: y,
      color: tool === 'pen' ? color : '#FFFFFF',
      size
    });

    context.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear-canvas', roomId);
  };

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
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </CanvasContainer>
  );
};

export default Canvas;