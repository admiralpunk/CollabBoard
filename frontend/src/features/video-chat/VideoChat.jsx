import { forwardRef, useImperativeHandle } from "react"
import VideoGrid from "./VideoGrid"
import Controls from "./Controls"
import { usePeerConnection, useSocketId, useMediaStream } from "./hooks"
import { ConnectionStatus, ErrorMessage } from "./components"
import LoadingSpinner from "../../shared/components/LoadingSpinner"

const VideoChat = forwardRef(({ socket, roomId, userId, username, usernameMap = {}, onLeaveRoom }, ref) => {
  const {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    loading,
    toggleAudio,
    toggleVideo,
    stopStream,
  } = useMediaStream()

  const myId = useSocketId(socket)
  const { streams, peerCount } = usePeerConnection(socket, roomId, stream, myId)

  useImperativeHandle(ref, () => ({
    stopStream
  }), [stopStream])

  return (
    <div>
      <ErrorMessage
        message={error}
        onRetry={loading ? undefined : () => window.location.reload()}
      />
      {loading ? (
        <LoadingSpinner size={32} label="Initializing camera and microphone..." />
      ) : (
        <>
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
            onLeave={onLeaveRoom}
          />
        </>
      )}
    </div>
  )
})

export default VideoChat
