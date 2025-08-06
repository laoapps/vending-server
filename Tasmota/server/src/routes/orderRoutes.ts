import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { completeOrder, createOrder, getOrderById,  getOrders, payOrder } from '../controllers/orderController';
const router = Router();

router.post('/', authMiddleware, createOrder); // for user only
router.post('/', authMiddleware, getOrders); // for user only
router.get('/:id', authMiddleware,  getOrderById); // for user only
router.post('/pay', payOrder ); // for Callback
router.post('/complete', completeOrder ); // for MQTT


export default router;