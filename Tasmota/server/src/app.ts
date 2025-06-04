import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import groupRoutes from './routes/groupRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import adminRoutes from './routes/adminRoutes';
import ownerRoutes from './routes/ownerRoutes';
import schedulePackageRoutes from './routes/schedulePackageRoutes';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Tasmota API - smartcb-api.laoapps.com');
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/schedule-packages', schedulePackageRoutes);

app.use(errorHandler);

export default app;