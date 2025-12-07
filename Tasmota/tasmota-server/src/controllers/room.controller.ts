// src/controllers/room.controller.ts
import { Request, Response } from 'express';
import RoomModel from '../models/room.model';
import LocationModel from '../models/location.model';
import { Device } from '../models/device';
import Op from 'sequelize/types/operators';

export class RoomController {
    static async getByLocation(req: Request, res: Response) {
        try {
            const rooms = await RoomModel.findAll({
                where: { locationId: req.params.locationId },
                include: [{ model: LocationModel, as: 'location' }],
            });
            res.json(rooms);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const room = await RoomModel.findByPk(req.params.id, {
                include: [{ model: LocationModel, as: 'location' }],
            });
            if (!room) return res.status(404).json({ error: 'Room not found' });
            res.json(room);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
    // Add to your existing room.controller.ts
    static async getAllWithDevices(req: Request, res: Response) {
        const rooms = await RoomModel.findAll({
            include: [
                { model: LocationModel, as: 'location' },
                { model: Device, as: 'device' }
            ]
        });
        res.json(rooms);
    }

    static async assignDevice(req: Request, res: Response) {
        const { roomId, deviceId } = req.body;

        const room = await RoomModel.findByPk(roomId);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        // If assigning new device, make sure it's not used elsewhere
        if (deviceId) {
            const used = await RoomModel.findOne({ where: { deviceId, id: { [Op.ne]: roomId } } });
            if (used) return res.status(400).json({ error: 'Device already assigned to another room' });
        }

        await room.update({ deviceId });
        res.json({ success: true });
    }
    // src/controllers/room.controller.ts — add these
    static async getOwnerRoomsWithDevices(req: Request, res: Response) {
        const ownerUuid = res.locals.user.uuid;

        const rooms = await RoomModel.findAll({
            include: [
                { model: LocationModel, as: 'location' },
                { model: Device, as: 'device' }
            ],
            // Optional: filter by owner's locations if needed
        });
        res.json(rooms);
    }

    static async assignDeviceToRoom(req: Request, res: Response) {
        const { roomId, deviceId } = req.body;
        const ownerUuid = res.locals.user.uuid;

        const room = await RoomModel.findByPk(roomId);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        // Optional: check if room belongs to owner — add later if needed

        if (deviceId) {
            const used = await RoomModel.findOne({
                where: { deviceId, id: { [Op.ne]: roomId } }
            });
            if (used) return res.status(400).json({ error: 'Device already used in another room' });
        }

        await room.update({ deviceId });
        res.json({ success: true });
    }
}