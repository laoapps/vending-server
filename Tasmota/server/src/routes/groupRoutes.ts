import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate, createGroupSchema, assignDeviceToGroupSchema } from '../middleware/validationMiddleware';
import { createGroup, getGroups, updateGroup, deleteGroup, assignDeviceToGroup, loadAllGroups } from '../controllers/groupController';

const router = Router();

router.post('/', authMiddleware, validate(createGroupSchema), createGroup);
router.post('/loadAll', authMiddleware, loadAllGroups);
router.get('/', authMiddleware, getGroups);
router.put('/:id', authMiddleware, validate(createGroupSchema), updateGroup);
router.delete('/:id', authMiddleware, deleteGroup);
router.post('/assign', authMiddleware, validate(assignDeviceToGroupSchema), assignDeviceToGroup);

export default router;