
import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Meeting from './models/Meeting';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.get('/api/meetings', authenticateToken, async (req: any, res: Response) => {
  const meetings = await Meeting.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(meetings);
});

app.post('/api/meetings/create', authenticateToken, async (req: any, res: Response) => {
  const meetingId = Math.random().toString(36).substring(2, 15);
  const newMeeting = new Meeting({
    userId: req.user.id,
    meetingId,
    title: req.body.title || 'Untitled Meeting',
    isActive: true,
    participants: [req.user.name]
  });
  await newMeeting.save();
  res.status(201).json(newMeeting);
});

// Socket.io Signaling Logic
const usersInRooms: Record<string, string[]> = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    
    if (!usersInRooms[roomId]) {
      usersInRooms[roomId] = [];
    }
    
    // Notify others that a new user has joined
    socket.to(roomId).emit('user-connected', { peerId: socket.id, userName });
    
    // Send list of existing users to the newcomer
    socket.emit('all-users', usersInRooms[roomId]);
    
    usersInRooms[roomId].push(socket.id);
    
    socket.on('disconnect', () => {
      usersInRooms[roomId] = usersInRooms[roomId].filter(id => id !== socket.id);
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });

  socket.on('sending-signal', (payload) => {
    io.to(payload.userToSignal).emit('user-joined', {
      signal: payload.signal,
      callerId: payload.callerId,
      userName: payload.userName
    });
  });

  socket.on('returning-signal', (payload) => {
    io.to(payload.callerId).emit('receiving-returned-signal', {
      signal: payload.signal,
      id: socket.id
    });
  });

  socket.on('chat-message', (payload) => {
    io.to(payload.roomId).emit('message', payload);
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => {
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
