import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };
};

export const loginSchema = z.object({
  phoneNumber: z.string().min(1),
});

export const registerOwnerSchema = z.object({
  phoneNumber: z.string().min(1),
});

export const createDeviceSchema = z.object({
  name: z.string().min(1),
  tasmotaId: z.string().min(1),
  zone: z.string().optional(),
});

export const controlDeviceSchema = z.object({
  deviceId: z.number(),
  command: z.string().min(1),
});

export const assignDeviceSchema = z.object({
  deviceId: z.number(),
  userPhoneNumber: z.string().min(1),
});

export const createGroupSchema = z.object({
  name: z.string().min(1),
});

export const assignDeviceToGroupSchema = z.object({
  groupId: z.number(),
  deviceId: z.number(),
});

export const createScheduleSchema = z.object({
  deviceId: z.number(),
  type: z.enum(['timer', 'conditional']),
  cron: z.string().optional(),
  command: z.string().min(1),
  conditionType: z.enum(['power_overload', 'energy_limit']).optional(),
  conditionValue: z.number().optional(),
});

export const createSchedulePackageSchema = z.object({
  name: z.string().min(1),
  durationMinutes: z.number().optional(),
  powerConsumptionWatts: z.number().optional(),
  price: z.number().optional(),
});