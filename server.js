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
    origin: [process.env.FRONTEND_URL, 'https://vc-client-coral.vercel.app'],
    methods: ["GET", "POST"]
  }
});

// CORS middleware to allow requests from the frontend
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://vc-client-coral.vercel.app']
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

// Start the server on port 3001
server.listen(3001, () => {
  console.log('Server is running on port 3001');
});