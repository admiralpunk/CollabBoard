import { useState, useRef, memo } from "react"
import styled from "styled-components"
import Icon from "../../shared/components/Icon"

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
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text-dark);
  font-size: var(--body-md);
  font-family: inherit;
  transition: all 0.2s ease;
  resize: none;
  min-height: 20px;
  max-height: 80px;

  &:focus {
    outline: none;
    border-color: var(--color-border-focus);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(231, 174, 0, 0.1);
  }

  &::placeholder {
    color: var(--color-text-dark);
    opacity: 0.6;
  }
`

const CharCount = styled.span`
  font-size: var(--body-sm);
  color: ${props => props.$over ? 'var(--color-error)' : 'var(--color-text-muted)'};
  align-self: flex-end;
  margin-bottom: 4px;
`

const SendButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--color-gray-600) 0%, var(--color-gray-700) 100%);
  color: white;
  border: 1px solid rgba(146, 142, 133, 0.3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: var(--weight-semibold);
  font-size: var(--body-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: linear-gradient(135deg, var(--color-gray-700) 0%, var(--color-gray-800) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(146, 142, 133, 0.3);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
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
        <Icon name="send" size={16} />
        Send
      </SendButton>
    </InputContainer>
  )
}

export default memo(MessageInput)
