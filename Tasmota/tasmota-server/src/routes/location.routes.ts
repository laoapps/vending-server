// src/routes/location.routes.ts
import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// PUBLIC
router.get('/', LocationController.getAll);
router.get('/:id', LocationController.getById);

// OWNER + ADMIN ONLY
router.post('/', authMiddleware, LocationController.create);           // CREATE
router.put('/:id', authMiddleware, LocationController.update);        // UPDATE
router.delete('/:id', authMiddleware, LocationController.delete);     // DELETE

export default router;