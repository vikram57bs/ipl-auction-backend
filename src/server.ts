import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/players.js';
import auctionRoutes from './routes/auction.js';
import teamRoutes from './routes/teams.js';

const app = express();
const server = createServer(app);

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/teams', teamRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

initializeSocket(server);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
