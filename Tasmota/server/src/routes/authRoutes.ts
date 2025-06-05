import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { registerOwner, getUserRole } from '../controllers/authController';

const router = Router();

router.post('/register-owner', registerOwner);
router.get('/role', authMiddleware, getUserRole);

export default router;