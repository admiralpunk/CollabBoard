import styled from "styled-components";

const StatusContainer = styled.div`
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
`;

const ConnectionStatus = ({ peerCount, streamCount }) => {
  return (
    <StatusContainer>
      Connected peers: {peerCount} | Streams: {streamCount}
    </StatusContainer>
  );
};

export default ConnectionStatus; 