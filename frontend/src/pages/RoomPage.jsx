import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import io from "socket.io-client"
import styled from "styled-components"
import Canvas from "../features/canvas/Canvas"
import VideoChat from "../features/video-chat/VideoChat"
import Chat from "../features/chat/Chat"
import { v4 as uuidv4 } from 'uuid'
import LoadingSpinner from "../shared/components/LoadingSpinner"
import Toast from "../shared/components/Toast"
import ConfirmationDialog from "../shared/components/ConfirmationDialog"
import Skeleton from "../shared/components/Skeleton"

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
`

const RoomInfo = styled.div`
  text-align: center;
  margin-bottom: 20px;
`

const ContentContainer = styled.div`
  display: flex;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
  flex-wrap: wrap;
`

const LeftPanel = styled.div`
  flex: 1;
  min-width: 300px;
`

const RightPanel = styled.div`
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    width: 100%;
  }
`

const BackButton = styled.button`
  background: var(--color-primary);
  color: #333;
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  cursor: pointer;
  margin-bottom: 20px;
  font-weight: bold;
  transition: background 0.2s;

  &:hover { background: var(--color-primary-hover); }

  &:focus-visible {
    outline: 2px solid var(--color-primary-hover);
    outline-offset: 2px;
  }
`

const ErrorContainer = styled.div`
  text-align: center;
  padding: 50px;
`

const ErrorTitle = styled.h2`
  margin-bottom: var(--space-md);
`

const ErrorText = styled.p`
  margin-bottom: var(--space-lg);
  color: var(--color-text-secondary);
`

const RetryButton = styled.button`
  padding: 10px 24px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: bold;
  color: #333;

  &:hover { background: var(--color-primary-hover); }
`

const JoinContainer = styled.div`
  text-align: center;
  padding: 50px;
`

const JoinTitle = styled.h2`
  margin-bottom: var(--space-lg);
`

const JoinRow = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
`

const UsernameInput = styled.input`
  padding: 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
`

const JoinButton = styled.button`
  padding: 10px 20px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: bold;
  color: #333;
  transition: background 0.2s;

  &:hover { background: var(--color-primary-hover); }

  &:focus-visible {
    outline: 2px solid var(--color-primary-hover);
    outline-offset: 2px;
  }
`

const NotificationBanner = styled.div`
  background: var(--color-warning-bg);
  color: var(--color-warning);
  padding: 10px;
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
  text-align: center;
`

const PopupOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const PopupDialog = styled.div`
  background: var(--color-surface);
  padding: 20px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1001;
  border: 2px solid var(--color-primary);
  min-width: 300px;
  text-align: center;
`

const PopupTitle = styled.h3`
  margin: 0 0 15px 0;
  color: var(--color-warning);
`

const PopupMessage = styled.p`
  margin: 0 0 20px 0;
  color: #333;
`

const PopupButton = styled.button`
  background: var(--color-primary);
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: bold;

  &:hover { background: var(--color-primary-hover); }
`

const VideoChatPlaceholder = styled.div`
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  color: var(--color-text-secondary);
`

const UserInfo = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
`

const RoomPage = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [socket, setSocket] = useState(null)
  const [userCount, setUserCount] = useState(0)
  const [userId] = useState(uuidv4())
  const [username, setUsername] = useState("")
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [notification, setNotification] = useState("")
  const [usernameMap, setUsernameMap] = useState({})
  const [isUsernameSet, setIsUsernameSet] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [hasTriedUrlUsername, setHasTriedUrlUsername] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [toasts, setToasts] = useState([])
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const videoChatRef = useRef()
  const joinTimeoutRef = useRef(null)
  const popupShownRef = useRef(false)

  const urlUsername = searchParams.get('username')

  const addToast = useCallback((message, variant = "info") => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL_DEV || "http://localhost:3000"
    const newSocket = io(backendUrl, {
      transports: ["polling"],
      upgrade: false,
      rememberUpgrade: false,
      timeout: 20000,
      forceNew: true
    })
    setSocket(newSocket)

    window.socket = newSocket

    newSocket.on("connect", () => {
      setConnectionStatus("connected")
    })

    newSocket.on("connect_error", () => {
      setConnectionStatus("error")
    })

    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected")
    })

    newSocket.on("user-joined", ({ userCount }) => {
      setUserCount(userCount)
    })

    newSocket.on("user-left", ({ userCount }) => {
      setUserCount(userCount)
    })

    newSocket.on("room-created", ({ roomId }) => {
      setNotification(`Room "${roomId}" does not exist. Creating one.`)
      addToast(`Room "${roomId}" has been created.`, "success")
      setTimeout(() => setNotification(""), 3000)
    })

    newSocket.on("usernames-update", ({ usernameMap }) => {
      setUsernameMap(usernameMap)
    })

    newSocket.on("all-users", ({ users, usernameMap }) => {
      setUserCount(users.length)
      if (usernameMap) setUsernameMap(usernameMap)
    })

    newSocket.on("username-taken", ({ message }) => {
      setShowPopup(true)
      setNotification(message)
    })

    return () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop())
          })
          .catch(() => {})
      }

      newSocket.close()
    }
  }, [addToast])

  useEffect(() => {
    if (urlUsername && !username && !hasTriedUrlUsername) {
      setUsername(urlUsername)
      setHasTriedUrlUsername(true)
    }
  }, [urlUsername, hasTriedUrlUsername])

  useEffect(() => {
    if (socket && socket.connected && roomId && username && !isUsernameSet && !isJoining) {
      setIsJoining(true)

      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current)
      }

      joinTimeoutRef.current = setTimeout(() => {
        socket.emit("join-room", { roomId, userId, username })
        setIsUsernameSet(true)
        setIsJoining(false)
      }, 500)

    } else if (socket && !socket.connected && roomId && username && !isJoining) {
      socket.once("connect", () => {
        setIsJoining(true)

        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current)
        }

        joinTimeoutRef.current = setTimeout(() => {
          socket.emit("join-room", { roomId, userId, username })
          setIsUsernameSet(true)
          setIsJoining(false)
        }, 500)
      })
    }
  }, [socket, roomId, username, isUsernameSet, userId, isJoining])

  useEffect(() => {
    if (username && isUsernameSet) {
      setIsUsernameSet(false)
      setIsJoining(false)
    }
  }, [username])

  useEffect(() => {
    return () => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const shouldShowPopup = localStorage.getItem('showUsernamePopup') === 'true'
    if (shouldShowPopup) {
      setShowPopup(true)
      popupShownRef.current = true
    }
  }, [])

  const handleSetUsername = (name) => {
    setUsername(name)
    setHasTriedUrlUsername(false)
    setIsUsernameSet(false)
    setIsJoining(false)
  }

  const handleBackToHome = useCallback(() => {
    if (videoChatRef.current && videoChatRef.current.stopStream) {
      videoChatRef.current.stopStream()
    }
    if (socket) {
      socket.close()
    }
    navigate("/")
  }, [socket, navigate])

  const requestLeave = () => {
    setShowLeaveConfirm(true)
  }

  const confirmLeave = () => {
    setShowLeaveConfirm(false)
    handleBackToHome()
  }

  const cancelLeave = () => {
    setShowLeaveConfirm(false)
  }

  if (!socket) return <LoadingSpinner size={48} label="Connecting..." />

  if (urlUsername && !username && !hasTriedUrlUsername) return <LoadingSpinner size={48} label="Loading..." />

  if (connectionStatus === "error") {
    return (
      <AppContainer>
        <ErrorContainer>
          <ErrorTitle>Connection Error</ErrorTitle>
          <ErrorText>Failed to connect to the backend server. Please make sure the backend is running.</ErrorText>
          <RetryButton onClick={() => window.location.reload()} aria-label="Retry connection">Retry</RetryButton>
        </ErrorContainer>
      </AppContainer>
    )
  }

  if (!username) {
    return (
      <AppContainer>
        <BackButton onClick={handleBackToHome}>← Back to Home</BackButton>
        <JoinContainer>
          <JoinTitle>Join Room: {roomId}</JoinTitle>
          <JoinRow>
            <UsernameInput
              type="text"
              placeholder="Enter your username"
              aria-label="Username"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  handleSetUsername(e.target.value.trim())
                }
              }}
            />
            <JoinButton
              onClick={(e) => {
                const input = e.currentTarget.previousSibling
                if (input.value.trim()) {
                  handleSetUsername(input.value.trim())
                }
              }}
              aria-label="Join room"
            >
              Join Room
            </JoinButton>
          </JoinRow>
        </JoinContainer>
      </AppContainer>
    )
  }

  return (
    <>
      {showLeaveConfirm && (
        <ConfirmationDialog
          title="Leave Room"
          message="Are you sure you want to leave this room?"
          onConfirm={confirmLeave}
          onCancel={cancelLeave}
        />
      )}

      {(showPopup || popupShownRef.current || localStorage.getItem('showUsernamePopup') === 'true') && (
        <PopupOverlay
          role="dialog"
          aria-modal="true"
          aria-label="Username already exists"
          onClick={() => {}}
        >
          <PopupDialog>
            <PopupTitle>⚠️ Username Already Exists</PopupTitle>
            <PopupMessage>
              The username you entered is already taken in this room. Please try a different username.
            </PopupMessage>
            <PopupButton
              onClick={() => {
                setShowPopup(false)
                popupShownRef.current = false
                localStorage.removeItem('showUsernamePopup')
                localStorage.removeItem('usernamePopupMessage')
                setUsername("")
                setIsUsernameSet(false)
                setIsJoining(false)
                setHasTriedUrlUsername(true)
              }}
            >
              OK
            </PopupButton>
          </PopupDialog>
        </PopupOverlay>
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />

      {connectionStatus === "disconnected" && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          background: 'var(--color-danger)',
          color: 'white',
          textAlign: 'center',
          padding: '8px',
          zIndex: 999,
          fontWeight: 'bold'
        }} role="alert">
          Connection Lost — Reconnecting...
        </div>
      )}

      {username && socket && connectionStatus !== "error" && (
        <AppContainer>
          <BackButton onClick={requestLeave} aria-label="Back to home">← Back to Home</BackButton>

          {notification && (
            <NotificationBanner role="alert">{notification}</NotificationBanner>
          )}
          <RoomInfo>
            <h2>Room: {roomId}</h2>
            {isUsernameSet && username ? (
              <UserInfo>
                <span>Users in room: <strong>{userCount}</strong></span>
                <span>You are: <strong>{username}</strong></span>
              </UserInfo>
            ) : (
              <p>Please enter a username to join the room</p>
            )}
          </RoomInfo>
          <ContentContainer>
            <LeftPanel>
              <Canvas socket={socket} roomId={roomId} userId={userId} username={username} />
            </LeftPanel>
            <RightPanel>
              {isUsernameSet && username ? (
                <VideoChat
                  ref={videoChatRef}
                  socket={socket}
                  roomId={roomId}
                  userId={userId}
                  username={username}
                  usernameMap={usernameMap}
                  onLeaveRoom={handleBackToHome}
                />
              ) : (
                <VideoChatPlaceholder>
                  {isJoining ? (
                    <LoadingSpinner size={20} label="Joining room..." />
                  ) : (
                    <>
                      <Skeleton $height={16} $width="60%" $mb="8px" />
                      <Skeleton $height={80} $radius="8px" />
                      <Skeleton $height={120} $radius="8px" $mb="8px" />
                    </>
                  )}
                </VideoChatPlaceholder>
              )}
              <Chat socket={socket} roomId={roomId} username={username} usernameMap={usernameMap} />
            </RightPanel>
          </ContentContainer>
        </AppContainer>
      )}
    </>
  )
}

export default RoomPage
