import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { getIO } from '../socket.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/current', authenticate, requireRole('MANAGER'), async (req, res) => {
  try {
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID required' });
    }

    const existingInAuction = await prisma.player.findFirst({
      where: { status: 'IN_AUCTION' },
    });

    if (existingInAuction) {
      await prisma.player.update({
        where: { id: existingInAuction.id },
        data: { status: 'UNSOLD' },
      });
    }

    const player = await prisma.player.update({
      where: { id: playerId },
      data: { status: 'IN_AUCTION' },
    });

    const io = getIO();
    io.emit('auction:currentPlayerUpdated', player);

    res.json(player);
  } catch (error) {
    console.error('Set current player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sell', authenticate, requireRole('MANAGER'), async (req, res) => {
  try {
    const { teamId, amount } = req.body;

    if (!teamId || !amount) {
      return res.status(400).json({ error: 'Team ID and amount required' });
    }

    const currentPlayer = await prisma.player.findFirst({
      where: { status: 'IN_AUCTION' },
    });

    if (!currentPlayer) {
      return res.status(400).json({ error: 'No player currently in auction' });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.remainingBudget < amount) {
      return res.status(400).json({ error: 'Insufficient team budget' });
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: currentPlayer.id },
      data: {
        status: 'SOLD',
        soldPrice: amount,
        soldToTeamId: teamId,
      },
    });

    await prisma.team.update({
      where: { id: teamId },
      data: {
        remainingBudget: team.remainingBudget - amount,
      },
    });

    const transaction = await prisma.auctionTransaction.create({
      data: {
        playerId: currentPlayer.id,
        teamId,
        amount,
      },
      include: {
        player: true,
        team: true,
      },
    });

    const io = getIO();
    io.emit('auction:playerSold', {
      player: updatedPlayer,
      team,
      amount,
      timestamp: transaction.createdAt,
    });

    res.json({
      player: updatedPlayer,
      transaction,
    });
  } catch (error) {
    console.error('Sell player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/state', authenticate, async (req, res) => {
  try {
    const currentPlayer = await prisma.player.findFirst({
      where: { status: 'IN_AUCTION' },
    });

    const teams = await prisma.team.findMany({
      include: {
        players: true,
      },
    });

    const recentTransactions = await prisma.auctionTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        player: true,
        team: true,
      },
    });

    const highestBuys = await prisma.player.findMany({
      where: { status: 'SOLD' },
      orderBy: { soldPrice: 'desc' },
      take: 5,
      include: {
        soldToTeam: true,
      },
    });

    const teamSummaries = teams.map((team) => ({
      id: team.id,
      name: team.name,
      playersCount: team.players.length,
      remainingBudget: team.remainingBudget,
      spent: team.initialBudget - team.remainingBudget,
    }));

    res.json({
      currentPlayer,
      teamSummaries,
      recentTransactions,
      highestBuys,
    });
  } catch (error) {
    console.error('Get auction state error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
