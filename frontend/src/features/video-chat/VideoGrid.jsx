import { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin: 20px;
`;

const VideoContainer = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VideoGrid = ({ streams, username, usernameMap }) => {
  const videoRefs = useRef({});

  useEffect(() => {
    Object.entries(streams).forEach(([peerId, stream]) => {
      if (videoRefs.current[peerId] && stream) {
        const videoElement = videoRefs.current[peerId];
        
        // Only set srcObject if it's different
        if (videoElement.srcObject !== stream) {
          videoElement.srcObject = stream;
          
          // Play the video with better error handling
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              // Only log errors that aren't about interrupted play requests
              if (e.name !== 'AbortError') {
              }
            });
          }
        }
      } else if (!videoRefs.current[peerId]) {
      } else if (!stream) {
      }
    });
  }, [streams]);

  return (
    <Grid>
      {Object.entries(streams).map(([peerId, stream]) => {
        return (
          <VideoContainer key={peerId}>
            <Video
              ref={el => {
                videoRefs.current[peerId] = el;
              }}
              autoPlay
              playsInline
              muted={peerId === 'local'}
            />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {peerId === 'local' ? 'You' : (usernameMap && usernameMap[peerId] ? usernameMap[peerId] : `Peer ${peerId.slice(0, 6)}`)}
            </div>
          </VideoContainer>
        );
      })}
      {Object.keys(streams).length === 0 && (
        <div style={{ 
          gridColumn: '1 / -1', 
          textAlign: 'center', 
          padding: '40px',
          color: '#666'
        }}>
          No video streams available
        </div>
      )}
    </Grid>
  );
};

export default VideoGrid;