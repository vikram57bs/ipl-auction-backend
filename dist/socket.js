import { Server as SocketIOServer } from 'socket.io';
let io;
export const initializeSocket = (server) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: 'http://localhost:3000',
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
                const response = await fetch('http://localhost:4000/api/auction/state');
                const state = await response.json();
                socket.emit('auction:stateSnapshot', state);
            }
            catch (error) {
                console.error('Error sending state snapshot:', error);
            }
        });
    });
    return io;
};
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
//# sourceMappingURL=socket.js.map