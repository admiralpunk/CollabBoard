import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import styled from 'styled-components';
import Canvas from './components/Canvas/Canvas';
import VideoChat from './components/VideoChat/VideoChat';
import Chat from './components/Chat/Chat';
import Room from './components/Room';

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

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('user-joined', ({ userCount }) => {
      setUserCount(userCount);
    });

    newSocket.on('user-left', ({ userCount }) => {
      setUserCount(userCount);
    });

    return () => newSocket.close();
  }, []);

  const handleJoinRoom = (id) => {
    setRoomId(id);
    socket.emit('join-room', id);
  };

  if (!socket) return <div>Connecting...</div>;

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
              <Canvas socket={socket} roomId={roomId} />
            </LeftPanel>
            <RightPanel>
              <VideoChat socket={socket} roomId={roomId} />
              <Chat socket={socket} roomId={roomId} />
            </RightPanel>
          </ContentContainer>
        </>
      )}
    </AppContainer>
  );
}

export default App;