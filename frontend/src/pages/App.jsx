import { useState, useEffect } from "react";
import io from "socket.io-client";
import styled from "styled-components";
import Canvas from "../features/canvas/Canvas";
import VideoChat from "../features/video-chat/VideoChat";
import Chat from "../features/chat/Chat";
import Room from "../features/room/Room";
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
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [userId] = useState(uuidv4());
  const [username, setUsername] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [notification, setNotification] = useState("");
  const [usernameMap, setUsernameMap] = useState({});

  useEffect(() => {
    // Connect to backend socket
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL_DEV;
    const transports = import.meta.env.VITE_SOCKET_TRANSPORTS?.split(",") || [
      "polling",
    ];

    console.log("Connecting to backend:", backendUrl);
    console.log("Using transports:", transports);
    const newSocket = io(backendUrl, { 
      transports: ["polling"],
      upgrade: false,
      rememberUpgrade: false,
      timeout: 20000,
      forceNew: true
    }); // Force polling only, disable WebSocket upgrade
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

    newSocket.on("room-created", ({ roomId }) => {
      setNotification(`Room with name ${roomId} does not exist. Creating one.`);
      setTimeout(() => setNotification(""), 3000);
    });

    newSocket.on("usernames-update", ({ usernameMap }) => {
      setUsernameMap(usernameMap);
    });

    newSocket.on("all-users", ({ users, usernameMap }) => {
      setUserCount(users.length);
      if (usernameMap) setUsernameMap(usernameMap);
    });

    // Cleanup socket connection when the component unmounts
    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoinRoom = (id, name) => {
    setRoomId(id);
    setUsername(name);
    if (socket && socket.connected) {
      socket.emit("join-room", { roomId: id, userId, username: name });
      socket.emit("join", id);
    } else if (socket) {
      socket.once("connect", () => {
        socket.emit("join-room", { roomId: id, userId, username: name });
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
      {notification && (
        <div style={{ background: '#ffeeba', color: '#856404', padding: 10, borderRadius: 4, marginBottom: 10, textAlign: 'center' }}>{notification}</div>
      )}
      {!roomId ? (
        <Room onJoinRoom={handleJoinRoom} notification={notification} />
      ) : (
        <>
          <RoomInfo>
            <h2>Room: {roomId}</h2>
            <p>Users in room: {userCount}</p>
          </RoomInfo>
          <ContentContainer>
            <LeftPanel>
              <Canvas socket={socket} roomId={roomId} userId={userId} username={username} />
            </LeftPanel>
            <RightPanel>
              <VideoChat socket={socket} roomId={roomId} userId={userId} username={username} usernameMap={usernameMap} />
              <Chat socket={socket} roomId={roomId} username={username} />
            </RightPanel>
          </ContentContainer>
        </>
      )}
    </AppContainer>
  );
}

export default App;
