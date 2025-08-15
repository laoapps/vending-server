import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getAllData } from '../controllers/adminController';

const router = Router();

router.get('/', authMiddleware, getAllData);

export default router;