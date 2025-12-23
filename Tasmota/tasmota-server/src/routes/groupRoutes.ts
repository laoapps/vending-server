import { Router } from 'express';
import { authHMVending, authMiddleware } from '../middleware/authMiddleware';
import { validate, createGroupSchema } from '../middleware/validationMiddleware';
import { createGroup, getGroups, updateGroup, deleteGroup, loadAllGroups, getGroups_forAddDevice, activateGroup } from '../controllers/groupController';

const router = Router();

router.post('/', authMiddleware, validate(createGroupSchema), createGroup);
router.post('/loadAll', authMiddleware, loadAllGroups);


// router.post('/loadAll_', loadAllGroups);


router.get('/', authMiddleware, getGroups_forAddDevice);
router.post('/loadAllGroupsHMVending',authHMVending,getGroups);// for HMVENDING

router.put('/:id', authMiddleware, validate(createGroupSchema), updateGroup);
router.put('/activate/:id', authMiddleware, activateGroup);

router.delete('/:id', authMiddleware, deleteGroup);
// router.post('/assign', authMiddleware, validate(assignDeviceToGroupSchema), assignDeviceToGroup);
// router.post('/updateGroupPackage',authMiddleware,updateGroup)

export default router;