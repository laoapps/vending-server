import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/bookings', authMiddleware, BookingController.create);
router.post('/bookings/pay', BookingController.payCallback);
router.get('/bookings/my', authMiddleware, BookingController.getMyBookings);

export default router;