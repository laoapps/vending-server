import { Router } from 'express';
import { registerOwner } from '../controllers/authController';

const router = Router();

router.post('/register-owner', registerOwner);

export default router;