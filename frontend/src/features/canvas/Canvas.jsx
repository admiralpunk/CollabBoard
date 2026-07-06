import { useRef, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { useCanvas } from './hooks'
import ConfirmationDialog from '../../shared/components/ConfirmationDialog'
import Icon from '../../shared/components/Icon'

const CanvasContainer = styled.div`
  margin: 20px;
`

const CanvasWrapper = styled.div`
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
`

const StyledCanvas = styled.canvas`
  cursor: crosshair;
  background-color: white;
  touch-action: none;
  max-width: 100%;
  display: block;
`

const TextOverlay = styled.textarea`
  position: absolute;
  padding: 2px;
  margin: 0;
  border: 1px dashed var(--color-gray-500);
  outline: none;
  background: transparent;
  resize: none;
  overflow: hidden;
  white-space: pre;
  font-family: sans-serif;
  min-width: 30px;
  min-height: 20px;
  z-index: 10;
  line-height: var(--leading-tight);
`

const ToolBar = styled.div`
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
`

const ToolGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: var(--color-border);
  margin: 0 4px;
`

const ColorPicker = styled.input`
  width: 50px;
  height: 30px;
  cursor: pointer;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px;
`

const SizeInput = styled.input`
  width: 100px;
  cursor: pointer;
`

const Button = styled.button`
  padding: 8px 14px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color 0.2s, transform 0.15s, box-shadow 0.2s;
  font-weight: var(--weight-medium);
  font-size: var(--body-sm);
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background-color: var(--color-primary-hover);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-hover);
    outline-offset: 2px;
  }
`

const ClearButton = styled(Button)`
  background-color: var(--color-danger);
  color: white;

  &:hover { background-color: var(--color-danger-hover); }
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
        <ToolGroup>
          <Button onClick={() => setTool('pen')} $active={isActive('pen')} style={{ backgroundColor: isActive('pen') ? 'var(--color-primary-hover)' : '' }} aria-label="Pen tool" aria-pressed={isActive('pen')} title="Pen">
            <Icon name="pen" size={14} />
            Pen
          </Button>
          <Button onClick={() => setTool('eraser')} $active={isActive('eraser')} style={{ backgroundColor: isActive('eraser') ? 'var(--color-primary-hover)' : '' }} aria-label="Eraser tool" aria-pressed={isActive('eraser')} title="Eraser">
            <Icon name="eraser" size={14} />
            Eraser
          </Button>
        </ToolGroup>
        <Divider />
        <ToolGroup>
          <Button onClick={() => setTool('rectangle')} $active={isActive('rectangle')} style={{ backgroundColor: isActive('rectangle') ? 'var(--color-primary-hover)' : '' }} aria-label="Rectangle tool" aria-pressed={isActive('rectangle')} title="Rectangle">
            <Icon name="rectangle" size={14} />
            Rect
          </Button>
          <Button onClick={() => setTool('circle')} $active={isActive('circle')} style={{ backgroundColor: isActive('circle') ? 'var(--color-primary-hover)' : '' }} aria-label="Circle tool" aria-pressed={isActive('circle')} title="Circle">
            <Icon name="circle" size={14} />
            Circle
          </Button>
          <Button onClick={() => setTool('line')} $active={isActive('line')} style={{ backgroundColor: isActive('line') ? 'var(--color-primary-hover)' : '' }} aria-label="Line tool" aria-pressed={isActive('line')} title="Line">
            <Icon name="line" size={14} />
            Line
          </Button>
          <Button onClick={() => setTool('text')} $active={isActive('text')} style={{ backgroundColor: isActive('text') ? 'var(--color-primary-hover)' : '' }} aria-label="Text tool" aria-pressed={isActive('text')} title="Text">
            <Icon name="text" size={14} />
            Text
          </Button>
        </ToolGroup>
        <Divider />
        <ToolGroup>
          <Button onClick={undo} aria-label="Undo" title="Undo">
            <Icon name="undo" size={14} />
            Undo
          </Button>
          <Button onClick={redo} aria-label="Redo" title="Redo">
            <Icon name="redo" size={14} />
            Redo
          </Button>
        </ToolGroup>
        <Divider />
        <ClearButton onClick={handleClearClick} aria-label="Clear canvas" title="Clear Canvas">
          <Icon name="trash" size={14} />
          Clear
        </ClearButton>
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
