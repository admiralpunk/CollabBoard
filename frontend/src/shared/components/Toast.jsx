import styled, { keyframes } from "styled-components"
import Icon from "./Icon"

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
`

const ToastItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: ${props =>
    props.$variant === "error" ? "var(--color-error-bg)" :
    props.$variant === "success" ? "var(--color-success-bg)" :
    props.$variant === "warning" ? "var(--color-warning-bg)" :
    "var(--color-surface)"
  };
  color: ${props =>
    props.$variant === "error" ? "var(--color-error)" :
    props.$variant === "success" ? "var(--color-success)" :
    props.$variant === "warning" ? "var(--color-warning)" :
    "var(--color-text-primary)"
  };
  box-shadow: var(--shadow-lg);
  animation: ${slideIn} 0.3s ease;
  border: 1px solid ${props =>
    props.$variant === "error" ? "rgba(211, 47, 47, 0.2)" :
    props.$variant === "success" ? "rgba(46, 125, 50, 0.2)" :
    props.$variant === "warning" ? "rgba(133, 100, 4, 0.2)" :
    "rgba(0,0,0,0.1)"
  };
`

const DismissButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  line-height: 0;
  opacity: 0.6;
  padding: 4px;
  color: inherit;
  border-radius: var(--radius-sm);

  &:hover { opacity: 1; }
`

const Toast = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null

  return (
    <ToastContainer role="alert" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          $variant={toast.variant}
          role="alert"
        >
          <span>{toast.message}</span>
          <DismissButton
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <Icon name="x" size={16} />
          </DismissButton>
        </ToastItem>
      ))}
    </ToastContainer>
  )
}

export default Toast
