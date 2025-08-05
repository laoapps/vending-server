import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { z } from 'zod';
import { createSchedulePackage, getSchedulePackages, applySchedulePackage } from '../controllers/schedulePackageController';

const router = Router();

const createSchedulePackageSchema = z.object({
  name: z.string().min(1),
  price: z.number().optional(),
  conditionType: z.string().min(1),
  conditionValue: z.number().min(1),
});

const applySchedulePackageSchema = z.object({
  packageId: z.number(),
  deviceId: z.number(),
});

router.post('/', authMiddleware, validate(createSchedulePackageSchema), createSchedulePackage);
router.get('/', authMiddleware, getSchedulePackages);
router.post('/apply', authMiddleware, validate(applySchedulePackageSchema), applySchedulePackage);

export default router;