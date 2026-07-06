import styled, { keyframes } from "styled-components"

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const Spinner = styled.div`
  width: ${props => props.$size || 24}px;
  height: ${props => props.$size || 24}px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--color-primary-hover);
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  color: var(--color-text-secondary);
`

const LoadingSpinner = ({ size, label }) => (
  <Wrapper>
    <Spinner $size={size} />
    {label && <span>{label}</span>}
  </Wrapper>
)

export default LoadingSpinner
