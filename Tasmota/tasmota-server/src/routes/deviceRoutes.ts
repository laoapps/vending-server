import { Router } from 'express';
import { authHMVending, authMiddleware } from '../middleware/authMiddleware';
import { validate, createDeviceSchema, controlDeviceSchema, assignDeviceSchema } from '../middleware/validationMiddleware';
import { createDevice, getDevices, updateDevice, deleteDevice, controlDevice, clearDeviceRule, getDevicesBy, getDevicesByHMVending, controlDeviceByOrder } from '../controllers/deviceController';

const router = Router();

router.post('/', authMiddleware, validate(createDeviceSchema), createDevice);
router.get('/:dtype', authMiddleware, getDevices);
router.post('/getDevicesBy', authMiddleware, getDevicesBy);
router.post('/getDevicesByHMVending',authHMVending, getDevicesByHMVending);
router.put('/:id', authMiddleware, validate(createDeviceSchema), updateDevice);
router.delete('/:id', authMiddleware, deleteDevice);
router.post('/control', authMiddleware, validate(controlDeviceSchema), controlDevice);
router.post('/clearDeviceRule', authMiddleware, clearDeviceRule);


router.post('/controlbyorder/:id', authMiddleware, controlDeviceByOrder);
router.post('/controlbyorder_hmvending/:id', authHMVending, controlDeviceByOrder);



export default router;