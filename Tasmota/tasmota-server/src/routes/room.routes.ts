import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/locations/:locationId/rooms', RoomController.getByLocation);
router.get('/locations/rooms/:id', RoomController.getById);
// router.get('/rooms/with-devices', authMiddleware, RoomController.getAllWithDevices);
// router.post('/rooms/assign-device', authMiddleware, RoomController.assignDevice);
// src/routes/room.routes.ts
router.get('/owner/rooms', authMiddleware, RoomController.getOwnerRoomsWithDevices);
router.post('/owner/rooms/assign-device', authMiddleware, RoomController.assignDeviceToRoom);

// crud
router.get('/owner/rooms/create', authMiddleware, RoomController.getOwnerRoomsWithDevices);
router.get('/owner/rooms/update/:id', authMiddleware, RoomController.getOwnerRoomsWithDevices);

router.get('/owner/rooms/delete/:id', authMiddleware, RoomController.getOwnerRoomsWithDevices);

export default router;