import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { z } from 'zod';
import { createSchedulePackage, getSchedulePackages, applySchedulePackage } from '../controllers/schedulePackageController';

const router = Router();

const createSchedulePackageSchema = z.object({
  deviceId: z.number(),
  name: z.string().min(1),
  onDuration: z.number().min(1),
  offDuration: z.number().min(1),
  powerConsumption: z.number().optional(),
  price: z.number().optional(),
});

const applySchedulePackageSchema = z.object({
  packageId: z.number(),
});

router.post('/', authMiddleware, validate(createSchedulePackageSchema), createSchedulePackage);
router.get('/', authMiddleware, getSchedulePackages);
router.post('/apply', authMiddleware, validate(applySchedulePackageSchema), applySchedulePackage);

export default router;