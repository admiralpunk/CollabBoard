import styled from "styled-components"
import Icon from "./Icon"

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

const IconWrap = styled.div`
  opacity: 0.5;
  line-height: 0;
`

const EmptyState = ({ icon, message, compact }) => (
  <Wrapper $compact={compact}>
    {icon && <IconWrap><Icon name={icon} size={32} /></IconWrap>}
    <span>{message}</span>
  </Wrapper>
)

export default EmptyState
