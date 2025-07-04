import { useState, useEffect } from "react";
import io from "socket.io-client";
import styled from "styled-components";
import Canvas from "./components/Canvas/Canvas";
import VideoChat from "./components/VideoChat/VideoChat";
import Chat from "./components/Chat/Chat";
import Room from "./components/Room";
import { v4 as uuidv4 } from 'uuid';

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
`;

const RoomInfo = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
`;

const LeftPanel = styled.div`
  flex: 1;
`;

const RightPanel = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
`;

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [userId] = useState(uuidv4());
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    // Connect to backend socket
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL_DEV;
    const transports = import.meta.env.VITE_SOCKET_TRANSPORTS?.split(",") || [
      "websocket",
      "polling",
    ];

    console.log("Connecting to backend at:", backendUrl);
    const newSocket = io(backendUrl, { 
      transports,
      timeout: 20000,
      forceNew: true
    }); // Backend URL and transports from environment variables
    setSocket(newSocket);

    window.socket = newSocket;

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Connected to backend");
      setConnectionStatus("connected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionStatus("error");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from backend:", reason);
      setConnectionStatus("disconnected");
    });

    // Listen for user-joined and user-left events
    newSocket.on("user-joined", ({ userCount }) => {
      console.log("user-joined event received", userCount);
      setUserCount(userCount);
    });

    newSocket.on("user-left", ({ userCount }) => {
      console.log("user-left event received", userCount);
      setUserCount(userCount);
    });

    newSocket.on("all-users", ({ users }) => {
      setUserCount(users.length);
    });

    // Cleanup socket connection when the component unmounts
    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoinRoom = (id) => {
    setRoomId(id);
    if (socket && socket.connected) {
      // For your app's user counting
      socket.emit("join-room", { roomId: id, userId });
      // For simple-multi-peer signaling
      socket.emit("join", id);
    } else if (socket) {
      socket.once("connect", () => {
        socket.emit("join-room", { roomId: id, userId });
        socket.emit("join", id);
      });
    }
  };

  if (!socket) return <div>Connecting...</div>;
  
  if (connectionStatus === "error") {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Connection Error</h2>
        <p>Failed to connect to the backend server. Please make sure the backend is running on port 3000.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <AppContainer>
      {!roomId ? (
        <Room onJoinRoom={handleJoinRoom} />
      ) : (
        <>
          <RoomInfo>
            <h2>Room: {roomId}</h2>
            <p>Users in room: {userCount}</p>
          </RoomInfo>
          <ContentContainer>
            <LeftPanel>
              <Canvas socket={socket} roomId={roomId} userId={userId} />
            </LeftPanel>
            <RightPanel>
              <VideoChat socket={socket} roomId={roomId} userId={userId} />
              <Chat socket={socket} roomId={roomId} />
            </RightPanel>
          </ContentContainer>
        </>
      )}
    </AppContainer>
  );
}

export default App;
