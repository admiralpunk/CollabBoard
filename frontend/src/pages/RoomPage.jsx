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
  const [hasTriedUrlUsername, setHasTriedUrlUsername] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const videoChatRef = useRef();
  const joinTimeoutRef = useRef(null);
  const popupShownRef = useRef(false);

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
      console.log("room-created event received", roomId);
      setNotification(`Room with name ${roomId} does not exist. Creating one.`);
      setTimeout(() => setNotification(""), 3000);
    });

    newSocket.on("usernames-update", ({ usernameMap }) => {
      console.log("usernames-update event received", usernameMap);
      setUsernameMap(usernameMap);
    });

    newSocket.on("all-users", ({ users, usernameMap }) => {
      console.log("all-users event received", { users, usernameMap });
      setUserCount(users.length);
      if (usernameMap) setUsernameMap(usernameMap);
    });

    newSocket.on("username-taken", ({ message }) => {
      setShowPopup(true);
      setNotification(message); // Optionally show message in popup
      // Do NOT clear username or setIsUsernameSet(false) here!
      // Wait for user to click OK on the popup
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

  // Set username from URL if available (only once)
  useEffect(() => {
    if (urlUsername && !username && !hasTriedUrlUsername) {
      setUsername(urlUsername);
      setHasTriedUrlUsername(true);
    }
  }, [urlUsername, hasTriedUrlUsername]); // Remove username and isUsernameSet from dependencies

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

  // Debug popup state changes
  useEffect(() => {
    console.log("Popup state changed:", showPopup);
  }, [showPopup]);

  // Check for popup state from localStorage on mount
  useEffect(() => {
    const shouldShowPopup = localStorage.getItem('showUsernamePopup') === 'true';
    if (shouldShowPopup) {
      console.log("Found popup state in localStorage, showing popup");
      setShowPopup(true);
      popupShownRef.current = true;
    }
  }, []);

  const handleSetUsername = (name) => {
    setUsername(name);
    setHasTriedUrlUsername(false); // Reset flag to allow new attempts
    setIsUsernameSet(false); // Reset to allow new username validation
    setIsJoining(false); // Reset joining state
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
  
  // Show loading while setting username from URL (but only if we haven't tried it yet)
  if (urlUsername && !username && !hasTriedUrlUsername) return <div>Loading...</div>;
  
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
    <>
      {/* Always render popup and overlay at the very top */}
      {(showPopup || popupShownRef.current || localStorage.getItem('showUsernamePopup') === 'true') && (
        <>
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 1000,
            border: '2px solid #FFE082',
            minWidth: '300px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>⚠️ Username Already Exists</h3>
            <p style={{ margin: '0 0 20px 0', color: '#333' }}>
              The username you entered is already taken in this room. Please try a different username.
            </p>
            <button
              onClick={() => {
                setShowPopup(false);
                popupShownRef.current = false;
                localStorage.removeItem('showUsernamePopup');
                localStorage.removeItem('usernamePopupMessage');
                setUsername(""); // Now clear username so input form appears
                setIsUsernameSet(false);
                setIsJoining(false);
                setHasTriedUrlUsername(true);
              }}
              style={{
                background: '#FFE082',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              OK
            </button>
          </div>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }} />
        </>
      )}
      
      {!socket && <div>Connecting...</div>}
      
      {/* Show loading while setting username from URL (but only if we haven't tried it yet) */}
      {urlUsername && !username && !hasTriedUrlUsername && <div>Loading...</div>}
      
      {connectionStatus === "error" && (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Connection Error</h2>
          <p>Failed to connect to the backend server. Please make sure the backend is running.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!username && socket && connectionStatus !== "error" && (
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
      )}

      {username && socket && connectionStatus !== "error" && (
        <AppContainer>
          <BackButton onClick={handleBackToHome}>← Back to Home</BackButton>
          
          {notification && (
            <div style={{ 
              background: '#ffeeba', 
              color: '#856404', 
              padding: 10, 
              borderRadius: 4, 
              marginBottom: 10, 
              textAlign: 'center' 
            }}>
              {notification}
            </div>
          )}
          <RoomInfo>
            <h2>Room: {roomId}</h2>
            {isUsernameSet && username ? (
              <>
                <p>Users in room: {userCount}</p>
                <p>You are: {username}</p>
              </>
            ) : (
              <p>Please enter a username to join the room</p>
            )}
          </RoomInfo>
          <ContentContainer>
            <LeftPanel>
              <Canvas socket={socket} roomId={roomId} userId={userId} username={username} />
            </LeftPanel>
            <RightPanel>
              {/* Debug info */}
              {console.log("VideoChat render state:", { isUsernameSet, username, userCount, hasSocket: !!socket })}
              
              {/* Only render VideoChat if username is properly set and validated */}
              {isUsernameSet && username ? (
                <VideoChat 
                  ref={videoChatRef}
                  socket={socket} 
                  roomId={roomId} 
                  userId={userId} 
                  username={username} 
                  usernameMap={usernameMap}
                />
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  {isJoining ? 'Joining room...' : 'Setting up video chat...'}
                </div>
              )}
              <Chat socket={socket} roomId={roomId} username={username} />
            </RightPanel>
          </ContentContainer>
        </AppContainer>
      )}
    </>
  );
};

export default RoomPage; 