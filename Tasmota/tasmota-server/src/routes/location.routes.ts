// src/routes/location.routes.ts
import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// PUBLIC
router.get('/locations', LocationController.getAll);
router.get('/locations/:id', LocationController.getById);

// OWNER + ADMIN ONLY
router.post('/locations', authMiddleware, LocationController.create);           // CREATE
router.put('/locations/:id', authMiddleware, LocationController.update);        // UPDATE
router.delete('/locations/:id', authMiddleware, LocationController.delete);     // DELETE

export default router;