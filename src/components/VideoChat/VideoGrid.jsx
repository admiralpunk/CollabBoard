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

const VideoGrid = ({ streams }) => {
  const videoRefs = useRef({});

  useEffect(() => {
    Object.entries(streams).forEach(([peerId, stream]) => {
      if (videoRefs.current[peerId] && stream) {
        videoRefs.current[peerId].srcObject = stream;
      }
    });
  }, [streams]);

  return (
    <Grid>
      {Object.entries(streams).map(([peerId, stream]) => (
        <VideoContainer key={peerId}>
          <Video
            ref={el => videoRefs.current[peerId] = el}
            autoPlay
            playsInline
            muted={peerId === 'local'}
          />
        </VideoContainer>
      ))}
    </Grid>
  );
};

export default VideoGrid;