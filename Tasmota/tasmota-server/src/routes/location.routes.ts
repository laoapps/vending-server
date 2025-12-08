import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';

const router = Router();

router.get('/hotels/locations', LocationController.getAll);
router.get('/hotels/locations/:id', LocationController.getById);

export default router;