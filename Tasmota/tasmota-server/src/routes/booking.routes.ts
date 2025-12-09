// src/routes/booking.routes.ts
import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// USER
router.post('/', authMiddleware, BookingController.create);
router.post('/pay', BookingController.payCallback); // no auth
router.get('/my', authMiddleware, BookingController.getMyBookings);

// OWNER
router.get('/owner', authMiddleware, BookingController.getOwnerBookings);

// ADMIN
router.get('/admin', authMiddleware, BookingController.getAllBookings);
router.get('/admin/:locationid', authMiddleware, BookingController.getBookingsByLocation);

export default router;