import { useState, useEffect } from "react";
import Peer from "simple-peer";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";
import { useMediaStream } from "../../hooks/useMediaStream";
import styled from "styled-components";

const ErrorMessage = styled.div`
  color: #d32f2f;
  background: #ffebee;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
`;

const VideoChat = ({ socket, roomId }) => {
  const [peers, setPeers] = useState({});
  const [streams, setStreams] = useState({});
  const {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    toggleAudio,
    toggleVideo,
  } = useMediaStream();

const iceServers = [
  { urls: import.meta.env.VITE_STUN_SERVER },
  {
    urls: import.meta.env.VITE_TURN_SERVER,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  },
];


  useEffect(() => {
    if (!stream) return;

    setStreams((prev) => ({ ...prev, local: stream }));

    const handleUserJoined = ({ userId }) => {
      if (!socket || !stream) return;

      try {
        const peer = new Peer({
          initiator: true,
          stream,
          trickle: false,
          config: { iceServers },
        });

        peer.on("signal", (signal) => {
          socket.emit("signal", { userId, signal });
        });

        peer.on("stream", (remoteStream) => {
          setStreams((prev) => ({ ...prev, [userId]: remoteStream }));
        });

        peer.on("error", (err) => console.error("Peer error:", err));
        peer.on("connect", () => console.log("Peer connected:", userId));
        peer.on("close", () => console.log("Peer connection closed:", userId));

        setPeers((prev) => ({ ...prev, [userId]: peer }));
      } catch (error) {
        console.error("Error creating peer:", error);
      }
    };

    const handleSignal = ({ userId, signal }) => {
      if (!socket) return;

      if (peers[userId]) {
        try {
          peers[userId].signal(signal);
        } catch (error) {
          console.error(`Failed to process signal for peer ${userId}:`, error);
        }
      } else {
        try {
          const peer = new Peer({
            initiator: false,
            stream,
            trickle: false,
            config: { iceServers },
          });

          peer.on("signal", (signal) => {
            socket.emit("signal", { userId, signal });
          });

          peer.on("stream", (remoteStream) => {
            setStreams((prev) => ({ ...prev, [userId]: remoteStream }));
          });

          peer.on("error", (err) => console.error("Peer error:", err));
          peer.on("connect", () => console.log("Peer connected:", userId));
          peer.on("close", () =>
            console.log("Peer connection closed:", userId)
          );

          peer.signal(signal);
          setPeers((prev) => ({ ...prev, [userId]: peer }));
        } catch (error) {
          console.error(`Failed to signal for new peer ${userId}:`, error);
        }
      }
    };

    const handleUserLeft = ({ userId }) => {
      if (peers[userId]) {
        peers[userId].destroy();
        setPeers((prev) => {
          const newPeers = { ...prev };
          delete newPeers[userId];
          return newPeers;
        });
        setStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[userId];
          return newStreams;
        });
      }
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("signal", handleSignal);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("signal", handleSignal);
      socket.off("user-left", handleUserLeft);
      Object.values(peers).forEach((peer) => peer.destroy());
    };
  }, [socket, stream, peers]);

  useEffect(() => {
    if (roomId && socket) {
      socket.emit("join-room", roomId);
    }
  }, [roomId, socket]);

  return (
    <div>
      {error && (
        <ErrorMessage>Failed to access camera/microphone: {error}</ErrorMessage>
      )}
      <VideoGrid streams={streams} />
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
