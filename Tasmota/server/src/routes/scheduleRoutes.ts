import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate, createScheduleSchema } from '../middleware/validationMiddleware';
import { createSchedule, getSchedules, updateSchedule, deleteSchedule } from '../controllers/scheduleController';

const router = Router();

router.post('/', authMiddleware, validate(createScheduleSchema), createSchedule);
router.get('/', authMiddleware, getSchedules);
router.put('/:id', authMiddleware, validate(createScheduleSchema), updateSchedule);
router.delete('/:id', authMiddleware, deleteSchedule);

export default router;