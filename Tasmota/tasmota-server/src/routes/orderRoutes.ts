import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { createOrder, getOrders, getOrderById, payOrder, completeOrder, testOrder, createOrderFromVending } from '../controllers/orderController';
import { reactivateOrder } from '../controllers/reactivateOrderController';

const router = Router();

router.post('/', authMiddleware, createOrder); // Create order (user only)
router.post('/newOrderFromVending', createOrderFromVending); // Create order (user only)
router.post('/list', authMiddleware, getOrders); // List user orders
router.get('/:id', authMiddleware, getOrderById); // Get specific order (user only)
router.post('/pay', payOrder); // Payment callback
router.post('/complete', completeOrder); // MQTT completion
router.post('/reactivate', authMiddleware, reactivateOrder); // Reactivate order with compensation


router.post('/testneworder', authMiddleware, testOrder); // Create order (user only)

export default router;