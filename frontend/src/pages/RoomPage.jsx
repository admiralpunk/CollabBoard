import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import io from "socket.io-client";
import styled from "styled-components";
import Canvas from "../features/canvas/Canvas";
import VideoChat from "../features/video-chat/VideoChat";
import Chat from "../features/chat/Chat";
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

const BackButton = styled.button`
  background: #FFE082;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  margin-bottom: 20px;
  font-weight: bold;
  
  &:hover {
    background: #e7ae00;
  }
`;

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [socket, setSocket] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [userId] = useState(uuidv4());
  const [username, setUsername] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [notification, setNotification] = useState("");
  const [usernameMap, setUsernameMap] = useState({});
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const videoChatRef = useRef();
  const joinTimeoutRef = useRef(null);

  // Get username from URL query parameter
  const urlUsername = searchParams.get('username');

  useEffect(() => {
    // Connect to backend socket
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL_DEV;
    
    console.log("Connecting to backend:", backendUrl);
    console.log("Using transports:", ["polling"]);
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

    newSocket.on("username-taken", ({ message }) => {
      setNotification(message);
      setUsername(""); // Reset username so user can enter a new one
      setIsUsernameSet(false);
      setIsJoining(false);
      
      // Clear any pending join timeout
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
    });

    // Cleanup socket connection when the component unmounts
    return () => {
      // Stop all media tracks
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(() => {}); // Ignore errors if no stream exists
      }
      
      newSocket.close();
    };
  }, []);

  // Set username from URL if available
  useEffect(() => {
    if (urlUsername && !username) {
      setUsername(urlUsername);
    }
  }, [urlUsername, username]);

  useEffect(() => {
    if (socket && socket.connected && roomId && username && !isUsernameSet && !isJoining) {
      console.log("Joining room:", { roomId, userId, username });
      setIsJoining(true);
      
      // Clear any existing timeout
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
      
      // Add a small delay to prevent rapid joining
      joinTimeoutRef.current = setTimeout(() => {
        socket.emit("join-room", { roomId, userId, username });
        socket.emit("join", roomId);
        setIsUsernameSet(true);
        setIsJoining(false);
      }, 500); // 500ms delay
      
    } else if (socket && !socket.connected && roomId && username && !isJoining) {
      socket.once("connect", () => {
        console.log("Socket connected, joining room:", { roomId, userId, username });
        setIsJoining(true);
        
        // Clear any existing timeout
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
        }
        
        // Add a small delay to prevent rapid joining
        joinTimeoutRef.current = setTimeout(() => {
          socket.emit("join-room", { roomId, userId, username });
          socket.emit("join", roomId);
          setIsUsernameSet(true);
          setIsJoining(false);
        }, 500); // 500ms delay
      });
    }
  }, [socket, roomId, username, isUsernameSet, userId, isJoining]);

  // Reset isUsernameSet when username changes (for duplicate username handling)
  useEffect(() => {
    if (username && isUsernameSet) {
      setIsUsernameSet(false);
      setIsJoining(false);
    }
  }, [username]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
    };
  }, []);

  const handleSetUsername = (name) => {
    setUsername(name);
  };

  const handleBackToHome = () => {
    if (videoChatRef.current && videoChatRef.current.stopStream) {
      videoChatRef.current.stopStream();
    }
    if (socket) {
      socket.close();
    }
    navigate("/");
  };

  if (!socket) return <div>Connecting...</div>;
  
  // Show loading while setting username from URL
  if (urlUsername && !username) return <div>Loading...</div>;
  
  if (connectionStatus === "error") {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Connection Error</h2>
        <p>Failed to connect to the backend server. Please make sure the backend is running.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!username) {
    return (
      <AppContainer>
        <BackButton onClick={handleBackToHome}>← Back to Home</BackButton>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Join Room: {roomId}</h2>
          <div style={{ marginTop: "20px" }}>
            <input
              type="text"
              placeholder="Enter your username"
              style={{ padding: "10px", marginRight: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  handleSetUsername(e.target.value.trim());
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.target.previousSibling;
                if (input.value.trim()) {
                  handleSetUsername(input.value.trim());
                }
              }}
              style={{ padding: "10px 20px", background: "#FFE082", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Join Room
            </button>
          </div>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <BackButton onClick={handleBackToHome}>← Back to Home</BackButton>
      {notification && (
        <div style={{ background: '#ffeeba', color: '#856404', padding: 10, borderRadius: 4, marginBottom: 10, textAlign: 'center' }}>{notification}</div>
      )}
      <RoomInfo>
        <h2>Room: {roomId}</h2>
        <p>Users in room: {userCount}</p>
        <p>You are: {username}</p>
      </RoomInfo>
      <ContentContainer>
        <LeftPanel>
          <Canvas socket={socket} roomId={roomId} userId={userId} username={username} />
        </LeftPanel>
        <RightPanel>
          <VideoChat 
            ref={videoChatRef}
            socket={socket} 
            roomId={roomId} 
            userId={userId} 
            username={username} 
            usernameMap={usernameMap}
          />
          <Chat socket={socket} roomId={roomId} username={username} />
        </RightPanel>
      </ContentContainer>
    </AppContainer>
  );
};

export default RoomPage; 