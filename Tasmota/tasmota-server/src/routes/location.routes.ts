import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';

const router = Router();

router.get('/hotels/locations', LocationController.getAll);
router.get('/hotels/locations/:id', LocationController.getById);


router.get('/hotels/locations/create',, LocationController.getAll);
router.get('/hotels/locations/update/:id',, LocationController.getById);
router.get('/hotels/locations/delete/:id',, LocationController.getById);

export default router;