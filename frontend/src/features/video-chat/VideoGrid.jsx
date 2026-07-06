import { useEffect, useRef, memo } from 'react'
import styled from 'styled-components'
import EmptyState from '../../shared/components/EmptyState'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin: 20px;

  @media (max-width: 768px) {
    margin: 12px;
    gap: 8px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    margin: 8px;
    gap: 6px;
  }
`

const VideoContainer = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  background: var(--color-bg-dark);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
`

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const UsernameBadge = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--body-sm);
`

const VideoGrid = ({ streams, username, usernameMap }) => {
  const videoRefs = useRef({})

  useEffect(() => {
    Object.entries(streams).forEach(([peerId, stream]) => {
      if (videoRefs.current[peerId] && stream) {
        const videoElement = videoRefs.current[peerId]

        if (videoElement.srcObject !== stream) {
          videoElement.srcObject = stream

          const playPromise = videoElement.play()
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              if (e.name !== 'AbortError') {
              }
            })
          }
        }
      }
    })
  }, [streams])

  return (
    <Grid role="region" aria-label="Video chat grid">
      {Object.entries(streams).map(([peerId, stream]) => {
        const displayName = peerId === 'local'
          ? 'You'
          : (usernameMap && usernameMap[peerId] ? usernameMap[peerId] : `Peer ${peerId.slice(0, 6)}`)
        return (
          <VideoContainer key={peerId}>
            <Video
              ref={el => {
                videoRefs.current[peerId] = el
              }}
              autoPlay
              playsInline
              muted={peerId === 'local'}
              aria-label={`Video from ${displayName}`}
            />
            <UsernameBadge aria-label={`User: ${displayName}`}>
              {displayName}
            </UsernameBadge>
          </VideoContainer>
        )
      })}
      {Object.keys(streams).length === 0 && (
        <EmptyState icon="video" message="No video streams available. Your video will appear here once someone joins" />
      )}
    </Grid>
  )
}

export default memo(VideoGrid)
