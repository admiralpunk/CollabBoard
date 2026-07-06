import { useRef, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { useCanvas } from './hooks'
import ConfirmationDialog from '../../shared/components/ConfirmationDialog'

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
  max-width: 100%;
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
  transition: background-color 0.2s, transform 0.15s;

  &:hover {
    background-color: #e7ae00;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &:focus-visible {
    outline: 2px solid #e7ae00;
    outline-offset: 2px;
  }
`

const ClearButton = styled(Button)`
  background-color: #e74c3c;
  color: white;

  &:hover { background-color: #c0392b; }
`

const Canvas = ({ socket, roomId }) => {
  const canvasRef = useRef(null)
  const textInputRef = useRef(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

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

  const handleClearClick = () => {
    setShowClearConfirm(true)
  }

  const confirmClear = () => {
    clearCanvas()
    setShowClearConfirm(false)
  }

  const isActive = (t) => tool === t

  return (
    <CanvasContainer>
      {showClearConfirm && (
        <ConfirmationDialog
          title="Clear Canvas"
          message="Are you sure you want to clear the entire canvas? This cannot be undone."
          onConfirm={confirmClear}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
      <ToolBar>
        <ColorPicker
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={tool === 'eraser'}
          aria-label="Drawing color"
        />
        <SizeInput
          type="range"
          min="1"
          max="50"
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
          aria-label="Brush size"
        />
        <Button onClick={() => setTool('pen')} style={{ backgroundColor: isActive('pen') ? '#e7ae00' : '#FFE082' }} aria-label="Pen tool" aria-pressed={isActive('pen')}>
          Pen
        </Button>
        <Button onClick={() => setTool('eraser')} style={{ backgroundColor: isActive('eraser') ? '#e7ae00' : '#FFE082' }} aria-label="Eraser tool" aria-pressed={isActive('eraser')}>
          Eraser
        </Button>
        <Button onClick={() => setTool('rectangle')} style={{ backgroundColor: isActive('rectangle') ? '#e7ae00' : '#FFE082' }} aria-label="Rectangle tool" aria-pressed={isActive('rectangle')}>
          Rectangle
        </Button>
        <Button onClick={() => setTool('circle')} style={{ backgroundColor: isActive('circle') ? '#e7ae00' : '#FFE082' }} aria-label="Circle tool" aria-pressed={isActive('circle')}>
          Circle
        </Button>
        <Button onClick={() => setTool('line')} style={{ backgroundColor: isActive('line') ? '#e7ae00' : '#FFE082' }} aria-label="Line tool" aria-pressed={isActive('line')}>
          Line
        </Button>
        <Button onClick={() => setTool('text')} style={{ backgroundColor: isActive('text') ? '#e7ae00' : '#FFE082' }} aria-label="Text tool" aria-pressed={isActive('text')}>
          Text
        </Button>
        <Button onClick={undo} aria-label="Undo">↩ Undo</Button>
        <Button onClick={redo} aria-label="Redo">↪ Redo</Button>
        <ClearButton onClick={handleClearClick} aria-label="Clear canvas">Clear Canvas</ClearButton>
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
