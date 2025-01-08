import { useState } from 'react';
import styled from 'styled-components';

const RoomContainer = styled.div`
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #45a049;
  }
`;

const Room = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom(roomId);
    }
  };

  const handleCreate = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    onJoinRoom(newRoomId);
  };

  return (
    <RoomContainer>
      <h2>Join or Create a Room</h2>
      <form onSubmit={handleJoin}>
        <Input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <Button type="submit">Join Room</Button>
      </form>
      <Button onClick={handleCreate}>Create New Room</Button>
    </RoomContainer>
  );
};

export default Room;