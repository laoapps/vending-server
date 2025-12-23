// src/routes/room.routes.ts
import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// PUBLIC
router.get('/locations/:locationId', RoomController.getByLocation);
router.get('/:id', RoomController.getById);
// src/routes/room.routes.ts  ← add these two lines
router.put('/owner/update-type/:id', authMiddleware, RoomController.updateRoomType);
router.get('/owner/my-rooms', authMiddleware, RoomController.getMyRooms);
// OWNER + ADMIN ONLY
router.get('/owner/rooms', authMiddleware, RoomController.getOwnerRooms);
router.post('/owner/rooms', authMiddleware, RoomController.create);
router.put('/owner/rooms/:id', authMiddleware, RoomController.update);
router.delete('/owner/rooms/:id', authMiddleware, RoomController.delete);
router.post('/owner/rooms/assign-device', authMiddleware, RoomController.assignDeviceToRoom);
// Add these lines
router.get('/owner/locations', authMiddleware, RoomController.getOwnerLocations); // owner sees his locations + rooms
export default router;