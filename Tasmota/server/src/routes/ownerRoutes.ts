import { Router,Response ,Request} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const user = res.locals.user;
  if (user.role !== 'admin') {
     res.status(403).json({ error: 'Admin access required' });
     return;
  }

  try {
    const owners = await prisma.owner.findMany({ include: { devices: true } });
    res.json(owners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch owners' });
  }
});

export default router;