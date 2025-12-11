import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: 'https://ipl-auction-frontend-one.vercel.app',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('request:state', async () => {
      try {
        const response = await fetch('https://ipl-auction-frontend-one.vercel.app/auction/state');
        const state = await response.json();
        socket.emit('auction:stateSnapshot', state);
      } catch (error) {
        console.error('Error sending state snapshot:', error);
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
