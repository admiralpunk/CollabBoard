import styled from "styled-components";

const MessageListContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 224, 130, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(231, 174, 0, 0.5);
    border-radius: 3px;
    
    &:hover {
      background: rgba(231, 174, 0, 0.7);
    }
  }
`;

const Message = styled.div`
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${(props) => (props.$isSelf ? 
    "linear-gradient(135deg, #BEBEBE 0%, #A9A9A9 100%)" : 
    "linear-gradient(135deg, #708090 0%, #5f6f7f 100%)"
  )};
  color: ${(props) => (props.$isSelf ? "#2c3e50" : "white")};
  align-self: ${(props) => (props.$isSelf ? "flex-end" : "flex-start")};
  max-width: 85%;
  word-wrap: break-word;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid ${(props) => (props.$isSelf ? 
    "rgba(190, 190, 190, 0.3)" : 
    "rgba(112, 128, 144, 0.3)"
  )};
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.15);
  }

  strong {
    color: ${(props) => (props.$isSelf ? "#2c3e50" : "rgba(255, 255, 255, 0.9)")};
    margin-right: 8px;
    font-weight: 600;
    font-size: 0.9em;
  }
`;

const MessageList = ({ messages, username }) => (
  <MessageListContainer>
    {messages.map((message) => (
      <Message key={message.id} $isSelf={message.sender === username}>
        <strong>{message.sender}:</strong> {message.text}
      </Message>
    ))}
  </MessageListContainer>
);

export default MessageList;
