import { useState } from "react";
import styled from "styled-components";

const InputContainer = styled.form`
  display: flex;
  padding: 16px;
  border-top: 1px solid rgba(255, 224, 130, 0.3);
  background: rgba(255, 255, 255, 0.4);
  gap: 12px;
`;

const Input = styled.input`
  flex-grow: 1;
  padding: 12px 16px;
  border: 2px solid rgba(255, 224, 130, 0.4);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  color: #2c3e50;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #e7ae00;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(231, 174, 0, 0.1);
  }
  
  &::placeholder {
    color: rgba(44, 62, 80, 0.6);
  }
`;

const SendButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #928e85 0%, #7a7670 100%);
  color: white;
  border: 1px solid rgba(146, 142, 133, 0.3);
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  min-width: 80px;

  &:hover {
    background: linear-gradient(135deg, #7a7670 0%, #6b6760 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(146, 142, 133, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <InputContainer onSubmit={handleSubmit}>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <SendButton type="submit">Send</SendButton>
    </InputContainer>
  );
};

export default MessageInput;
