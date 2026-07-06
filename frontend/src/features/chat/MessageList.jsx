import { useEffect, useRef, memo } from "react"
import styled from "styled-components"
import EmptyState from "../../shared/components/EmptyState"

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
    border-radius: var(--radius-sm);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(231, 174, 0, 0.5);
    border-radius: var(--radius-sm);

    &:hover {
      background: rgba(231, 174, 0, 0.7);
    }
  }
`

const Message = styled.div`
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: ${(props) => (props.$isSelf ?
    "linear-gradient(135deg, var(--color-gray-400) 0%, var(--color-gray-500) 100%)" :
    "linear-gradient(135deg, var(--color-slate-500) 0%, var(--color-slate-600) 100%)"
  )};
  color: ${(props) => (props.$isSelf ? "var(--color-text-dark)" : "white")};
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
  animation: messageSlide 0.2s ease;

  @keyframes messageSlide {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  strong {
    color: ${(props) => (props.$isSelf ? "var(--color-text-dark)" : "rgba(255, 255, 255, 0.9)")};
    margin-right: 8px;
    font-weight: var(--weight-semibold);
    font-size: var(--body-sm);
  }
`

const Timestamp = styled.span`
  font-size: var(--body-sm);
  opacity: 0.6;
  display: block;
  text-align: right;
  margin-top: 4px;
`

const TypingIndicator = styled.div`
  font-size: var(--body-sm);
  color: var(--color-text-secondary);
  padding: 4px 16px;
  font-style: italic;
`

const formatTime = (ts) => {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const MessageList = ({ messages, username, typingUsers }) => {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <MessageListContainer role="log" aria-live="polite" aria-label="Chat messages">
      {messages.length === 0 ? (
        <EmptyState icon="message-circle" message="No messages yet. Start the conversation!" compact />
      ) : (
        messages.map((message) => (
          <Message key={message.id} $isSelf={message.sender === username}>
            <strong>{message.sender}:</strong> {message.text}
            <Timestamp>{formatTime(message.timestamp)}</Timestamp>
          </Message>
        ))
      )}
      {typingUsers && typingUsers.length > 0 && (
        <TypingIndicator aria-live="polite">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </TypingIndicator>
      )}
      <div ref={bottomRef} />
    </MessageListContainer>
  )
}

export default memo(MessageList)
