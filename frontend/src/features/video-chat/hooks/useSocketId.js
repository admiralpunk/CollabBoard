import { useState, useEffect } from "react";

export const useSocketId = (socket) => {
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    if (!socket) {
      console.log('[useSocketId] No socket provided');
      return;
    }
    
    console.log('[useSocketId] Socket provided, current ID:', socket.id);
    
    // Set initial ID if available
    if (socket.id) {
      setMyId(socket.id);
    }
    
    // Listen for connect event
    const handleConnect = () => {
      console.log('[useSocketId] Socket connected, ID:', socket.id);
      setMyId(socket.id);
    };
    
    socket.on("connect", handleConnect);
    
    // Also check if already connected
    if (socket.connected && socket.id) {
      console.log('[useSocketId] Socket already connected, setting ID:', socket.id);
      setMyId(socket.id);
    }
    
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket]);

  return myId;
}; 