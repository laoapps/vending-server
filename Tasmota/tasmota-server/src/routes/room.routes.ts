// src/routes/room.routes.ts
import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// PUBLIC
router.get('/locations/:locationId/rooms', RoomController.getByLocation);
router.get('/rooms/:id', RoomController.getById);

// OWNER + ADMIN ONLY
router.get('/owner/rooms', authMiddleware, RoomController.getOwnerRooms);
router.post('/owner/rooms', authMiddleware, RoomController.create);
router.put('/owner/rooms/:id', authMiddleware, RoomController.update);
router.delete('/owner/rooms/:id', authMiddleware, RoomController.delete);
router.post('/owner/rooms/assign-device', authMiddleware, RoomController.assignDeviceToRoom);

export default router;