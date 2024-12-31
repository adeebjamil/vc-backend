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

app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://vc-client-coral.vercel.app']
}));

app.get('/room', (req, res) => {
  const roomId = uuidV4();
  res.json({ roomId });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join-room', (roomId) => {
    // Check if roomId is valid
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

server.listen(3001, () => {
  console.log('Server is running on port 3001');
});