import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate, createSchedulePackageSchema } from '../middleware/validationMiddleware';
import { createSchedulePackage, getSchedulePackages, updateSchedulePackage, deleteSchedulePackage, applySchedulePackage } from '../controllers/schedulePackageController';

const router = Router();

router.post('/', authMiddleware, validate(createSchedulePackageSchema), createSchedulePackage);
router.get('/', authMiddleware, getSchedulePackages);
router.put('/:id', authMiddleware, validate(createSchedulePackageSchema), updateSchedulePackage);
router.delete('/:id', authMiddleware, deleteSchedulePackage);
router.post('/apply-package', authMiddleware, applySchedulePackage);

export default router;