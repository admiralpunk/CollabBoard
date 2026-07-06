import {
  Mic, MicOff, Camera, CameraOff, PhoneOff,
  Send, MessageCircle, Video,
  Undo2, Redo2, Plus, Minus, X,
  AlertTriangle, ArrowLeft, Pen, Eraser,
  RectangleHorizontal, Circle, LineChart, Type,
  Trash2, Palette, Maximize2, Minimize2,
  LogOut, Users, Wifi, WifiOff,
} from 'lucide-react'
import styled from 'styled-components'

const ICON_MAP = {
  mic: Mic,
  'mic-off': MicOff,
  camera: Camera,
  'camera-off': CameraOff,
  'phone-off': PhoneOff,
  send: Send,
  'message-circle': MessageCircle,
  video: Video,
  undo: Undo2,
  redo: Redo2,
  plus: Plus,
  minus: Minus,
  x: X,
  'alert-triangle': AlertTriangle,
  'arrow-left': ArrowLeft,
  pen: Pen,
  eraser: Eraser,
  rectangle: RectangleHorizontal,
  circle: Circle,
  line: LineChart,
  text: Type,
  trash: Trash2,
  palette: Palette,
  'maximize-2': Maximize2,
  'minimize-2': Minimize2,
  'log-out': LogOut,
  users: Users,
  wifi: Wifi,
  'wifi-off': WifiOff,
}

const StyledIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
`

const Icon = ({ name, size = 18, className, ...props }) => {
  const LucideIcon = ICON_MAP[name]
  if (!LucideIcon) return null

  return (
    <StyledIcon className={className} aria-hidden="true" focusable="false">
      <LucideIcon size={size} {...props} />
    </StyledIcon>
  )
}

export default Icon
