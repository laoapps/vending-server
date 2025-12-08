import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/bookings', authMiddleware, BookingController.create);
router.post('/bookings/pay', BookingController.payCallback);
router.get('/bookings/my', authMiddleware, BookingController.getMyBookings);
//owner
router.get('/bookings/owner', authMiddleware, BookingController.getMyBookings);

//admin
router.get('/bookings/admin', authMiddleware, BookingController.getMyBookings);
router.get('/bookings/admin/:locationid', authMiddleware, BookingController.getMyBookings);




export default router;