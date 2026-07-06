import styled from 'styled-components'
import ConfirmationDialog from '../../shared/components/ConfirmationDialog'
import { useState } from 'react'

const ControlBar = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  margin: 10px 20px;
  flex-wrap: wrap;
`

const ControlButton = styled.button`
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: none;
  background: ${props => props.$active ? '#FFE082' : 'rgba(255, 224, 130, 0.4)'};
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.$active ? '#e7ae00' : 'rgba(255, 224, 130, 0.6)'};
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-hover);
    outline-offset: 2px;
  }
`

const LeaveButton = styled.button`
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--color-danger);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: bold;
  transition: background 0.2s;

  &:hover { background: var(--color-danger-hover); }

  &:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
`

const Controls = ({ isAudioEnabled, isVideoEnabled, onToggleAudio, onToggleVideo, onLeave }) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const handleLeave = () => {
    setShowLeaveConfirm(true)
  }

  return (
    <>
      {showLeaveConfirm && (
        <ConfirmationDialog
          title="Leave Room"
          message="Are you sure you want to leave this room?"
          onConfirm={() => { setShowLeaveConfirm(false); onLeave?.() }}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
      <ControlBar>
        <ControlButton
          onClick={onToggleAudio}
          $active={isAudioEnabled}
          aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          aria-pressed={isAudioEnabled}
        >
          {isAudioEnabled ? '🎤 Mute' : '🔇 Unmute'}
        </ControlButton>
        <ControlButton
          onClick={onToggleVideo}
          $active={isVideoEnabled}
          aria-label={isVideoEnabled ? 'Stop video' : 'Start video'}
          aria-pressed={isVideoEnabled}
        >
          {isVideoEnabled ? '📹 Stop Video' : '🎥 Start Video'}
        </ControlButton>
        <LeaveButton onClick={handleLeave} aria-label="Leave room">
          📞 Leave
        </LeaveButton>
      </ControlBar>
    </>
  )
}

export default Controls
