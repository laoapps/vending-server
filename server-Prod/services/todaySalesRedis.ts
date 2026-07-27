import Redis from 'ioredis';
import momenttz from 'moment-timezone';
import * as WebSocketServer from 'ws';
import { Op } from 'sequelize';
import { dbConnection } from '../entities';
import { EEntity, EMessage, EPaymentStatus } from '../entities/system.model';
import { VendingMachineBillFactory } from '../entities/vendingmachinebill.entity';
import { redisClient, redisHost, redisPort, wsSendAdmins } from './service';

export const SALES_UPDATE_CHANNEL = 'sales_update';

export interface TodaySalesUpdatePayload {
    ownerUuid: string;
    machineId: string;
    qtyToday: number;
    amountToday: number;
    timestamp: string;
}

export interface MachineOwnerRef {
    machineId: string;
    ownerUuid: string;
}

export function getSalesDateKey(timeZone: string): string {
    return momenttz.tz(timeZone).format('YYYY-MM-DD');
}

export function salesQtyKey(ownerUuid: string, machineId: string, date: string): string {
    return `sales:${ownerUuid}:${machineId}:qty:${date}`;
}

export function salesAmountKey(ownerUuid: string, machineId: string, date: string): string {
    return `sales:${ownerUuid}:${machineId}:amount:${date}`;
}

function secondsUntilEndOfDay(timeZone: string): number {
    const now = momenttz.tz(timeZone);
    const end = now.clone().endOf('day');
    // expire after midnight + 1h buffer so stale day keys clean up
    return Math.max(end.diff(now, 'seconds') + 3600, 3600);
}

/** Sum item quantities from bill.vendingsales; fallback 1 per line / 1 if empty */
export function calcSaleQty(vendingsales: any): number {
    if (!Array.isArray(vendingsales) || vendingsales.length === 0) return 1;
    const sum = vendingsales.reduce((acc: number, v: any) => {
        const q = Number(v?.stock?.qtty);
        return acc + (Number.isFinite(q) && q > 0 ? q : 1);
    }, 0);
    return sum > 0 ? sum : 1;
}

/**
 * Fire-and-forget: never throws to caller. Redis failures must not break payment flow.
 */
export function recordTodaySaleFireAndForget(
    ownerUuid: string,
    machineId: string,
    qtyDelta: number,
    amountDelta: number,
    timeZone: string
): void {
    setImmediate(() => {
        recordTodaySaleAndPublish(ownerUuid, machineId, qtyDelta, amountDelta, timeZone).catch((err) => {
            console.error('[todaySales] recordTodaySaleAndPublish failed:', err?.message || err);
        });
    });
}

export async function recordTodaySaleAndPublish(
    ownerUuid: string,
    machineId: string,
    qtyDelta: number,
    amountDelta: number,
    timeZone: string
): Promise<TodaySalesUpdatePayload | null> {
    if (!ownerUuid || !machineId) return null;

    const date = getSalesDateKey(timeZone);
    const qtyKey = salesQtyKey(ownerUuid, machineId, date);
    const amountKey = salesAmountKey(ownerUuid, machineId, date);
    const ttl = secondsUntilEndOfDay(timeZone);
    const qtyInc = Math.max(0, Math.round(Number(qtyDelta) || 0));
    const amountInc = Number(amountDelta) || 0;

    const pipeline = redisClient.pipeline();
    pipeline.incrby(qtyKey, qtyInc);
    pipeline.incrbyfloat(amountKey, amountInc);
    pipeline.expire(qtyKey, ttl);
    pipeline.expire(amountKey, ttl);
    const results = await pipeline.exec();

    if (!results) {
        throw new Error('redis pipeline returned null');
    }

    const qtyErr = results[0]?.[0];
    const amountErr = results[1]?.[0];
    if (qtyErr || amountErr) {
        throw qtyErr || amountErr;
    }

    const qtyToday = Number(results[0][1]) || 0;
    const amountToday = Number(results[1][1]) || 0;

    const payload: TodaySalesUpdatePayload = {
        ownerUuid,
        machineId,
        qtyToday,
        amountToday,
        timestamp: new Date().toISOString(),
    };

    await redisClient.publish(SALES_UPDATE_CHANNEL, JSON.stringify(payload));
    return payload;
}

async function writeMachineSalesToRedis(
    ownerUuid: string,
    machineId: string,
    date: string,
    qtyToday: number,
    amountToday: number,
    ttl: number
): Promise<void> {
    const qtyKey = salesQtyKey(ownerUuid, machineId, date);
    const amountKey = salesAmountKey(ownerUuid, machineId, date);
    const pipeline = redisClient.pipeline();
    pipeline.set(qtyKey, String(Math.round(qtyToday)), 'EX', ttl);
    pipeline.set(amountKey, String(amountToday), 'EX', ttl);
    await pipeline.exec();
}

async function aggregateOwnerTodayFromDb(
    ownerUuid: string,
    machineIds: string[],
    timeZone: string
): Promise<Map<string, { qtyToday: number; amountToday: number }>> {
    const map = new Map<string, { qtyToday: number; amountToday: number }>();
    for (const id of machineIds) {
        map.set(id, { qtyToday: 0, amountToday: 0 });
    }

    if (!ownerUuid || machineIds.length === 0) return map;

    const fromDate = momenttz.tz(timeZone).startOf('day').toDate();
    const toDate = momenttz.tz(timeZone).endOf('day').toDate();

    const ent = VendingMachineBillFactory(
        EEntity.vendingmachinebill + '_' + ownerUuid,
        dbConnection
    );
    await ent.sync();

    const bills = await ent.findAll({
        where: {
            paymentstatus: {
                [Op.in]: [EPaymentStatus.paid, EPaymentStatus.delivered],
            },
            createdAt: {
                [Op.between]: [fromDate, toDate],
            },
            machineId: {
                [Op.in]: machineIds,
            },
        },
        attributes: ['machineId', 'totalvalue', 'vendingsales'],
    });

    for (const bill of bills) {
        const mid = bill.machineId;
        const cur = map.get(mid) || { qtyToday: 0, amountToday: 0 };
        cur.qtyToday += calcSaleQty(bill.vendingsales);
        cur.amountToday += Number(bill.totalvalue) || 0;
        map.set(mid, cur);
    }

    return map;
}

/**
 * Initial load: MGET all keys; on miss, aggregate from DB once and warm Redis (incl. zeros).
 */
export async function loadTodaySalesSummary(
    machines: MachineOwnerRef[],
    timeZone: string
): Promise<TodaySalesUpdatePayload[]> {
    const date = getSalesDateKey(timeZone);
    const timestamp = new Date().toISOString();
    if (!machines.length) return [];

    const unique = new Map<string, MachineOwnerRef>();
    for (const m of machines) {
        if (!m?.machineId || !m?.ownerUuid) continue;
        unique.set(`${m.ownerUuid}::${m.machineId}`, m);
    }
    const list = Array.from(unique.values());
    if (!list.length) return [];

    const qtyKeys = list.map((m) => salesQtyKey(m.ownerUuid, m.machineId, date));
    const amountKeys = list.map((m) => salesAmountKey(m.ownerUuid, m.machineId, date));

    const [qtyValues, amountValues] = await Promise.all([
        redisClient.mget(...qtyKeys),
        redisClient.mget(...amountKeys),
    ]);

    const hits: TodaySalesUpdatePayload[] = [];
    const missingByOwner = new Map<string, string[]>();

    list.forEach((m, i) => {
        const q = qtyValues[i];
        const a = amountValues[i];
        if (q != null && a != null) {
            hits.push({
                ownerUuid: m.ownerUuid,
                machineId: m.machineId,
                qtyToday: Number(q) || 0,
                amountToday: Number(a) || 0,
                timestamp,
            });
            return;
        }
        const arr = missingByOwner.get(m.ownerUuid) || [];
        arr.push(m.machineId);
        missingByOwner.set(m.ownerUuid, arr);
    });

    if (missingByOwner.size === 0) {
        return hits;
    }

    const ttl = secondsUntilEndOfDay(timeZone);
    const warmed: TodaySalesUpdatePayload[] = [];

    await Promise.all(
        Array.from(missingByOwner.entries()).map(async ([ownerUuid, machineIds]) => {
            try {
                const agg = await aggregateOwnerTodayFromDb(ownerUuid, machineIds, timeZone);
                for (const machineId of machineIds) {
                    const vals = agg.get(machineId) || { qtyToday: 0, amountToday: 0 };
                    try {
                        await writeMachineSalesToRedis(
                            ownerUuid,
                            machineId,
                            date,
                            vals.qtyToday,
                            vals.amountToday,
                            ttl
                        );
                    } catch (err: any) {
                        console.error('[todaySales] warm Redis failed:', machineId, err?.message || err);
                    }
                    warmed.push({
                        ownerUuid,
                        machineId,
                        qtyToday: vals.qtyToday,
                        amountToday: vals.amountToday,
                        timestamp,
                    });
                }
            } catch (err: any) {
                console.error('[todaySales] DB aggregate failed for owner', ownerUuid, err?.message || err);
                for (const machineId of machineIds) {
                    warmed.push({
                        ownerUuid,
                        machineId,
                        qtyToday: 0,
                        amountToday: 0,
                        timestamp,
                    });
                }
            }
        })
    );

    return [...hits, ...warmed];
}

/**
 * Dedicated Redis connection for SUBSCRIBE (ioredis cannot mix command + subscribe on same client).
 */
export function startTodaySalesSubscriber(wss: WebSocketServer.Server): Redis {
    const sub = new Redis('redis://' + redisHost + ':' + redisPort);

    sub.subscribe(SALES_UPDATE_CHANNEL, (err) => {
        if (err) {
            console.error('[todaySales] subscribe failed:', err);
            return;
        }
        console.log('[todaySales] subscribed to', SALES_UPDATE_CHANNEL);
    });

    sub.on('message', (channel, message) => {
        if (channel !== SALES_UPDATE_CHANNEL) return;
        try {
            const payload = JSON.parse(message) as TodaySalesUpdatePayload;
            // Same pattern as anomaly: push to all adminlogin clients
            wsSendAdmins(EMessage.all, wss, SALES_UPDATE_CHANNEL, payload, false);
        } catch (err: any) {
            console.error('[todaySales] bad pub/sub message:', err?.message || err);
        }
    });

    sub.on('error', (err) => {
        console.error('[todaySales] subscriber redis error:', err?.message || err);
    });

    return sub;
}
