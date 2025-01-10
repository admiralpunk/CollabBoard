# CollabBoard

CollabBoard is a collaborative whiteboard application that enables multiple users to draw, write, and interact on a shared canvas in real-time.

## Features

- **Real-time Collaboration**: Multiple users can interact simultaneously on the same board.
- **Drawing Tools**: A variety of tools for freehand drawing, shapes, and text.
- **User Authentication**: Secure login system to manage user sessions.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Peer-to-Peer Communication**: Uses `simple-peer` for direct, efficient real-time connections.

## Demo

Experience the live application: [CollabBoard Demo](https://collab-board1.vercel.app/)

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/admiralpunk/CollabBoard.git
   cd CollabBoard
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Create a `.env` file in the root directory and configure the necessary environment variables. Example:

   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

   The application will be accessible at [http://localhost:3000](http://localhost:3000).

## Technologies Used

- **Frontend**: React with Vite for fast development and hot module replacement.
- **Backend**: Node.js with Express.js to handle API requests and WebSocket connections.
- **Real-time Communication**: Socket.IO for real-time, bidirectional communication between clients and the server.
- **Peer-to-Peer Communication**: `simple-peer` library for establishing direct connections between clients.
- **Styling**: CSS modules for scoped and maintainable styles.
