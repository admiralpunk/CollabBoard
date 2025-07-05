import VideoGrid from "./VideoGrid";
import Controls from "./Controls";
import { usePeerConnection, useSocketId, useMediaStream } from "./hooks";
import { ConnectionStatus, ErrorMessage } from "./components";

const VideoChat = ({ socket, roomId, userId, username, usernameMap = {} }) => {
  const {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    toggleAudio,
    toggleVideo,
  } = useMediaStream();
  
  const myId = useSocketId(socket);
  const { streams, peerCount } = usePeerConnection(socket, roomId, stream, myId);

  console.log("Current streams:", streams);

  return (
    <div>
      <ErrorMessage message={error} />
      <ConnectionStatus 
        peerCount={peerCount} 
        streamCount={Object.keys(streams).length} 
      />
      <VideoGrid streams={streams} username={username} usernameMap={usernameMap} />
      <Controls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
      />
    </div>
  );
};

export default VideoChat;
