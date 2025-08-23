import { Router } from 'express';
import { authHMVending, authMiddleware } from '../middleware/authMiddleware';
import { createOrder, getOrders, getOrderById, payOrder, completeOrder, testOrder, getOrderByIdHMVending, getActiveOrdersByDeviceID } from '../controllers/orderController';
import { reactivateOrder } from '../controllers/reactivateOrderController';

const router = Router();

router.post('/', authMiddleware, createOrder); // Create order (user only)
router.post('/hmvending', authHMVending, createOrderHMVending); // Create order (owner only) HMVENDING

router.post('/list', authMiddleware, getOrders); // List user orders
router.post('/listHMVending', authHMVending, getOrders); // List user orders
router.post('/getActiveOrdersByDeviceID/:id', authMiddleware, getActiveOrdersByDeviceID); // for owner
router.get('/:id', authMiddleware, getOrderById); // Get specific order (user only)
router.get('/hmvending/:id', authHMVending, getOrderByIdHMVending); // Get specific order (HMVending only)

router.post('/pay', payOrder); // Payment callback
router.post('/complete', completeOrder); // MQTT completion
router.post('/reactivate', authMiddleware, reactivateOrder); // Reactivate order with compensation


router.post('/testneworder', authMiddleware, testOrder); // Create order (user only)

export default router;