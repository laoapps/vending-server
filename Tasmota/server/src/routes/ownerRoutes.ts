import { Router ,Request,Response} from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import models from '../models';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const user = res.locals.user;

  try {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const owners = await models.Owner.findAll({
      include: [
        { model: models.Device, as: 'devices', include: [{ model: models.DeviceGroup, as: 'deviceGroup' }] },
        { model: models.DeviceGroup, as: 'groups' },
      ],
    });

    res.json(owners);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to fetch owners' });
  }
});

export default router;