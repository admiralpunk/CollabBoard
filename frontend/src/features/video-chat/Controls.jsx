import styled from 'styled-components'
import ConfirmationDialog from '../../shared/components/ConfirmationDialog'
import { useState } from 'react'
import Icon from '../../shared/components/Icon'

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
  background: ${props => props.$active ? 'var(--color-primary)' : 'rgba(255, 224, 130, 0.4)'};
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s, transform 0.15s;
  font-weight: var(--weight-medium);

  &:hover {
    background: ${props => props.$active ? 'var(--color-primary-hover)' : 'rgba(255, 224, 130, 0.6)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
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
  gap: 6px;
  font-weight: var(--weight-bold);
  transition: background 0.2s, transform 0.15s;

  &:hover { background: var(--color-danger-hover); transform: translateY(-1px); }

  &:active { transform: scale(0.97); }

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
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          <Icon name={isAudioEnabled ? 'mic' : 'mic-off'} size={16} />
          {isAudioEnabled ? 'Mute' : 'Unmute'}
        </ControlButton>
        <ControlButton
          onClick={onToggleVideo}
          $active={isVideoEnabled}
          aria-label={isVideoEnabled ? 'Stop video' : 'Start video'}
          aria-pressed={isVideoEnabled}
          title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
        >
          <Icon name={isVideoEnabled ? 'camera' : 'camera-off'} size={16} />
          {isVideoEnabled ? 'Stop Video' : 'Start Video'}
        </ControlButton>
        <LeaveButton onClick={handleLeave} aria-label="Leave room" title="Leave Room">
          <Icon name="phone-off" size={16} />
          Leave
        </LeaveButton>
      </ControlBar>
    </>
  )
}

export default Controls
