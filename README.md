# CollabBoard

CollabBoard is a modern, full-stack collaborative whiteboard platform that empowers teams to brainstorm, teach, and create together in real time. Featuring live drawing, instant chat, and integrated video conferencing, CollabBoard delivers a seamless, interactive experience for remote collaboration.

![CollabBoard Screenshot](https://github.com/user-attachments/assets/4238d20d-c070-476b-b630-bcf27ee70f9f)

## Features

- **Real-time Whiteboard**: Draw, write, and annotate on a shared canvas with multiple users simultaneously.
- **Advanced Drawing Tools**: Freehand, shapes, text, and color selection for expressive collaboration.
- **Instant Chat**: Built-in chat for quick communication alongside the board.
- **Peer-to-Peer Video Chat**: Secure, low-latency video conferencing using WebRTC (simple-peer, STUN/TURN integration).
- **Room Management**: Create, join, and manage collaborative rooms for focused teamwork.
- **User Authentication**: Secure login and session management.
- **Rate Limiting & Security**: Backend rate limiting to prevent abuse and ensure stable service.
- **Responsive Design**: Optimized for desktop and mobile devices.

## Demo

Try the live app: [CollabBoard Demo](https://collab-board1.vercel.app/)

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/admiralpunk/CollabBoard.git
   cd CollabBoard
   ```
2. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. **Set up environment variables:**
   - Create a `.env` file in both `frontend` and `backend` directories using the provided `.env.example` as a reference.
4. **Start the development servers:**
   - In two terminals:
   ```bash
   cd backend && npm run dev
   # In another terminal
   cd frontend && npm run dev
   ```
   The frontend will be accessible at [http://localhost:3000](http://localhost:3000).

## Technologies Used

- **Frontend:** React, Vite, CSS Modules
- **Backend:** Node.js, Express.js
- **Real-time Communication:** Socket.IO, WebRTC (simple-peer)
- **Video Chat:** WebRTC, STUN/TURN servers
- **Authentication:** Custom (with session management)
- **Security:** Rate limiting, input validation

## Contributing

Contributions are welcome! Please open issues or submit pull requests for new features, bug fixes, or improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please contact [admiralpunk](mailto:aniketkolte79@gmail.com) or open an issue on GitHub.
