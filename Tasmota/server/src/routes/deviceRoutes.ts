import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate, createDeviceSchema, controlDeviceSchema, assignDeviceSchema } from '../middleware/validationMiddleware';
import { createDevice, getDevices, updateDevice, deleteDevice, controlDevice, clearDeviceRule, getDevicesBy } from '../controllers/deviceController';

const router = Router();

router.post('/', authMiddleware, validate(createDeviceSchema), createDevice);
router.get('/', authMiddleware, getDevices);
router.post('/getDevicesBy', authMiddleware, getDevicesBy);
router.post('/getDevicesBy_', getDevicesBy);
router.put('/:id', authMiddleware, validate(createDeviceSchema), updateDevice);
router.delete('/:id', authMiddleware, deleteDevice);
router.post('/control', authMiddleware, validate(controlDeviceSchema), controlDevice);
router.post('/clearDeviceRule', authMiddleware, clearDeviceRule);


export default router;