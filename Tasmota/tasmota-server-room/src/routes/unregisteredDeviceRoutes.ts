import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getUnregisteredDevices, banUnregisteredDevice, unbanUnregisteredDevice } from '../controllers/unregisteredDeviceController';

const router = Router();

router.get('/', authMiddleware, getUnregisteredDevices);
router.put('/:id/ban', authMiddleware, banUnregisteredDevice);
router.put('/:id/unban', authMiddleware, unbanUnregisteredDevice);

export default router;