import { useState, useEffect } from "react";
import styled from "styled-components";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #BEBEBE 0%, #A9A9A9 100%);
  padding: 16px 20px;
  border-bottom: 1px solid rgba(190, 190, 190, 0.3);
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #BEBEBE, #A9A9A9, #BEBEBE);
  }
`;

const MinimizeButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(231, 174, 0, 0.3);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  color: #2c3e50;
  padding: 4px 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(231, 174, 0, 0.3);
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: ${props => props.$minimized ? '60px' : '380px'};
  background: linear-gradient(180deg, #FFF8E1 0%, #FFF3E0 100%);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(255, 224, 130, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 224, 130, 0.5);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  
  &:hover {
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.15),
      0 6px 20px rgba(255, 224, 130, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
`;

const Chat = ({ socket, roomId, username }) => {
  const [messages, setMessages] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleChatMessage = ({ message }) => {
      // If the message is from this user, mark as self, else use sender from message
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          sender: message.socketId === socket.id ? username : message.sender || "Other"
        }
      ]);
    };

    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("chat-message", handleChatMessage);
    };
  }, [socket, username]);

  const handleSendMessage = (message) => {
    const newMessage = {
      id: `${Date.now()}-${socket.id}`,
      text: message,
      sender: username,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    };
    socket.emit("chat-message", { roomId, message: newMessage });
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <ChatContainer $minimized={isMinimized}>
      <ChatHeader onClick={toggleMinimize}>
        <span>💬 Chat</span>
        <MinimizeButton onClick={(e) => {
          e.stopPropagation();
          toggleMinimize();
        }}>
          {isMinimized ? '+' : '−'}
        </MinimizeButton>
      </ChatHeader>
      {!isMinimized && (
        <>
          <MessageList messages={messages} username={username} />
          <MessageInput onSendMessage={handleSendMessage} />
        </>
      )}
    </ChatContainer>
  );
};

export default Chat;
