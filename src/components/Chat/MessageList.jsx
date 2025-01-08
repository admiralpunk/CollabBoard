import styled from 'styled-components';

const MessageListContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const Message = styled.div`
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background: ${props => props.$isSelf ? '#e3f2fd' : '#f5f5f5'};
  align-self: ${props => props.$isSelf ? 'flex-end' : 'flex-start'};
`;

const MessageList = ({ messages }) => (
  <MessageListContainer>
    {messages.map(message => (
      <Message key={message.id} $isSelf={message.sender === 'You'}>
        <strong>{message.sender}:</strong> {message.text}
      </Message>
    ))}
  </MessageListContainer>
);

export default MessageList;