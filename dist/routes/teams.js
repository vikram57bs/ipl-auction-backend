import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
const router = Router();
const prisma = new PrismaClient();
router.get('/summary', authenticate, async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                players: true,
            },
        });
        const summaries = teams.map((team) => ({
            id: team.id,
            name: team.name,
            initialBudget: team.initialBudget,
            remainingBudget: team.remainingBudget,
            spent: team.initialBudget - team.remainingBudget,
            playersCount: team.players.length,
        }));
        res.json(summaries);
    }
    catch (error) {
        console.error('Get teams summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/squad', authenticate, async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                players: {
                    orderBy: { soldPrice: 'desc' },
                },
            },
        });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const totalSpent = team.initialBudget - team.remainingBudget;
        res.json({
            id: team.id,
            name: team.name,
            players: team.players,
            remainingBudget: team.remainingBudget,
            totalSpent,
            playersCount: team.players.length,
        });
    }
    catch (error) {
        console.error('Get team squad error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/analytics', authenticate, async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                players: true,
            },
        });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const roleDistribution = team.players.reduce((acc, player) => {
            acc[player.role] = (acc[player.role] || 0) + 1;
            return acc;
        }, {});
        const spendByRole = team.players.reduce((acc, player) => {
            acc[player.role] = (acc[player.role] || 0) + (player.soldPrice || 0);
            return acc;
        }, {});
        const sortedPlayers = [...team.players].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));
        const highestBuy = sortedPlayers[0] || null;
        const lowestBuy = sortedPlayers[sortedPlayers.length - 1] || null;
        const totalSpent = team.initialBudget - team.remainingBudget;
        const averageSpend = team.players.length > 0
            ? totalSpent / team.players.length
            : 0;
        res.json({
            roleDistribution,
            spendByRole,
            highestBuy,
            lowestBuy,
            averageSpend,
            totalSpent,
            playersCount: team.players.length,
        });
    }
    catch (error) {
        console.error('Get team analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=teams.js.map