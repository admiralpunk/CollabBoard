import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { BACKEND_URL } from '../../constants/config.js'

const RoomContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  height: 100vh;
  padding-top: 10vh;
`

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
`

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #FFE082;
  color: #333;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #e7ae00;
  }
`

const ErrorText = styled.div`
  color: #d32f2f;
  margin-top: 10px;
  font-size: 0.9em;
`

const RoomListSection = styled.div`
  width: 100%;
  margin-top: 30px;
  text-align: left;
`

const RoomListTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #555;
`

const RoomEntry = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #fff8e1;
    border-color: #FFE082;
  }
`

const RoomName = styled.span`
  font-weight: 600;
  color: #333;
`

const RoomUsers = styled.span`
  font-size: 0.85em;
  color: #777;
`

const EmptyRooms = styled.div`
  color: #999;
  font-size: 0.9em;
  padding: 20px 0;
  text-align: center;
`

const VALID_ROOM_RE = /^[a-zA-Z0-9_-]{1,30}$/
const VALID_USERNAME_RE = /^[a-zA-Z0-9_\u0080-\uFFFF]{2,20}$/

const Room = ({ onJoinRoom, notification }) => {
  const [roomId, setRoomId] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState({})
  const [roomsLoading, setRoomsLoading] = useState(true)

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms`)
      if (res.ok) {
        setRooms(await res.json())
      }
    } catch {
      // Backend may not be ready yet
    } finally {
      setRoomsLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 10000)
    return () => clearInterval(interval)
  }, [])

  const validateUsername = (name) => {
    if (!name.trim()) return 'Please enter a username.'
    if (!VALID_USERNAME_RE.test(name.trim())) return 'Username must be 2-20 characters (letters, numbers, underscores).'
    return null
  }

  const validateRoomId = (id) => {
    if (!id.trim()) return 'Please enter a Room ID.'
    if (!VALID_ROOM_RE.test(id.trim())) return 'Room ID must be 1-30 characters (letters, numbers, hyphens, underscores).'
    return null
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const usernameError = validateUsername(username)
    if (usernameError) { setError(usernameError); return }
    const roomIdError = validateRoomId(roomId)
    if (roomIdError) { setError(roomIdError); return }
    setError('')
    onJoinRoom(roomId.trim(), username.trim())
  }

  const handleCreate = () => {
    const usernameError = validateUsername(username)
    if (usernameError) { setError(usernameError); return }
    setError('')
    const newRoomId = Math.random().toString(36).substring(2, 8)
    onJoinRoom(newRoomId, username.trim())
  }

  const handleSelectRoom = (id) => {
    setRoomId(id)
    setError('')
  }

  const roomEntries = Object.entries(rooms)

  return (
    <RoomContainer>
      {notification && (
        <div style={{ background: '#ffeeba', color: '#856404', padding: 10, borderRadius: 4, marginBottom: 10 }}>{notification}</div>
      )}
      <h2>Join or Create a Room</h2>
      <form onSubmit={handleJoin}>
        <Input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          maxLength={30}
        />
        <Input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
        />
        <Button type="submit">Join Room</Button>
      </form>
      <Button onClick={handleCreate}>Create New Room</Button>
      {error && <ErrorText>{error}</ErrorText>}

      <RoomListSection>
        <RoomListTitle>Active Rooms</RoomListTitle>
        {roomsLoading ? (
          <EmptyRooms>Loading...</EmptyRooms>
        ) : roomEntries.length === 0 ? (
          <EmptyRooms>No active rooms. Create one above!</EmptyRooms>
        ) : (
          roomEntries.map(([id, info]) => (
            <RoomEntry key={id} onClick={() => handleSelectRoom(id)}>
              <RoomName>{id}</RoomName>
              <RoomUsers>
                {info.userCount} user{info.userCount !== 1 ? 's' : ''}
                {info.users.length > 0 && (
                  <> — {info.users.map(u => u.username).join(', ')}</>
                )}
              </RoomUsers>
            </RoomEntry>
          ))
        )}
      </RoomListSection>
    </RoomContainer>
  )
}

export default Room
