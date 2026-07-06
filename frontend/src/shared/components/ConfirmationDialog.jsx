import { useEffect, useRef } from "react"
import styled from "styled-components"

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
`

const Dialog = styled.div`
  background: var(--color-surface);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 320px;
  max-width: 90vw;
  text-align: center;
  border: 2px solid var(--color-primary);
`

const Title = styled.h3`
  margin: 0 0 var(--space-sm);
  color: var(--color-warning);
`

const Message = styled.p`
  margin: 0 0 var(--space-lg);
  color: var(--color-text);
`

const Actions = styled.div`
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
`

const ConfirmButton = styled.button`
  padding: 10px 24px;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: bold;

  &:hover { background: var(--color-danger-hover); }
`

const CancelButton = styled.button`
  padding: 10px 24px;
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: bold;

  &:hover { background: var(--color-primary-hover); }
`

const ConfirmationDialog = ({ title, message, onConfirm, onCancel }) => {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const handleKey = (e) => { if (e.key === 'Escape') onCancel?.() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <Overlay
      role="dialog"
      aria-modal="true"
      aria-label={title || "Confirmation"}
      onClick={onCancel}
    >
      <Dialog onClick={e => e.stopPropagation()}>
        {title && <Title>{title}</Title>}
        {message && <Message>{message}</Message>}
        <Actions>
          <CancelButton onClick={onCancel}>Cancel</CancelButton>
          <ConfirmButton ref={confirmRef} onClick={onConfirm}>Confirm</ConfirmButton>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

export default ConfirmationDialog
