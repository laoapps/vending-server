import momenttz from 'moment-timezone';
import { Op } from 'sequelize';
import { dbConnection } from '../entities';
import { EEntity, EPaymentStatus } from '../entities/system.model';
import { VendingMachineBillFactory } from '../entities/vendingmachinebill.entity';
import { calcSaleQty, MachineOwnerRef } from './todaySalesRedis';

export interface MonthSalesSummaryRow {
    ownerUuid: string;
    machineId: string;
    qtyMonth: number;
    amountMonth: number;
}

function getMonthKey(timeZone: string, yearMonth?: string): string {
    if (yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)) return yearMonth;
    return momenttz.tz(timeZone).format('YYYY-MM');
}

async function aggregateOwnerMonthFromDb(
    ownerUuid: string,
    machineIds: string[],
    fromDate: Date,
    toDate: Date
): Promise<Map<string, { qtyMonth: number; amountMonth: number }>> {
    const map = new Map<string, { qtyMonth: number; amountMonth: number }>();
    for (const id of machineIds) {
        map.set(id, { qtyMonth: 0, amountMonth: 0 });
    }

    if (!ownerUuid || machineIds.length === 0) return map;

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
        const cur = map.get(mid) || { qtyMonth: 0, amountMonth: 0 };
        cur.qtyMonth += calcSaleQty(bill.vendingsales);
        cur.amountMonth += Number(bill.totalvalue) || 0;
        map.set(mid, cur);
    }

    return map;
}

/**
 * One-shot month sales summary per machine (DB only, no Redis / no realtime).
 * Defaults to the current calendar month in `timeZone`.
 */
export async function loadMonthSalesSummary(
    machines: MachineOwnerRef[],
    timeZone: string,
    yearMonth?: string
): Promise<{ rows: MonthSalesSummaryRow[]; month: string }> {
    const month = getMonthKey(timeZone, yearMonth);
    const fromDate = momenttz.tz(month, 'YYYY-MM', timeZone).startOf('month').toDate();
    const toDate = momenttz.tz(month, 'YYYY-MM', timeZone).endOf('month').toDate();

    if (!machines.length) {
        return { rows: [], month };
    }

    const unique = new Map<string, MachineOwnerRef>();
    for (const m of machines) {
        if (!m?.machineId || !m?.ownerUuid) continue;
        unique.set(`${m.ownerUuid}::${m.machineId}`, m);
    }
    const list = Array.from(unique.values());
    if (!list.length) {
        return { rows: [], month };
    }

    const byOwner = new Map<string, string[]>();
    for (const m of list) {
        const arr = byOwner.get(m.ownerUuid) || [];
        arr.push(m.machineId);
        byOwner.set(m.ownerUuid, arr);
    }

    const rows: MonthSalesSummaryRow[] = [];

    await Promise.all(
        Array.from(byOwner.entries()).map(async ([ownerUuid, machineIds]) => {
            try {
                const agg = await aggregateOwnerMonthFromDb(ownerUuid, machineIds, fromDate, toDate);
                for (const machineId of machineIds) {
                    const vals = agg.get(machineId) || { qtyMonth: 0, amountMonth: 0 };
                    rows.push({
                        ownerUuid,
                        machineId,
                        qtyMonth: vals.qtyMonth,
                        amountMonth: vals.amountMonth,
                    });
                }
            } catch (err: any) {
                console.error('[monthSales] DB aggregate failed for owner', ownerUuid, err?.message || err);
                for (const machineId of machineIds) {
                    rows.push({
                        ownerUuid,
                        machineId,
                        qtyMonth: 0,
                        amountMonth: 0,
                    });
                }
            }
        })
    );

    return { rows, month };
}
