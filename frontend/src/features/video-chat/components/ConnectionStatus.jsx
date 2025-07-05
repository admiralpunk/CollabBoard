import styled from "styled-components";

const StatusContainer = styled.div`
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
`;

const PeerStatus = styled.div`
  margin: 2px 0;
  font-size: 11px;
`;

const ConnectionStatus = ({ peerCount, streamCount, connectionStatus = {} }) => {
  return (
    <StatusContainer>
      <div><strong>Connected peers:</strong> {peerCount} | <strong>Streams:</strong> {streamCount}</div>
      {Object.keys(connectionStatus).length > 0 && (
        <div style={{ marginTop: '5px' }}>
          <strong>Peer Status:</strong>
          {Object.entries(connectionStatus).map(([peerId, status]) => (
            <PeerStatus key={peerId}>
              {peerId.slice(0, 6)}: {status}
            </PeerStatus>
          ))}
        </div>
      )}
    </StatusContainer>
  );
};

export default ConnectionStatus; 