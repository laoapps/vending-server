import { Router } from 'express';
import { authHMVending, authMiddleware } from '../middleware/authMiddleware';
import { validate, createGroupSchema, assignDeviceToGroupSchema } from '../middleware/validationMiddleware';
import { createGroup, getGroups, updateGroup, deleteGroup, assignDeviceToGroup, loadAllGroups, getGroups_forAddDevice } from '../controllers/groupController';

const router = Router();

router.post('/', authMiddleware, validate(createGroupSchema), createGroup);
router.post('/loadAll', authMiddleware, loadAllGroups);


// router.post('/loadAll_', loadAllGroups);


router.get('/', authMiddleware, getGroups_forAddDevice);
router.post('/loadAllGroupsHMVending',authHMVending,getGroups);// for HMVENDING

router.put('/:id', authMiddleware, validate(createGroupSchema), updateGroup);
router.delete('/:id', authMiddleware, deleteGroup);
// router.post('/assign', authMiddleware, validate(assignDeviceToGroupSchema), assignDeviceToGroup);
router.post('/updateGroupPackage',authMiddleware,updateGroup)

export default router;