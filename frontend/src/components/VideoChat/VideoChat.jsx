import { useState, useEffect, useRef } from "react";
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
  const [peerCount, setPeerCount] = useState(0);
  const peersRef = useRef({});
  const {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    toggleAudio,
    toggleVideo,
  } = useMediaStream();
  const [myId, setMyId] = useState(null);

  // Get my socket id
  useEffect(() => {
    if (!socket) return;
    setMyId(socket.id);
    socket.on("connect", () => setMyId(socket.id));
    return () => {
      socket.off("connect");
    };
  }, [socket]);

  useEffect(() => {
    if (!stream || !roomId || !socket || !myId) return;
    setStreams({ local: stream });

    // --- ICE candidate queue ---
    const iceCandidateQueue = {};

    // --- Helper functions ---
    const removePeer = (peerId) => {
      if (peersRef.current[peerId]) {
        peersRef.current[peerId].close();
        delete peersRef.current[peerId];
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[peerId];
          return newPeers;
        });
        setStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[peerId];
          return newStreams;
        });
        setPeerCount(Object.keys(peersRef.current).length);
        delete iceCandidateQueue[peerId];
      }
    };

    // --- Peer connection creation ---
    const createPeerConnection = (peerId, isInitiator) => {
      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ]
      });
      // Add local stream
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });
      // Handle incoming streams
      peer.ontrack = (event) => {
        console.log(`[ontrack] Received remote stream from: ${peerId}`, event.streams[0]);
        setStreams(prev => ({ ...prev, [peerId]: event.streams[0] }));
      };
      // ICE candidates
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[onicecandidate] Sending candidate to ${peerId}`, event.candidate);
          socket.emit("signal", {
            to: peerId,
            data: { type: "ice-candidate", candidate: event.candidate }
          });
        } else {
          console.log(`[onicecandidate] ICE gathering complete for ${peerId}`);
        }
      };
      // Connection state
      peer.oniceconnectionstatechange = () => {
        console.log(`[oniceconnectionstatechange] ${peerId}: ${peer.iceConnectionState}`);
        if (["disconnected", "failed", "closed"].includes(peer.iceConnectionState)) {
          removePeer(peerId);
        }
      };
      peer.onconnectionstatechange = () => {
        console.log(`[onconnectionstatechange] ${peerId}: ${peer.connectionState}`);
      };
      peer.onsignalingstatechange = () => {
        console.log(`[onsignalingstatechange] ${peerId}: ${peer.signalingState}`);
      };
      peer.onnegotiationneeded = async () => {
        console.log(`[onnegotiationneeded] ${peerId}`);
        if (isInitiator) {
          try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            console.log(`[offer] Sent offer to ${peerId}`, offer);
            socket.emit("signal", {
              to: peerId,
              data: { type: "offer", sdp: peer.localDescription }
            });
          } catch (err) {
            console.error("Error during negotiationneeded/offer:", err);
          }
        }
      };
      // --- ICE candidate queue for this peer ---
      iceCandidateQueue[peerId] = [];
      return peer;
    };

    // --- Socket event handlers ---
    const handlePeerJoined = (peerId) => {
      if (peerId === myId) return;
      if (peersRef.current[peerId]) return; // Already connected
      // Only the peer with the lower socket id initiates the connection
      const isInitiator = myId < peerId;
      console.log(`[peer-joined] ${peerId}, I am ${myId}, isInitiator: ${isInitiator}`);
      const peer = createPeerConnection(peerId, isInitiator);
      peersRef.current[peerId] = peer;
      setPeers(prev => ({ ...prev, [peerId]: peer }));
      setPeerCount(Object.keys(peersRef.current).length);
    };

    const handleSignal = async ({ id, data }) => {
      if (id === myId) return;
      let peer = peersRef.current[id];
      if (!peer) {
        // Only create peer if not already present
        const isInitiator = myId < id;
        peer = createPeerConnection(id, isInitiator);
        peersRef.current[id] = peer;
        setPeers(prev => ({ ...prev, [id]: peer }));
      }
      if (data.type === "offer") {
        console.log(`[signal] Received offer from ${id}`, data.sdp);
        await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        // Add any queued ICE candidates
        if (iceCandidateQueue[id] && iceCandidateQueue[id].length > 0) {
          for (const candidate of iceCandidateQueue[id]) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding queued ICE candidate:", err);
            }
          }
          iceCandidateQueue[id] = [];
        }
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        console.log(`[answer] Sent answer to ${id}`, answer);
        socket.emit("signal", {
          to: id,
          data: { type: "answer", sdp: peer.localDescription }
        });
      } else if (data.type === "answer") {
        console.log(`[signal] Received answer from ${id}`, data.sdp);
        await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        // Add any queued ICE candidates
        if (iceCandidateQueue[id] && iceCandidateQueue[id].length > 0) {
          for (const candidate of iceCandidateQueue[id]) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding queued ICE candidate:", err);
            }
          }
          iceCandidateQueue[id] = [];
        }
      } else if (data.type === "ice-candidate") {
        console.log(`[signal] Received ICE candidate from ${id}`, data.candidate);
        // If remoteDescription is not set, queue the candidate
        if (!peer.remoteDescription || peer.remoteDescription.type === "") {
          console.log(`[ice-candidate] Queuing candidate for ${id}`);
          iceCandidateQueue[id] = iceCandidateQueue[id] || [];
          iceCandidateQueue[id].push(data.candidate);
        } else {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        }
      }
      // Log signaling state after every signal
      console.log(`[signalingState] ${id}:`, peer.signalingState);
    };

    const handlePeerLeft = (peerId) => {
      console.log(`[peer-left] ${peerId}`);
      removePeer(peerId);
    };

    // --- Register socket events ---
    socket.on("peer-joined", handlePeerJoined);
    socket.on("signal", handleSignal);
    socket.on("peer-left", handlePeerLeft);
    socket.on("peers-in-room", (peersInRoom) => {
      console.log('[peers-in-room] Existing peers:', peersInRoom);
      peersInRoom.forEach((peerId) => {
        if (peerId !== myId && !peersRef.current[peerId]) {
          // Always treat as initiator for new peer
          const isInitiator = myId < peerId;
          console.log(`[peers-in-room] Connecting to existing peer ${peerId}, isInitiator: ${isInitiator}`);
          const peer = createPeerConnection(peerId, isInitiator);
          peersRef.current[peerId] = peer;
          setPeers(prev => ({ ...prev, [peerId]: peer }));
          setPeerCount(Object.keys(peersRef.current).length);
        }
      });
    });
    socket.emit("join", roomId);

    // --- Perfect Negotiation State ---
    const negotiationState = {};

    // --- Enhanced handleSignal for perfect negotiation ---
    async function handleSignalPerfectNegotiation({ id, data }) {
      if (id === myId) return;
      let peer = peersRef.current[id];
      if (!peer) {
        const isInitiator = myId < id;
        peer = createPeerConnection(id, isInitiator);
        peersRef.current[id] = peer;
        setPeers(prev => ({ ...prev, [id]: peer }));
      }
      // Polite if myId > id
      const polite = myId > id;
      negotiationState[id] = negotiationState[id] || { makingOffer: false, ignoreOffer: false, isSettingRemoteAnswerPending: false }; 
      const state = negotiationState[id];
      if (data.type === "offer") {
        const offerCollision = state.makingOffer || peer.signalingState !== "stable";
        state.ignoreOffer = !polite && offerCollision;
        if (state.ignoreOffer) {
          console.log(`[perfect-negotiation] Ignoring offer from ${id} due to collision`);
          return;
        }
        state.isSettingRemoteAnswerPending = true;
        await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        state.isSettingRemoteAnswerPending = false;
        // Add any queued ICE candidates
        if (iceCandidateQueue[id] && iceCandidateQueue[id].length > 0) {
          for (const candidate of iceCandidateQueue[id]) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding queued ICE candidate:", err);
            }
          }
          iceCandidateQueue[id] = [];
        }
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        console.log(`[answer] Sent answer to ${id}`, answer);
        socket.emit("signal", {
          to: id,
          data: { type: "answer", sdp: peer.localDescription }
        });
      } else if (data.type === "answer") {
        state.isSettingRemoteAnswerPending = true;
        await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        state.isSettingRemoteAnswerPending = false;
        // Add any queued ICE candidates
        if (iceCandidateQueue[id] && iceCandidateQueue[id].length > 0) {
          for (const candidate of iceCandidateQueue[id]) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding queued ICE candidate:", err);
            }
          }
          iceCandidateQueue[id] = [];
        }
      } else if (data.type === "ice-candidate") {
        if (state.isSettingRemoteAnswerPending || !peer.remoteDescription || peer.remoteDescription.type === "") {
          console.log(`[ice-candidate] Queuing candidate for ${id}`);
          iceCandidateQueue[id] = iceCandidateQueue[id] || [];
          iceCandidateQueue[id].push(data.candidate);
        } else {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        }
      }
      // Log signaling state after every signal
      console.log(`[signalingState] ${id}:`, peer.signalingState);
    }

    // --- Replace old signal handler with perfect negotiation ---
    socket.off("signal", handleSignal); // Remove old handler if present
    socket.on("signal", handleSignalPerfectNegotiation);

    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("signal", handleSignalPerfectNegotiation);
      socket.off("peer-left", handlePeerLeft);
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
    };
  }, [roomId, stream, socket, myId]);

  console.log("Current streams:", streams);

  return (
    <div>
      {error && (
        <ErrorMessage>Failed to access camera/microphone: {error}</ErrorMessage>
      )}
      <div style={{ marginBottom: "10px", fontSize: "12px", color: "#666" }}>
        Connected peers: {peerCount} | Streams: {Object.keys(streams).length}
      </div>
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
