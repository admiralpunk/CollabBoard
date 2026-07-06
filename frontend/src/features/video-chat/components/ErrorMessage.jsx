import styled from "styled-components"

const ErrorContainer = styled.div`
  color: var(--color-error);
  background: var(--color-error-bg);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  role: alert;
`

const DismissButton = styled.button`
  background: none;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  white-space: nowrap;

  &:hover { background: rgba(211, 47, 47, 0.1); }
`

const ErrorMessage = ({ message, onRetry, onDismiss }) => {
  if (!message) return null

  return (
    <ErrorContainer role="alert">
      <span>{message}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {onRetry && (
          <DismissButton onClick={onRetry} aria-label="Retry">Retry</DismissButton>
        )}
        {onDismiss && (
          <DismissButton onClick={onDismiss} aria-label="Dismiss error">×</DismissButton>
        )}
      </div>
    </ErrorContainer>
  )
}

export default ErrorMessage
