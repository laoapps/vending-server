import { Router } from 'express';
import { login, registerOwner } from '../controllers/authController';
import { validate, loginSchema, registerOwnerSchema } from '../middleware/validationMiddleware';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register-owner', validate(registerOwnerSchema), registerOwner);

export default router;