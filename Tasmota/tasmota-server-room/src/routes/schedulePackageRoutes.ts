import { Router } from 'express';
import { authHMVending, authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { z } from 'zod';
import { createSchedulePackage, deleteSchedulePackage, findByOwnerID, findByOwnerIDHMVending, findByPackageIDs, findByPackageIDsHMVending, getSchedulePackages, updateSchedulePackage } from '../controllers/schedulePackageController';

const router = Router();

const createSchedulePackageSchema = z.object({
  name: z.string().min(1),
  price: z.number().optional(),
  conditionType: z.string().min(1),
  conditionValue: z.number().min(1),
});

router.post('/', authMiddleware, validate(createSchedulePackageSchema), createSchedulePackage);
router.post('/findByPackageIDs', authMiddleware, findByPackageIDs);
router.get('/findByOwnerID/:id', authMiddleware, findByOwnerID);
router.get('/findByOwnerIDHMVending',authHMVending, findByOwnerIDHMVending);
router.post('/findByPackageIDsHMVending',authHMVending, findByPackageIDsHMVending);
router.put('/:id', authMiddleware, validate(createSchedulePackageSchema), updateSchedulePackage);
router.get('/', authMiddleware, getSchedulePackages);
router.delete('/:id', authMiddleware, deleteSchedulePackage);


export default router;