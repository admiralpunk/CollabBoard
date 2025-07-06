import { forwardRef, useImperativeHandle } from "react";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";
import { usePeerConnection, useSocketId, useMediaStream } from "./hooks";
import { ConnectionStatus, ErrorMessage } from "./components";

const VideoChat = forwardRef(({ socket, roomId, userId, username, usernameMap = {}, onLeaveRoom }, ref) => {
  const {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    toggleAudio,
    toggleVideo,
    stopStream,
  } = useMediaStream();
  
  const myId = useSocketId(socket);
  const { streams, peerCount, connectionStatus } = usePeerConnection(socket, roomId, stream, myId);

  // Expose stopStream method to parent component via ref
  useImperativeHandle(ref, () => ({
    stopStream
  }), [stopStream]);

  console.log("VideoChat Debug Info:", {
    myId,
    roomId,
    peerCount,
    streamCount: Object.keys(streams).length,
    streams: Object.keys(streams),
    connectionStatus,
    hasLocalStream: !!stream,
    localStreamId: stream?.id,
    allStreams: streams
  });

  return (
    <div>
      <ErrorMessage message={error} />
      <ConnectionStatus 
        peerCount={peerCount} 
        streamCount={Object.keys(streams).length} 
        connectionStatus={connectionStatus}
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
});

export default VideoChat;
