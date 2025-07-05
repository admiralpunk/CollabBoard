import { useState, useEffect, useRef } from "react";

export const usePeerConnection = (socket, roomId, stream, myId) => {
  const [peers, setPeers] = useState({});
  const [streams, setStreams] = useState({});
  const [peerCount, setPeerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState({});
  const peersRef = useRef({});
  const iceCandidateQueue = useRef({});
  const signalingQueues = useRef({});
  const negotiationState = useRef({});
  const connectionAttempts = useRef({});

  // Helper function to enqueue signals
  const enqueueSignal = (peerId, fn) => {
    if (!signalingQueues.current[peerId]) {
      signalingQueues.current[peerId] = Promise.resolve();
    }
    signalingQueues.current[peerId] = signalingQueues.current[peerId]
      .then(fn)
      .catch((e) => {
        console.warn(`[signalingQueue] Error for ${peerId}:`, e);
      });
  };

  // Helper function to remove a peer
  const removePeer = (peerId) => {
    console.log(`[removePeer] Removing peer ${peerId}`);
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
      setConnectionStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[peerId];
        return newStatus;
      });
      setPeerCount(Object.keys(peersRef.current).length);
      delete iceCandidateQueue.current[peerId];
      delete connectionAttempts.current[peerId];
    }
  };

  // Create peer connection
  const createPeerConnection = (peerId, isInitiator) => {
    console.log(`[createPeerConnection] Creating connection to ${peerId}, isInitiator: ${isInitiator}`);
    
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: import.meta.env.VITE_STUN_URL_1 || "stun:stun.l.google.com:19302" },
        { urls: import.meta.env.VITE_STUN_URL_2 || "stun:stun1.l.google.com:19302" },
        {
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL
        },
        {
          urls: import.meta.env.VITE_TURN2_URL,
          username: import.meta.env.VITE_TURN2_USERNAME,
          credential: import.meta.env.VITE_TURN2_CREDENTIAL
        }
      ].filter(server => server.urls) // Filter out undefined servers
    });

    // Add local stream
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log(`[addTrack] Adding track to peer ${peerId}:`, track.kind);
        peer.addTrack(track, stream);
      });
    }

    // Handle incoming streams
    peer.ontrack = (event) => {
      console.log(`[ontrack] Received remote stream from: ${peerId}`, event.streams[0]);
      if (event.streams && event.streams[0]) {
        setStreams(prev => ({ ...prev, [peerId]: event.streams[0] }));
        setConnectionStatus(prev => ({ ...prev, [peerId]: 'connected' }));
      }
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

    // Connection state changes
    peer.oniceconnectionstatechange = () => {
      console.log(`[oniceconnectionstatechange] ${peerId}: ${peer.iceConnectionState}`);
      setConnectionStatus(prev => ({ ...prev, [peerId]: peer.iceConnectionState }));
      
      if (["disconnected", "failed"].includes(peer.iceConnectionState)) {
        const attempts = connectionAttempts.current[peerId] || 0;
        if (attempts < 3) {
          setTimeout(() => {
            if (["disconnected", "failed"].includes(peer.iceConnectionState)) {
              console.warn(`[reconnect] Attempting to reconnect to ${peerId} (attempt ${attempts + 1})`);
              connectionAttempts.current[peerId] = attempts + 1;
              removePeer(peerId);
              const isInitiator = myId < peerId;
              const newPeer = createPeerConnection(peerId, isInitiator);
              peersRef.current[peerId] = newPeer;
              setPeers(prev => ({ ...prev, [peerId]: newPeer }));
              setPeerCount(Object.keys(peersRef.current).length);
            }
          }, 2000);
        } else {
          console.error(`[reconnect] Failed to reconnect to ${peerId} after ${attempts} attempts`);
          removePeer(peerId);
        }
      }
      if (["disconnected", "failed", "closed"].includes(peer.iceConnectionState)) {
        removePeer(peerId);
      }
    };

    peer.onconnectionstatechange = () => {
      console.log(`[onconnectionstatechange] ${peerId}: ${peer.connectionState}`);
      setConnectionStatus(prev => ({ ...prev, [peerId]: peer.connectionState }));
    };

    peer.onsignalingstatechange = () => {
      console.log(`[onsignalingstatechange] ${peerId}: ${peer.signalingState}`);
    };

    peer.onnegotiationneeded = async () => {
      console.log(`[onnegotiationneeded] ${peerId}`);
      if (isInitiator) {
        negotiationState.current[peerId] = negotiationState.current[peerId] || {};
        negotiationState.current[peerId].makingOffer = true;
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          negotiationState.current[peerId].makingOffer = false;
          console.log(`[offer] Sent offer to ${peerId}`, offer);
          socket.emit("signal", {
            to: peerId,
            data: { type: "offer", sdp: peer.localDescription }
          });
        } catch (err) {
          negotiationState.current[peerId].makingOffer = false;
          console.error("Error during negotiationneeded/offer:", err);
        }
      }
    };

    iceCandidateQueue.current[peerId] = [];
    connectionAttempts.current[peerId] = 0;
    return peer;
  };

  // Handle peer joined
  const handlePeerJoined = (peerId) => {
    console.log(`[peer-joined] New peer joined: ${peerId}`);
    console.log(`[peer-joined] My ID: ${myId}`);
    console.log(`[peer-joined] Current peer connections:`, Object.keys(peersRef.current));
    
    if (peerId === myId) {
      console.log(`[peer-joined] Skipping myself (${peerId})`);
      return;
    }
    if (peersRef.current[peerId]) {
      console.log(`[peer-joined] Already connected to ${peerId}`);
      return;
    }
    
    const isInitiator = myId < peerId;
    console.log(`[peer-joined] ${peerId}, I am ${myId}, isInitiator: ${isInitiator}`);
    const peer = createPeerConnection(peerId, isInitiator);
    peersRef.current[peerId] = peer;
    setPeers(prev => ({ ...prev, [peerId]: peer }));
    setPeerCount(Object.keys(peersRef.current).length);
  };

  // Handle peer left
  const handlePeerLeft = (peerId) => {
    console.log(`[peer-left] ${peerId}`);
    removePeer(peerId);
  };

  // Perfect negotiation signal handler
  const handleSignalPerfectNegotiation = ({ id, data }) => {
    enqueueSignal(id, async () => {
      if (id === myId) return;
      let peer = peersRef.current[id];
      if (!peer) {
        const isInitiator = myId < id;
        peer = createPeerConnection(id, isInitiator);
        peersRef.current[id] = peer;
        setPeers(prev => ({ ...prev, [id]: peer }));
      }

      const polite = myId > id;
      negotiationState.current[id] = negotiationState.current[id] || { 
        makingOffer: false, 
        ignoreOffer: false, 
        isSettingRemoteAnswerPending: false 
      };
      const state = negotiationState.current[id];

      if (data.type === "offer") {
        const offerCollision = state.makingOffer || peer.signalingState !== "stable";
        state.ignoreOffer = !polite && offerCollision;
        if (state.ignoreOffer) {
          console.log(`[perfect-negotiation] Ignoring offer from ${id} due to collision`);
          return;
        }
        state.isSettingRemoteAnswerPending = true;
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (err) {
          console.warn(`[setRemoteDescription] Failed to set remote offer for ${id}:`, err);
          state.isSettingRemoteAnswerPending = false;
          return;
        }
        state.isSettingRemoteAnswerPending = false;

        // Add queued ICE candidates
        if (iceCandidateQueue.current[id] && iceCandidateQueue.current[id].length > 0) {
          for (const candidate of iceCandidateQueue.current[id]) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding queued ICE candidate:", err);
            }
          }
          iceCandidateQueue.current[id] = [];
        }

        if (peer.signalingState === "have-remote-offer") {
          try {
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            console.log(`[answer] Sent answer to ${id}`, answer);
            socket.emit("signal", {
              to: id,
              data: { type: "answer", sdp: peer.localDescription }
            });
          } catch (err) {
            console.warn(`[answer] Failed to set local answer for ${id}:`, err);
          }
        }
      } else if (data.type === "answer") {
        state.isSettingRemoteAnswerPending = true;
        try {
          if (peer.signalingState === "have-local-offer") {
            await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
          }
        } catch (err) {
          console.warn(`[setRemoteDescription] Failed for ${id}:`, err);
        }
        state.isSettingRemoteAnswerPending = false;

        if (iceCandidateQueue.current[id] && iceCandidateQueue.current[id].length > 0) {
          for (const candidate of iceCandidateQueue.current[id]) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding queued ICE candidate:", err);
            }
          }
          iceCandidateQueue.current[id] = [];
        }
      } else if (data.type === "ice-candidate") {
        if (state.isSettingRemoteAnswerPending || !peer.remoteDescription || peer.remoteDescription.type === "") {
          console.log(`[ice-candidate] Queuing candidate for ${id}`);
          iceCandidateQueue.current[id] = iceCandidateQueue.current[id] || [];
          iceCandidateQueue.current[id].push(data.candidate);
        } else {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        }
      }
      console.log(`[signalingState] ${id}:`, peer.signalingState);
    });
  };

  // Handle existing peers in room
  const handlePeersInRoom = (peersInRoom) => {
    console.log('[peers-in-room] Existing peers:', peersInRoom);
    console.log('[peers-in-room] My ID:', myId);
    console.log('[peers-in-room] Current peer connections:', Object.keys(peersRef.current));
    
    peersInRoom.forEach((peerId) => {
      if (peerId !== myId && !peersRef.current[peerId]) {
        const isInitiator = myId < peerId;
        console.log(`[peers-in-room] Connecting to existing peer ${peerId}, isInitiator: ${isInitiator}`);
        const peer = createPeerConnection(peerId, isInitiator);
        peersRef.current[peerId] = peer;
        setPeers(prev => ({ ...prev, [peerId]: peer }));
        setPeerCount(Object.keys(peersRef.current).length);
      } else if (peerId === myId) {
        console.log(`[peers-in-room] Skipping myself (${peerId})`);
      } else if (peersRef.current[peerId]) {
        console.log(`[peers-in-room] Already connected to ${peerId}`);
      }
    });
  };

  // Setup socket event listeners
  useEffect(() => {
    if (!stream || !roomId || !socket || !myId) return;
    
    console.log(`[usePeerConnection] Setting up with roomId: ${roomId}, myId: ${myId}`);
    setStreams({ local: stream });

    socket.on("peer-joined", handlePeerJoined);
    socket.on("signal", handleSignalPerfectNegotiation);
    socket.on("peer-left", handlePeerLeft);
    socket.on("peers-in-room", handlePeersInRoom);
    
    // Only emit join if socket is connected and we're in a room
    if (socket.connected) {
      console.log(`[usePeerConnection] Socket connected, emitting join for room: ${roomId}`);
      // Small delay to ensure room join is processed first
      setTimeout(() => {
        socket.emit("join", roomId);
      }, 100);
    } else {
      console.log(`[usePeerConnection] Socket not connected, waiting for connection`);
      socket.once("connect", () => {
        console.log(`[usePeerConnection] Socket connected, now emitting join for room: ${roomId}`);
        // Small delay to ensure room join is processed first
        setTimeout(() => {
          socket.emit("join", roomId);
        }, 100);
      });
    }

    return () => {
      console.log(`[usePeerConnection] Cleaning up connections`);
      socket.off("peer-joined", handlePeerJoined);
      socket.off("signal", handleSignalPerfectNegotiation);
      socket.off("peer-left", handlePeerLeft);
      socket.off("peers-in-room", handlePeersInRoom);
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
    };
  }, [roomId, stream, socket, myId]);

  // Debug effect
  useEffect(() => {
    console.log(`[usePeerConnection] Current state:`, {
      peerCount,
      streams: Object.keys(streams),
      peers: Object.keys(peersRef.current),
      connectionStatus
    });
  }, [peerCount, streams, connectionStatus]);

  return {
    peers,
    streams,
    peerCount,
    connectionStatus,
    removePeer
  };
}; 