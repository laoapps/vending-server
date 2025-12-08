// src/routes/booking.routes.ts
import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// USER
router.post('/bookings', authMiddleware, BookingController.create);
router.post('/bookings/pay', BookingController.payCallback); // no auth — bank calls this
router.get('/bookings/my', authMiddleware, BookingController.getMyBookings);

// OWNER
router.get('/bookings/owner', authMiddleware, BookingController.getOwnerBookings);

// ADMIN
router.get('/bookings/admin', authMiddleware, BookingController.getAllBookings);
router.get('/bookings/admin/:locationid', authMiddleware, BookingController.getBookingsByLocation);

export default router;