import { useState, useEffect, useCallback } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import styled from "styled-components"
import Room from "../features/room/Room"
import RoomPage from "./RoomPage"
import LoadingSpinner from "../shared/components/LoadingSpinner"
import Toast from "../shared/components/Toast"

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
`

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

function App() {
  const navigate = useNavigate()
  const [backendReady, setBackendReady] = useState(false)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, variant = "error") => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const checkBackendHealth = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`)
      if (response.ok) {
        setBackendReady(true)
      } else {
        addToast("Backend is not ready. Retrying in 50 seconds...", "warning")
        setTimeout(checkBackendHealth, 50000)
      }
    } catch {
      addToast("Cannot connect to backend. Retrying in 50 seconds...", "error")
      setTimeout(checkBackendHealth, 50000)
    }
  }, [addToast])

  useEffect(() => {
    checkBackendHealth()
  }, [checkBackendHealth])

  const handleJoinRoom = (id, name) => {
    navigate(`/${id}?username=${encodeURIComponent(name)}`)
  }

  if (!backendReady) {
    return (
      <AppContainer>
        <Toast toasts={toasts} onDismiss={dismissToast} />
        <LoadingSpinner size={48} label="Connecting to backend..." />
      </AppContainer>
    )
  }

  return (
    <AppContainer>
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <Routes>
        <Route path="/" element={<Room onJoinRoom={handleJoinRoom} />} />
        <Route path="/:roomId" element={<RoomPage />} />
      </Routes>
    </AppContainer>
  )
}

export default App
