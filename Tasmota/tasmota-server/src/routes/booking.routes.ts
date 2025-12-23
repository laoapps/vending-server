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
router.post('/owner/delete/:roomId', authMiddleware, BookingController.deletebookingsByRoomId);
router.get('/owner/loadlog', authMiddleware, BookingController.loadlog_deletebookingsByRoomId);
router.get('/owner/clearlog', authMiddleware, BookingController.clearlog_deletebookingsByRoomId);

// ADMIN
router.get('/admin', authMiddleware, BookingController.getAllBookings);
router.get('/admin/:locationid', authMiddleware, BookingController.getBookingsByLocation);


router.get('/summary/room/:roomId', authMiddleware, BookingController.getRoomSummary);
router.get('/summary/location/:locationId', authMiddleware, BookingController.getLocationSummary);
router.get('/summary/total', authMiddleware, BookingController.getTotalSummary);
export default router;