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

  const handleJoinRoom = (id, name) => {
    // Navigate to the room URL with username as query parameter
    navigate(`/${id}?username=${encodeURIComponent(name)}`);
  };

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
