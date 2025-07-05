import styled from 'styled-components';

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
  background-color: #FFE082;
  color: #333;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  
  &:hover {
    background-color: #e7ae00;
  }
`;

const DrawingTools = ({ color, size, tool, onColorChange, onSizeChange, onToolChange, onClear }) => {
  return (
    <ToolBar>
      <ColorPicker
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        disabled={tool === 'eraser'}
      />
      <SizeInput
        type="range"
        min="1"
        max="50"
        value={size}
        onChange={(e) => onSizeChange(parseInt(e.target.value))}
      />
      <Button 
        onClick={() => onToolChange('pen')}
        style={{ backgroundColor: tool === 'pen' ? '#e7ae00' : '#FFE082' }}
      >
        Pen
      </Button>
      <Button 
        onClick={() => onToolChange('eraser')}
        style={{ backgroundColor: tool === 'eraser' ? '#e7ae00' : '#FFE082' }}
      >
        Eraser
      </Button>
      <Button onClick={onClear}>Clear Canvas</Button>
    </ToolBar>
  );
};

export default DrawingTools;