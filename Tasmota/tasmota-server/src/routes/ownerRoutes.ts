// src/routes/owner.routes.ts
import { Router } from 'express';
import { OwnerController } from '../controllers/owner.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ADMIN ONLY
router.get('/admin/all', authMiddleware, OwnerController.getAllOwners);           // List all with keys
router.post('/admin/create', authMiddleware, OwnerController.createOwner);        // Create from token
router.put('/admin/:id', authMiddleware, OwnerController.updateOwnerKeys);        // Admin update keys

// OWNER SELF
router.get('/me', authMiddleware, OwnerController.getMyProfile);                   // Owner sees own (no keys)
router.get('/findByID', authMiddleware, OwnerController.getMyProfile);             // Keep old endpoint

export default router;