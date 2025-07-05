import styled from "styled-components";

const MessageListContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const Message = styled.div`
  margin-bottom: 0.5rem;
  padding: 0.8rem;
  border-radius: 8px;
  background: ${(props) => (props.$isSelf ? "#1976d2" : "#f8f9fa")};
  color: ${(props) => (props.$isSelf ? "#ffffff" : "#212529")};
  align-self: ${(props) => (props.$isSelf ? "flex-end" : "flex-start")};
  max-width: 85%;
  word-wrap: break-word;

  strong {
    color: ${(props) => (props.$isSelf ? "#ffffff" : "#1976d2")};
    margin-right: 0.5rem;
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
