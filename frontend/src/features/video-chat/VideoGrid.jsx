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
    console.log("VideoGrid: Updating streams", streams);
    console.log("VideoGrid: Stream keys", Object.keys(streams));
    console.log("VideoGrid: Stream count", Object.keys(streams).length);
    console.log("VideoGrid: All streams details", Object.entries(streams).map(([id, stream]) => ({
      id,
      hasStream: !!stream,
      streamId: stream?.id,
      trackCount: stream?.getTracks().length
    })));
    
    Object.entries(streams).forEach(([peerId, stream]) => {
      console.log(`VideoGrid: Processing stream for ${peerId}:`, stream);
      if (videoRefs.current[peerId] && stream) {
        console.log("Setting stream for peer:", peerId);
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
                console.error("Error playing video for peer:", peerId, e);
              }
            });
          }
        }
      } else if (!videoRefs.current[peerId]) {
        console.log(`VideoGrid: No video ref for ${peerId}`);
      } else if (!stream) {
        console.log(`VideoGrid: No stream for ${peerId}`);
      }
    });
  }, [streams]);

  console.log("VideoGrid: Rendering", Object.keys(streams).length, "video containers");
  
  return (
    <Grid>
      {Object.entries(streams).map(([peerId, stream]) => {
        console.log(`VideoGrid: Rendering video for ${peerId}, has stream: ${!!stream}`);
        return (
          <VideoContainer key={peerId}>
            <Video
              ref={el => {
                videoRefs.current[peerId] = el;
                console.log(`VideoGrid: Video ref set for ${peerId}:`, !!el);
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