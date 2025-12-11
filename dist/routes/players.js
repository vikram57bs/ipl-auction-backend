import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
const prisma = new PrismaClient();
router.get('/unsold', authenticate, requireRole('MANAGER'), async (req, res) => {
    try {
        const { search, role } = req.query;
        const where = { status: 'UNSOLD' };
        if (search && typeof search === 'string') {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (role && typeof role === 'string' && role !== 'all') {
            where.role = role;
        }
        const players = await prisma.player.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        res.json(players);
    }
    catch (error) {
        console.error('Get unsold players error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/all', authenticate, async (req, res) => {
    try {
        const players = await prisma.player.findMany({
            include: {
                soldToTeam: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(players);
    }
    catch (error) {
        console.error('Get all players error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=players.js.map