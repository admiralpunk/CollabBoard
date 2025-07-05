import { useState, useEffect, useRef } from "react";

export const usePeerConnection = (socket, roomId, stream, myId) => {
  const [peers, setPeers] = useState({});
  const [streams, setStreams] = useState({});
  const [peerCount, setPeerCount] = useState(0);
  const peersRef = useRef({});
  const iceCandidateQueue = useRef({});
  const signalingQueues = useRef({});
  const negotiationState = useRef({});

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
      delete iceCandidateQueue.current[peerId];
    }
  };

  // Create peer connection
  const createPeerConnection = (peerId, isInitiator) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: import.meta.env.VITE_STUN_URL_1 },
        { urls: import.meta.env.VITE_STUN_URL_2 },
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

    // Connection state changes
    peer.oniceconnectionstatechange = () => {
      console.log(`[oniceconnectionstatechange] ${peerId}: ${peer.iceConnectionState}`);
      if (["disconnected", "failed"].includes(peer.iceConnectionState)) {
        setTimeout(() => {
          if (["disconnected", "failed"].includes(peer.iceConnectionState)) {
            console.warn(`[reconnect] Attempting to reconnect to ${peerId}`);
            removePeer(peerId);
            const isInitiator = myId < peerId;
            const newPeer = createPeerConnection(peerId, isInitiator);
            peersRef.current[peerId] = newPeer;
            setPeers(prev => ({ ...prev, [peerId]: newPeer }));
            setPeerCount(Object.keys(peersRef.current).length);
          }
        }, 2000);
      }
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
    return peer;
  };

  // Handle peer joined
  const handlePeerJoined = (peerId) => {
    if (peerId === myId) return;
    if (peersRef.current[peerId]) return;
    
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
    peersInRoom.forEach((peerId) => {
      if (peerId !== myId && !peersRef.current[peerId]) {
        const isInitiator = myId < peerId;
        console.log(`[peers-in-room] Connecting to existing peer ${peerId}, isInitiator: ${isInitiator}`);
        const peer = createPeerConnection(peerId, isInitiator);
        peersRef.current[peerId] = peer;
        setPeers(prev => ({ ...prev, [peerId]: peer }));
        setPeerCount(Object.keys(peersRef.current).length);
      }
    });
  };

  // Setup socket event listeners
  useEffect(() => {
    if (!stream || !roomId || !socket || !myId) return;
    
    setStreams({ local: stream });

    socket.on("peer-joined", handlePeerJoined);
    socket.on("signal", handleSignalPerfectNegotiation);
    socket.on("peer-left", handlePeerLeft);
    socket.on("peers-in-room", handlePeersInRoom);
    socket.emit("join", roomId);

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
    removePeer
  };
}; 