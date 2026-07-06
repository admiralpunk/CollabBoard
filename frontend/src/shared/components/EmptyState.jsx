import styled from "styled-components"

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.$compact ? "20px" : "40px"};
  color: var(--color-text-muted);
  text-align: center;
  gap: 8px;
`

const Icon = styled.div`
  font-size: 2em;
  opacity: 0.5;
`

const EmptyState = ({ icon, message, compact }) => (
  <Wrapper $compact={compact}>
    {icon && <Icon>{icon}</Icon>}
    <span>{message}</span>
  </Wrapper>
)

export default EmptyState
