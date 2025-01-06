require('dotenv').config();
const express = require('express');
const http = require('http');
const { v4: uuidV4 } = require('uuid');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST"]
  }
});

// Log the FRONTEND_URL to ensure it's being loaded correctly
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// CORS middleware to allow requests from the frontend
app.use(cors({
  origin: [process.env.FRONTEND_URL]
}));

// Endpoint to create a new room
app.get('/room', (req, res) => {
  const roomId = uuidV4();
  res.json({ roomId });
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle user joining a room
  socket.on('join-room', (roomId) => {
    if (!roomId) {
      console.error('Invalid roomId');
      return;
    }
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit('user-connected', socket.id);

    // Handle offer from a user
    socket.on('offer', (data) => {
      socket.to(roomId).emit('offer', data);
    });

    // Handle answer from a user
    socket.on('answer', (data) => {
      socket.to(roomId).emit('answer', data);
    });

    // Handle ICE candidate from a user
    socket.on('candidate', (data) => {
      socket.to(roomId).emit('candidate', data);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected from room ${roomId}`);
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });
});

// Start the server on the port specified in the .env file
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});