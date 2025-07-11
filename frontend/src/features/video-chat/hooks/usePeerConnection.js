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
      .catch(() => {});
  };

  // Helper function to remove a peer
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
        peer.addTrack(track, stream);
      });
    }

    // Handle incoming streams
    peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setStreams(prev => ({ ...prev, [peerId]: event.streams[0] }));
        setConnectionStatus(prev => ({ ...prev, [peerId]: 'connected' }));
      }
    };

    // ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          to: peerId,
          data: { type: "ice-candidate", candidate: event.candidate }
        });
      }
    };

    // Connection state changes
    peer.oniceconnectionstatechange = () => {
      setConnectionStatus(prev => ({ ...prev, [peerId]: peer.iceConnectionState }));
      
      if (["disconnected", "failed"].includes(peer.iceConnectionState)) {
        const attempts = connectionAttempts.current[peerId] || 0;
        if (attempts < 3) {
          setTimeout(() => {
            if (["disconnected", "failed"].includes(peer.iceConnectionState)) {
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
          removePeer(peerId);
        }
      }
      if (["disconnected", "failed", "closed"].includes(peer.iceConnectionState)) {
        removePeer(peerId);
      }
    };

    peer.onconnectionstatechange = () => {
      setConnectionStatus(prev => ({ ...prev, [peerId]: peer.connectionState }));
    };

    peer.onsignalingstatechange = () => {
    };

    peer.onnegotiationneeded = async () => {
      if (isInitiator) {
        negotiationState.current[peerId] = negotiationState.current[peerId] || {};
        negotiationState.current[peerId].makingOffer = true;
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          negotiationState.current[peerId].makingOffer = false;
          socket.emit("signal", {
            to: peerId,
            data: { type: "offer", sdp: peer.localDescription }
          });
        } catch (err) {
          negotiationState.current[peerId].makingOffer = false;
        }
      }
    };

    iceCandidateQueue.current[peerId] = [];
    connectionAttempts.current[peerId] = 0;
    return peer;
  };

  // Handle peer joined
  const handlePeerJoined = (peerId) => {
    if (peerId === myId) {
      return;
    }
    if (peersRef.current[peerId]) {
      return;
    }
    
    const isInitiator = myId < peerId;
    const peer = createPeerConnection(peerId, isInitiator);
    peersRef.current[peerId] = peer;
    setPeers(prev => ({ ...prev, [peerId]: peer }));
    setPeerCount(Object.keys(peersRef.current).length);
  };

  // Handle peer left
  const handlePeerLeft = (peerId) => {
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
          return;
        }
        state.isSettingRemoteAnswerPending = true;
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (err) {
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
            }
          }
          iceCandidateQueue.current[id] = [];
        }

        if (peer.signalingState === "have-remote-offer") {
          try {
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("signal", {
              to: id,
              data: { type: "answer", sdp: peer.localDescription }
            });
          } catch (err) {
          }
        }
      } else if (data.type === "answer") {
        state.isSettingRemoteAnswerPending = true;
        try {
          if (peer.signalingState === "have-local-offer") {
            await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
          }
        } catch (err) {
        }
        state.isSettingRemoteAnswerPending = false;

        if (iceCandidateQueue.current[id] && iceCandidateQueue.current[id].length > 0) {
          for (const candidate of iceCandidateQueue.current[id]) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
            }
          }
          iceCandidateQueue.current[id] = [];
        }
      } else if (data.type === "ice-candidate") {
        if (state.isSettingRemoteAnswerPending || !peer.remoteDescription || peer.remoteDescription.type === "") {
          iceCandidateQueue.current[id] = iceCandidateQueue.current[id] || [];
          iceCandidateQueue.current[id].push(data.candidate);
        } else {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
          }
        }
      }
    });
  };

  // Handle existing peers in room
  const handlePeersInRoom = (peersInRoom) => {
    peersInRoom.forEach((peerId) => {
      if (peerId !== myId && !peersRef.current[peerId]) {
        const isInitiator = myId < peerId;
        const peer = createPeerConnection(peerId, isInitiator);
        peersRef.current[peerId] = peer;
        setPeers(prev => ({ ...prev, [peerId]: peer }));
        setPeerCount(Object.keys(peersRef.current).length);
      } else if (peerId === myId) {
      } else if (peersRef.current[peerId]) {
      }
    });
  };

  // Setup socket event listeners
  useEffect(() => {
    if (!stream || !roomId || !socket || !myId) {
      return;
    }
    
    setStreams({ local: stream });

    socket.on("peer-joined", handlePeerJoined);
    socket.on("signal", handleSignalPerfectNegotiation);
    socket.on("peer-left", handlePeerLeft);
    socket.on("peers-in-room", handlePeersInRoom);
    
    // Only emit join if socket is connected and we're in a room
    if (socket.connected) {
      setTimeout(() => {
        socket.emit("join", roomId);
      }, 100);
    } else {
      socket.once("connect", () => {
        setTimeout(() => {
          socket.emit("join", roomId);
        }, 100);
      });
    }

    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("signal", handleSignalPerfectNegotiation);
      socket.off("peer-left", handlePeerLeft);
      socket.off("peers-in-room", handlePeersInRoom);
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
    };
  }, [roomId, stream, socket, myId]);

  return {
    peers,
    streams,
    peerCount,
    connectionStatus,
    removePeer
  };
}; 