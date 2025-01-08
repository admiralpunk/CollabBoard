import { useState, useEffect } from 'react';
import styled from 'styled-components';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 20px;
`;

const Chat = ({ socket, roomId }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handleChatMessage = ({ message }) => {
      setMessages(prev => [...prev, { ...message, sender: 'Other' }]);
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket]);

  const handleSendMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'You',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    socket.emit('chat-message', { roomId, message: newMessage });
  };

  return (
    <ChatContainer>
      <MessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} />
    </ChatContainer>
  );
};

export default Chat;