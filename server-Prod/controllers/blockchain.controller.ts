import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { MachineBlockchainValueEntity, dbConnection } from '../entities'; // your entity
import { redisClient } from '../services/service';
import { v4 as uuidv4 } from 'uuid';
import { MachineClientIDFactory } from '../entities/machineclientid.entity';
import { EEntity } from '../entities/system.model';

// ==================== SERVICE LOGIC (inside controller - as you want) ====================

export interface ValueTransaction {
  ts: string;
  type: 'add' | 'deduct' | 'clear' | 'redeem';
  amount: number;
  previousValue: number;
  newValue: number;
  note?: string;
  actor?: string;
  hash: string;
}

export const findOrCreateValueRecord = async (machineId: string, ownerUuid: string) => {
  let record = await MachineBlockchainValueEntity.findOne({ where: { machineId, ownerUuid } });
  if (!record) {
    record = await MachineBlockchainValueEntity.create({
      machineId,
      ownerUuid,
      value: 0,
      data: { transactions: [], lastHash: '' },
    });
  }
  return record;
};
export const addValue = (m: string, o: string, amt: number, note?: string, actor?: string) =>
  applyChange(m, o, amt, 'add', note, actor);

export const deductValue = (m: string, o: string, amt: number, note?: string, actor?: string) =>
  applyChange(m, o, amt, 'deduct', note, actor);

export const clearValueToZero = async (m: string, o: string, note?: string, actor?: string) => {
  const record = await findOrCreateValueRecord(m, o);
  const current = getRecordValue(record);
  if (current === 0) {
    return { success: true, machineId: m, ownerUuid: o, previousValue: 0, newValue: 0, amount: 0, type: 'clear', txHash: (record.data as any)?.lastHash || '', recordId: record.id };
  }
  return applyChange(m, o, current, 'clear', note, actor);
};

// ==================== CONTROLLER HANDLERS ====================

export const addValueHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineId, ownerUuid, amount, note, actor } = req.body;
    if (!machineId || !ownerUuid || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, error: 'machineId, ownerUuid and positive amount required' });
    }
    const result = await addValue(machineId, ownerUuid, amount, note, actor || `api:${req.ip}`);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deductValueHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineId, ownerUuid, amount, note, actor } = req.body;
    if (!machineId || !ownerUuid || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, error: 'machineId, ownerUuid and positive amount required' });
    }
    const result = await deductValue(machineId, ownerUuid, amount, note, actor || `api:${req.ip}`);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const clearValueHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineId, ownerUuid, note, actor } = req.body;
    if (!machineId || !ownerUuid) {
      return res.status(400).json({ success: false, error: 'machineId and ownerUuid required' });
    }
    const result = await clearValueToZero(machineId, ownerUuid, note, actor || `api:${req.ip}`);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const generateQrCouponHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineId, ownerUuid, url, ttlSeconds = 3600 } = req.body;
    if (!machineId || !ownerUuid) {
      return res.status(400).json({ success: false, error: 'machineId and ownerUuid required' });
    }

    const uuid = uuidv4();
    const baseUrl = process.env.REDEEM_BASE_URL || 'https://api.yourdomain.com';
    const finalUrl = url || `${baseUrl}/coupon/redeem-coupon?uuid=${uuid}`;

    const payload = {
      type: 'vendingChange',
      uuid,
      url: finalUrl,
      machineId,
      ownerUuid,
      generatedAt: new Date().toISOString(),
    };

    // Use your existing redisClient
    await redisClient.setex(`vendingChange:${uuid}`, ttlSeconds, JSON.stringify(payload));

    res.json({ success: true, qr: payload });
  } catch (err) {
    next(err);
  }
};

export const redeemCouponHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uuid, token } = req.body;
    if (!uuid || !token) {
      return res.status(400).json({ success: false, error: 'uuid and token are required' });
    }

    // === TODO: Replace with your real token verification ===
    let ownerUuidFromToken: string;
    try {
      if (token.startsWith('owner_')) {
        ownerUuidFromToken = token.replace('owner_', '');
      } else if (token.includes('.')) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        ownerUuidFromToken = payload.ownerUuid || payload.sub;
      } else {
        throw new Error('Invalid token format');
      }
    } catch (e: any) {
      return res.status(401).json({ success: false, error: 'Unauthorized: ' + e.message });
    }

    // === Real Redis lookup (fixed) ===
    const qrDataRaw = await redisClient.get(`vendingChange:${uuid}`);
    if (!qrDataRaw) {
      return res.status(404).json({ success: false, error: 'QR expired or already used' });
    }
    const qrData = JSON.parse(qrDataRaw);
    const machineId = qrData.machineId;

    const record = await findOrCreateValueRecord(machineId, ownerUuidFromToken);
    if (!record || record.ownerUuid !== ownerUuidFromToken) {
      return res.status(403).json({ success: false, error: 'Forbidden: owner mismatch' });
    }

    const previousValue = typeof record.value === 'string' ? parseFloat(record.value) : (record.value || 0);

    const clearResult = await clearValueToZero(
      machineId,
      ownerUuidFromToken,
      `Redeemed via QR ${uuid}`,
      `thirdparty:${ownerUuidFromToken}`
    );

    await redisClient.del(`vendingChange:${uuid}`);

    const result = {
      success: true,
      uuid,
      machineId,
      ownerUuid: ownerUuidFromToken,
      clearedValue: previousValue,
      previousValue,
      redeemedAt: new Date().toISOString(),
      txHash: clearResult.txHash,
    };

    // === Your callback goes here ===
    console.log('[Redeem] Callback URL:', qrData.url);
    console.log('[Redeem] Result:', result);

    res.json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getValueHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { machineId, ownerUuid } = req.query as any;
    if (!machineId || !ownerUuid) {
      return res.status(400).json({ success: false, error: 'machineId and ownerUuid required' });
    }
    const record = await findOrCreateValueRecord(machineId, ownerUuid);
    res.json({
      success: true,
      machineId,
      ownerUuid,
      currentValue: typeof record.value === 'string' ? parseFloat(record.value) : record.value,
      data: record.data,
      updatedAt: record.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};






//// internal
const computeHash = (prevHash: string, tx: Omit<ValueTransaction, 'hash'>): string => {
  return crypto.createHash('sha256').update(prevHash + JSON.stringify(tx)).digest('hex');
};

const getRecordValue = (record: any): number => {
  const v = record?.value;
  return typeof v === 'string' ? parseFloat(v) : (v || 0);
};



const applyChange = async (
  machineId: string,
  ownerUuid: string,
  amount: number,
  type: 'add' | 'deduct' | 'clear' | 'redeem',
  note = '',
  actor = 'system'
) => {
  const record = await findOrCreateValueRecord(machineId, ownerUuid);
  const previousValue = getRecordValue(record);
  let newValue = previousValue;

  if (type === 'add') newValue = previousValue + amount;
  else if (['deduct', 'clear', 'redeem'].includes(type)) newValue = Math.max(0, previousValue - amount);

  const data = (record.data as any) || {};
  const prevHash = data.lastHash || '';
  const txBase: Omit<ValueTransaction, 'hash'> = {
    ts: new Date().toISOString(),
    type,
    amount,
    previousValue,
    newValue,
    note: note || type,
    actor,
  };
  const hash = computeHash(prevHash, txBase);

  const newTx: ValueTransaction = { ...txBase, hash };
  const transactions = [...(data.transactions || []), newTx];

  await record.update({
    value: newValue,
    data: { ...data, transactions, lastHash: hash },
    updatedAt: new Date(),
  });

  return { success: true, machineId, ownerUuid, previousValue, newValue, amount, type, txHash: hash, recordId: record.id };
};

