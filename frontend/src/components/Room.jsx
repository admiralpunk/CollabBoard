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

const Room = ({ onJoinRoom, notification }) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
      setError('Please enter both Room ID and Username.');
      return;
    }
    setError('');
    onJoinRoom(roomId, username);
  };

  const handleCreate = () => {
    if (!username.trim()) {
      setError('Please enter a Username.');
      return;
    }
    setError('');
    const newRoomId = Math.random().toString(36).substring(7);
    onJoinRoom(newRoomId, username);
  };

  return (
    <RoomContainer>
      {notification && (
        <div style={{ background: '#ffeeba', color: '#856404', padding: 10, borderRadius: 4, marginBottom: 10 }}>{notification}</div>
      )}
      <h2>Join or Create a Room</h2>
      <form onSubmit={handleJoin}>
        <Input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button type="submit">Join Room</Button>
      </form>
      <Button onClick={handleCreate}>Create New Room</Button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
    </RoomContainer>
  );
};

export default Room;