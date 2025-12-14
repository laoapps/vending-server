// src/routes/location.routes.ts
import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// PUBLIC - anyone can list (but owners see only theirs)
router.get('/', LocationController.getAll);

// PUBLIC - get one location
router.get('/:id', LocationController.getById);

// ADMIN ONLY
router.post('/', authMiddleware, LocationController.create);
router.put('/:id', authMiddleware, LocationController.update);
router.delete('/:id', authMiddleware, LocationController.delete);

// ADMIN ONLY - assign owner to location
router.patch('/:id/assign-owner', authMiddleware, LocationController.assignOwner);

export default router;