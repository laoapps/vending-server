import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import groupRoutes from './routes/groupRoutes';

import adminRoutes from './routes/adminRoutes';
import ownerRoutes from './routes/ownerRoutes';
import schedulePackageRoutes from './routes/schedulePackageRoutes';
import unregisteredDeviceRoutes from './routes/unregisteredDeviceRoutes';
import orderRoutes from './routes/orderRoutes';

import { errorHandler } from './middleware/errorMiddleware';
import bookingRoutes from './routes/booking.routes';
import { authMiddleware } from './middleware/authMiddleware';
import locationRoutes from './routes/location.routes';
import roomRoutes from './routes/room.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Tasmota API - smartcb-api.laoapps.com');
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/schedule-packages', schedulePackageRoutes);
app.use('/api/unregistered-devices', unregisteredDeviceRoutes);
app.use('/api/orders', orderRoutes)
// NEW: Hotel/Booking Routes


// Add these lines
app.use('/api/locations', locationRoutes);
app.use('/api/rooms', roomRoutes);
// NEW: User Schedules Endpoint (missing before)
// app.get('/api/schedules/my', authMiddleware, async (req, res) => {
//   try {
//     const userId = res.locals.user?.uuid;
//     const schedules = await sequelize.models.Schedule.findAll({
//       where: { userId }, // Or via device.userId
//       include: [sequelize.models.Device, sequelize.models.SchedulePackage],
//     });
//     res.json(schedules);
//   } catch (err:any) {
//     res.status(500).json({ error: err.message });
//   }
// });
// app.use('/api/locations', locationRoutes);
// app.use('/api/rooms', roomRoutes);           // optional, if you want /rooms/:id
app.use('/api/bookings', bookingRoutes);
// NEW: QR Payment
// app.post('/api/payments/qr', authMiddleware, async (req, res) => {
//   const { bookingId, amount } = req.body;
//   const qrData = JSON.stringify({ id: bookingId, amount, token: req.headers.authorization?.split(' ')[1] });
//   res.json({ qrCode: qrData });
// });
// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.use(errorHandler);



import { logToFile, listLogs, readLog, deleteLog } from './services/logger';

// API to write a log (e.g., POST /api/logs with { "message": "My log" } in body)
app.post('/api/logs', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  try {
    await logToFile(message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write log' });
  }
});

// API to list all log files (GET /api/logs)
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await listLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list logs' });
  }
});

// API to read a specific log file (GET /api/logs/:fileName)
app.get('/api/logs/:fileName', async (req, res) => {
  const { fileName } = req.params;
  try {
    const content = await readLog(fileName);
    res.send(content); // Send as plain text for easy viewing
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// API to delete a specific log file (DELETE /api/logs/:fileName)
app.delete('/api/logs/:fileName', async (req, res) => {
  const { fileName } = req.params;
  try {
    await deleteLog(fileName);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});


export default app;