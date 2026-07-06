import styled from "styled-components"

const StatusContainer = styled.div`
  margin-bottom: 10px;
  font-size: var(--body-sm);
  color: var(--color-text-secondary);
  padding: 10px;
  background: var(--color-surface-alt);
  border-radius: var(--radius-sm);
`

const ConnectionStatus = ({ peerCount, streamCount }) => {
  return (
    <StatusContainer role="status" aria-label="Connection status">
      <strong>Connected peers:</strong> {peerCount} | <strong>Streams:</strong> {streamCount}
    </StatusContainer>
  )
}

export default ConnectionStatus
