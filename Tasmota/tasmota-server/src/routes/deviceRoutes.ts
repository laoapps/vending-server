import { Router } from 'express';
import { authHMVending, authMiddleware } from '../middleware/authMiddleware';
import { validate, createDeviceSchema, controlDeviceSchema, assignDeviceSchema } from '../middleware/validationMiddleware';
import { createDevice, getDevices, updateDevice, deleteDevice, controlDevice, clearDeviceRule, getDevicesBy, getDevicesByHMVending, controlDeviceByOrder, deleteDeviceForAdmin, controlDeviceForAdmin, updateDeviceForAdmin } from '../controllers/deviceController';

const router = Router();

router.post('/', authMiddleware, validate(createDeviceSchema), createDevice);

// both admin and owner
router.get('/:dtype', authMiddleware, getDevices);

// owner only 
// ownerId: data.ownerId,
// data.groupId,
// data.dtype 
router.post('/getDevicesBy', authMiddleware, getDevicesBy);


router.post('/getDevicesByHMVending',authHMVending, getDevicesByHMVending);

router.put('/:id', authMiddleware, validate(createDeviceSchema), updateDevice);
router.put('/admin/:id', authMiddleware, validate(createDeviceSchema), updateDeviceForAdmin);

router.delete('/:id', authMiddleware, deleteDevice);
router.delete('/admin/:id', authMiddleware, deleteDeviceForAdmin);


router.post('/control', authMiddleware, validate(controlDeviceSchema), controlDevice);
router.post('/admin/control', authMiddleware, validate(controlDeviceSchema), controlDeviceForAdmin);

// both admin and owner
router.post('/clearDeviceRule', authMiddleware, clearDeviceRule);



router.post('/controlbyorder/:id', authMiddleware, controlDeviceByOrder);
router.post('/controlbyorder_hmvending/:id', authHMVending, controlDeviceByOrder);



export default router;