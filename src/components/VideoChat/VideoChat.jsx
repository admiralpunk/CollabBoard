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

  useEffect(() => {
    if (!stream) return;

    setStreams((prev) => ({ ...prev, local: stream }));

    const handleUserJoined = ({ userId }) => {
      const peer = new Peer({
        initiator: true,
        stream,
        trickle: false,
      });

      peer.on("signal", (signal) => {
        socket.emit("signal", { userId, signal });
      });

      peer.on("stream", (remoteStream) => {
        setStreams((prev) => ({ ...prev, [userId]: remoteStream }));
      });

      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
      });

      setPeers((prev) => ({ ...prev, [userId]: peer }));
    };

    const handleSignal = ({ userId, signal }) => {
      if (peers[userId]) {
        try {
          if (peers[userId].signalingState !== "stable") {
            peers[userId].signal(signal);
          } else {
            console.warn(
              `Signal ignored for peer ${userId} in 'stable' state.`
            );
          }
        } catch (error) {
          console.error(`Failed to process signal for peer ${userId}:`, error);
        }
      } else {
        const peer = new Peer({
          initiator: false,
          stream,
          trickle: false,
        });

        peer.on("signal", (signal) => {
          socket.emit("signal", { userId, signal });
        });

        peer.on("stream", (remoteStream) => {
          setStreams((prev) => ({ ...prev, [userId]: remoteStream }));
        });

        peer.on("error", (err) => {
          console.error("Peer connection error:", err);
        });

        try {
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
