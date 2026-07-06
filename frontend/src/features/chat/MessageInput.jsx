import { useState, useRef } from "react"
import styled from "styled-components"

const InputContainer = styled.form`
  display: flex;
  padding: 16px;
  border-top: 1px solid rgba(255, 224, 130, 0.3);
  background: rgba(255, 255, 255, 0.4);
  gap: 12px;
`

const TextArea = styled.textarea`
  flex-grow: 1;
  padding: 12px 16px;
  border: 2px solid rgba(255, 224, 130, 0.4);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  color: #2c3e50;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  resize: none;
  min-height: 20px;
  max-height: 80px;

  &:focus {
    outline: none;
    border-color: #e7ae00;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(231, 174, 0, 0.1);
  }

  &::placeholder {
    color: rgba(44, 62, 80, 0.6);
  }
`

const CharCount = styled.span`
  font-size: 0.75em;
  color: ${props => props.$over ? '#d32f2f' : '#999'};
  align-self: flex-end;
  margin-bottom: 4px;
`

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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const MAX_LENGTH = 500

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState("")
  const typingTimer = useRef(null)

  const handleChange = (e) => {
    setMessage(e.target.value)

    if (onTyping) {
      if (typingTimer.current) clearTimeout(typingTimer.current)
      onTyping(true)
      typingTimer.current = setTimeout(() => onTyping(false), 1500)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage("")
      if (typingTimer.current) clearTimeout(typingTimer.current)
      if (onTyping) onTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <InputContainer onSubmit={handleSubmit} role="form" aria-label="Chat message form">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TextArea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for newline)"
          rows={1}
          maxLength={MAX_LENGTH}
          aria-label="Message input"
        />
        <CharCount $over={message.length > MAX_LENGTH} aria-live="polite">
          {message.length}/{MAX_LENGTH}
        </CharCount>
      </div>
      <SendButton type="submit" disabled={!message.trim()} aria-label="Send message">
        Send
      </SendButton>
    </InputContainer>
  )
}

export default MessageInput
