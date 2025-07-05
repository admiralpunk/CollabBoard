import { useState, useEffect } from "react";

export const useSocketId = (socket) => {
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    if (!socket) return;
    
    setMyId(socket.id);
    socket.on("connect", () => setMyId(socket.id));
    
    return () => {
      socket.off("connect");
    };
  }, [socket]);

  return myId;
}; 