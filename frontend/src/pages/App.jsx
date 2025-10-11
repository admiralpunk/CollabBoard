import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Room from "../features/room/Room";
import RoomPage from "./RoomPage";

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
`;

function App() {
  const navigate = useNavigate();
  const [backendReady, setBackendReady] = useState(false);

  // Function to check backend health
  const checkBackendHealth = async () => {
    try {
      const response = await fetch("https://collabboard-6kva.onrender.com/health");
      if (response.ok) {
        setBackendReady(true);
      } else {
        alert("Backend is not ready. Please wait 50 seconds for backend to spin up...");
        setTimeout(checkBackendHealth, 50000); // wait 50 seconds and retry
      }
    } catch (error) {
      alert("Cannot connect to backend. Retrying in 50 seconds...");
      setTimeout(checkBackendHealth, 50000); // wait 50 seconds and retry
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const handleJoinRoom = (id, name) => {
    navigate(`/${id}?username=${encodeURIComponent(name)}`);
  };

  if (!backendReady) {
    return <AppContainer>Please wait 50 seconds for backend to spin up.</AppContainer>;
  }

  return (
    <AppContainer>
      <Routes>
        <Route path="/" element={<Room onJoinRoom={handleJoinRoom} />} />
        <Route path="/:roomId" element={<RoomPage />} />
      </Routes>
    </AppContainer>
  );
}

export default App;
