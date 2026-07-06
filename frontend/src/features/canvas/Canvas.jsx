import { useRef, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { useCanvas } from './hooks'

const CanvasContainer = styled.div`
  margin: 20px;
`

const CanvasWrapper = styled.div`
  position: relative;
`

const StyledCanvas = styled.canvas`
  border: 2px solid #000;
  cursor: crosshair;
  background-color: white;
  touch-action: none;
`

const TextOverlay = styled.textarea`
  position: absolute;
  padding: 2px;
  margin: 0;
  border: 1px dashed #999;
  outline: none;
  background: transparent;
  resize: none;
  overflow: hidden;
  white-space: pre;
  font-family: sans-serif;
  min-width: 30px;
  min-height: 20px;
  z-index: 10;
  line-height: 1.2;
`

const ToolBar = styled.div`
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`

const ColorPicker = styled.input`
  width: 50px;
  height: 30px;
`

const SizeInput = styled.input`
  width: 100px;
`

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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Canvas = ({ socket, roomId }) => {
  const canvasRef = useRef(null)
  const textInputRef = useRef(null)

  const {
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
  } = useCanvas(canvasRef, socket, roomId)

  useEffect(() => {
    if (editingText && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [editingText])

  const handleTextKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commitText()
    }
    if (e.key === 'Escape') {
      cancelText()
    }
  }, [commitText, cancelText])

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
        <Button onClick={() => setTool('pen')} style={{ backgroundColor: tool === 'pen' ? '#e7ae00' : '#FFE082' }}>
          Pen
        </Button>
        <Button onClick={() => setTool('eraser')} style={{ backgroundColor: tool === 'eraser' ? '#e7ae00' : '#FFE082' }}>
          Eraser
        </Button>
        <Button onClick={() => setTool('rectangle')} style={{ backgroundColor: tool === 'rectangle' ? '#e7ae00' : '#FFE082' }}>
          Rectangle
        </Button>
        <Button onClick={() => setTool('circle')} style={{ backgroundColor: tool === 'circle' ? '#e7ae00' : '#FFE082' }}>
          Circle
        </Button>
        <Button onClick={() => setTool('line')} style={{ backgroundColor: tool === 'line' ? '#e7ae00' : '#FFE082' }}>
          Line
        </Button>
        <Button onClick={() => setTool('text')} style={{ backgroundColor: tool === 'text' ? '#e7ae00' : '#FFE082' }}>
          Text
        </Button>
        <Button onClick={undo}>↩ Undo</Button>
        <Button onClick={redo}>↪ Redo</Button>
        <Button onClick={clearCanvas}>Clear Canvas</Button>
      </ToolBar>
      <CanvasWrapper>
        <StyledCanvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
        {editingText && (
          <TextOverlay
            ref={textInputRef}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleTextKeyDown}
            onBlur={commitText}
            autoFocus
            style={{
              left: textPosition.x,
              top: textPosition.y,
              color,
              fontSize: `${Math.max(12, size * 4)}px`,
              caretColor: color,
            }}
          />
        )}
      </CanvasWrapper>
    </CanvasContainer>
  )
}

export default Canvas
