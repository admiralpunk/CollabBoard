import styled from 'styled-components';

const ControlBar = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin: 10px 20px;
`;

const ControlButton = styled.button`
  padding: 8px 16px;
  border-radius: 16px;
  border: none;
  background: ${props => props.$active ? '#FFB74D' : '#FFE082'};
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover {
    background: ${props => props.$active ? '#FFB74D' : '#e7ae00'};
  }
`;

const Controls = ({ isAudioEnabled, isVideoEnabled, onToggleAudio, onToggleVideo }) => {
  return (
    <ControlBar>
      <ControlButton
        onClick={onToggleAudio}
        $active={!isAudioEnabled}
      >
        {isAudioEnabled ? '🎤 Mute' : '🔇 Unmute'}
      </ControlButton>
      <ControlButton
        onClick={onToggleVideo}
        $active={!isVideoEnabled}
      >
        {isVideoEnabled ? '📹 Stop Video' : '🎥 Start Video'}
      </ControlButton>
    </ControlBar>
  );
};

export default Controls;