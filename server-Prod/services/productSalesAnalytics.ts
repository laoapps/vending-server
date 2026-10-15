import momenttz from 'moment-timezone';
import { Op, fn, col } from 'sequelize';
import { dbConnection } from '../entities';
import { EEntity, EPaymentStatus } from '../entities/system.model';
import { VendingMachineBillFactory } from '../entities/vendingmachinebill.entity';
import { VendingMachineSaleFactory } from '../entities/vendingmachinesale.entity';
import { MachineClientIDFactory } from '../entities/machineclientid.entity';
import {
    IProductSalesDaily,
    ProductSalesDailyFactory,
    ProductSalesDailyStatic,
} from '../entities/productsalesdaily.entity';
import { redisClient } from './service';

/*
 * Product sales analytics
 * -----------------------
 * 1. Accumulate: bills (vendingmachinebill_<ownerUuid>) are rolled up into `productsalesdaily`
 *    (owner / machine / day / channel / product). A rebuild deletes and re-inserts whole days,
 *    so it is idempotent and can be re-run at any time.
 *    History is built ONCE: a day is "closed" CLOSE_AFTER_HOURS after it ends and is never re-read
 *    from the bills again (only the manual rebuild touches it). Each tick only rebuilds today, plus
 *    whatever closed days an owner is still missing; progress is saved per owner in Redis, so a
 *    restart resumes instead of starting the backfill again.
 * 2. Analyze: rank products and channels per machine, per owner, or globally, and classify
 *    each product (ABC on revenue) into an action: INCREASE / KEEP / REVIEW / DISPOSE / RELOAD.
 */

const DATE_FMT = 'YYYY-MM-DD';
const ROLLUP_LOCK_KEY = 'productsales:rollup:lock';
/** hash ownerUuid -> last closed day (YYYY-MM-DD) that is already in productsalesdaily */
const ROLLUP_CLOSED_KEY = 'productsales:rollup:closedThrough';
/** late payments / confirmations may still land shortly after midnight */
const CLOSE_AFTER_HOURS = 2;
/** cap on closed days built per owner per tick, so a large backfill is spread over several ticks */
const MAX_HISTORY_DAYS_PER_TICK = 31;
/** pause between owners, keeps the job from hogging the DB pool */
const OWNER_PAUSE_MS = 150;
/** analyze results are cached until the next rollup (or this TTL, whichever comes first) */
const RESULT_CACHE_TTL_MS = 5 * 60 * 1000;
const RESULT_CACHE_MAX = 100;
const SLOT_CACHE_TTL_MS = 2 * 60 * 1000;
const ROLLUP_INTERVAL_MS = 15 * 60 * 1000;
const ROLLUP_START_DELAY_MS = 60 * 1000;
const BACKFILL_DAYS = 90;
const REBUILD_CHUNK_DAYS = 7;
const MAX_RANGE_DAYS = 366;

/** ABC thresholds on cumulative revenue share */
const ABC_A_LIMIT = 0.8;
const ABC_B_LIMIT = 0.95;
/** a top seller whose loaded stock runs out sooner than this needs more qty / channels */
const LOW_COVER_DAYS = 3;

const SOLD_STATUSES = [EPaymentStatus.paid, EPaymentStatus.delivered];

export type ProductAction = 'INCREASE' | 'KEEP' | 'REVIEW' | 'DISPOSE' | 'RELOAD';
/** machine = one machine, selection = a picked set / owner filter, owner = all of an owner's, global = everything */
export type AnalyticsScope = 'machine' | 'selection' | 'owner' | 'global';

export interface ProductRankRow {
    rank: number;
    productKey: string;
    productName: string;
    productImage: string;
    price: number;
    qty: number;
    amount: number;
    billCount: number;
    daysSold: number;
    qtyPerDay: number;
    qtyShare: number;
    amountShare: number;
    cumAmountShare: number;
    abc: 'A' | 'B' | 'C' | '-';
    machinesSold: number;
    machinesLoaded: number;
    soldPositions: number[];
    loadedPositions: number[];
    currentChannels: number;
    currentCapacity: number;
    currentStock: number;
    daysToEmpty: number | null;
    currentChannelsPerMachine: number;
    suggestedChannelsPerMachine: number;
    action: ProductAction;
    reason: string;
}

/** a machine the caller may see, with the labels people recognise it by */
export interface MachineRef {
    ownerUuid: string;
    machineId: string;
    location?: string;
    shopPhone?: string;
    ownerPhone?: string;
}

/** Reads location / phones from machineclientid.data[0] (same fields the dashboard edits). */
export function toMachineRef(m: any): MachineRef {
    const d = Array.isArray(m?.data) ? m.data[0] : m?.data;
    const str = (v: any) => (v != null && String(v).trim() !== '' ? String(v).trim() : '');
    return {
        ownerUuid: m?.ownerUuid || '',
        machineId: m?.machineId || '',
        location: str(d?.location),
        shopPhone: str(d?.shopPhone),
        ownerPhone: str(d?.ownerPhone),
    };
}

export interface ChannelRankRow {
    rank: number;
    machineId: string;
    location: string;
    position: number;
    qty: number;
    amount: number;
    qtyPerDay: number;
    topProductName: string;
    products: Array<{ productName: string; qty: number; amount: number }>;
    loadedProductName: string;
    max: number;
    stock: number;
}

export interface MachineRankRow {
    rank: number;
    ownerUuid: string;
    ownerPhone: string;
    machineId: string;
    location: string;
    shopPhone: string;
    qty: number;
    amount: number;
    qtyPerDay: number;
    amountShare: number;
    productsSold: number;
    channelsSold: number;
    channelsLoaded: number;
    topProductName: string;
}

export interface ProductSalesAnalyticsResult {
    scope: AnalyticsScope;
    fromDate: string;
    toDate: string;
    days: number;
    machineCount: number;
    totals: {
        qty: number;
        amount: number;
        billCount: number;
        qtyPerDay: number;
        amountPerDay: number;
        productsSold: number;
        productsLoaded: number;
        channelsLoaded: number;
    };
    actionCounts: Record<ProductAction, number>;
    products: ProductRankRow[];
    channels: ChannelRankRow[];
    machines: MachineRankRow[];
    lastRollupAt: string | null;
}

interface SlotRef {
    ownerUuid: string;
    machineId: string;
    position: number;
    productKey: string;
    productName: string;
    productImage: string;
    price: number;
    max: number;
    stock: number;
}

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------

let entityPromise: Promise<ProductSalesDailyStatic> | null = null;

export function getProductSalesDailyEntity(): Promise<ProductSalesDailyStatic> {
    if (!entityPromise) {
        const ent = ProductSalesDailyFactory(EEntity.productsalesdaily, dbConnection);
        entityPromise = ent.sync().then(() => ent).catch((err) => {
            entityPromise = null;
            throw err;
        });
    }
    return entityPromise;
}

export function normalizeProductKey(name: any): string {
    return String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase() || '(unknown)';
}

function round(n: number, digits = 2): number {
    const f = Math.pow(10, digits);
    return Math.round((Number(n) || 0) * f) / f;
}

function lineQty(v: any): number {
    const q = Number(v?.stock?.qtty);
    return Number.isFinite(q) && q > 0 ? Math.round(q) : 1;
}

async function tableExists(name: string): Promise<boolean> {
    try {
        return await dbConnection.getQueryInterface().tableExists(name);
    } catch {
        return false;
    }
}

/** Validates YYYY-MM-DD input; defaults to the last 30 days ending today. */
export function resolveDateRange(
    timeZone: string,
    fromDate?: any,
    toDate?: any
): { fromDay: string; toDay: string; days: number } {
    const today = momenttz.tz(timeZone).format(DATE_FMT);
    const parse = (v: any) => {
        if (typeof v !== 'string') return null;
        const d = momenttz.tz(v.substring(0, 10), DATE_FMT, true, timeZone);
        return d.isValid() ? d.format(DATE_FMT) : null;
    };
    let toDay = parse(toDate) || today;
    let fromDay = parse(fromDate) ||
        momenttz.tz(toDay, DATE_FMT, timeZone).subtract(29, 'days').format(DATE_FMT);
    if (fromDay > toDay) [fromDay, toDay] = [toDay, fromDay];
    if (toDay > today) toDay = today;
    if (fromDay > toDay) fromDay = toDay;

    const minFrom = momenttz.tz(toDay, DATE_FMT, timeZone).subtract(MAX_RANGE_DAYS - 1, 'days').format(DATE_FMT);
    if (fromDay < minFrom) fromDay = minFrom;

    const days = momenttz.tz(toDay, DATE_FMT, timeZone).diff(momenttz.tz(fromDay, DATE_FMT, timeZone), 'days') + 1;
    return { fromDay, toDay, days };
}

// ---------------------------------------------------------------------------------------------
// 1. accumulate (rollup)
// ---------------------------------------------------------------------------------------------

/**
 * Rebuilds productsalesdaily for one owner for every day in [fromDay, toDay] (inclusive).
 * Returns the number of rows written.
 */
export async function rebuildOwnerRange(
    ownerUuid: string,
    fromDay: string,
    toDay: string,
    timeZone: string
): Promise<number> {
    if (!ownerUuid) return 0;
    const billTable = EEntity.vendingmachinebill + '_' + ownerUuid;
    if (!(await tableExists(billTable))) return 0;

    const daily = await getProductSalesDailyEntity();
    const billEnt = VendingMachineBillFactory(billTable, dbConnection);

    let written = 0;
    let chunkFrom = momenttz.tz(fromDay, DATE_FMT, timeZone);
    const end = momenttz.tz(toDay, DATE_FMT, timeZone);

    while (!chunkFrom.isAfter(end, 'day')) {
        const chunkTo = moment_min(chunkFrom.clone().add(REBUILD_CHUNK_DAYS - 1, 'days'), end);
        const fromDate = chunkFrom.clone().startOf('day').toDate();
        const toDate = chunkTo.clone().endOf('day').toDate();

        const bills = await billEnt.findAll({
            where: {
                paymentstatus: { [Op.in]: SOLD_STATUSES },
                createdAt: { [Op.between]: [fromDate, toDate] },
            },
            attributes: ['machineId', 'createdAt', 'totalvalue', 'vendingsales'],
            raw: true,
        });

        const acc = new Map<string, IProductSalesDaily>();
        for (const bill of bills as any[]) {
            const machineId = bill.machineId;
            if (!machineId) continue;
            const saleDate = momenttz.tz(bill.createdAt, timeZone).format(DATE_FMT);
            const lines: any[] = Array.isArray(bill.vendingsales) ? bill.vendingsales : [];
            if (!lines.length) continue;

            // spread the paid total over the lines so promotions/discounts stay consistent with revenue
            const total = Number(bill.totalvalue) || 0;
            const lineValues = lines.map((v) => (Number(v?.stock?.price) || 0) * lineQty(v));
            const sumLines = lineValues.reduce((a, b) => a + b, 0);

            lines.forEach((v, i) => {
                const name = v?.stock?.name || '';
                const productKey = normalizeProductKey(name);
                const position = Number(v?.position) || 0;
                const qty = lineQty(v);
                const amount = sumLines > 0 ? total * (lineValues[i] / sumLines) : total / lines.length;
                const key = `${machineId}|${saleDate}|${position}|${productKey}`;
                const cur = acc.get(key);
                if (cur) {
                    cur.qty += qty;
                    cur.amount += amount;
                    cur.billCount += 1;
                } else {
                    acc.set(key, {
                        ownerUuid,
                        machineId,
                        saleDate,
                        position,
                        productKey,
                        productId: Number(v?.stock?.id) || null,
                        productName: name,
                        productImage: v?.stock?.image || '',
                        price: Number(v?.stock?.price) || 0,
                        qty,
                        amount,
                        billCount: 1,
                    });
                }
            });
        }

        const rows = Array.from(acc.values()).map((r) => ({ ...r, amount: round(r.amount) }));
        await dbConnection.transaction(async (t) => {
            await daily.destroy({
                where: {
                    ownerUuid,
                    saleDate: { [Op.between]: [chunkFrom.format(DATE_FMT), chunkTo.format(DATE_FMT)] },
                },
                transaction: t,
            });
            if (rows.length) {
                await daily.bulkCreate(rows as any, { transaction: t });
            }
        });
        written += rows.length;
        chunkFrom = chunkTo.clone().add(1, 'day');
    }
    return written;
}

function moment_min(a: momenttz.Moment, b: momenttz.Moment): momenttz.Moment {
    return a.isBefore(b) ? a : b.clone();
}

export async function listActiveOwners(): Promise<string[]> {
    const ent = MachineClientIDFactory(EEntity.machineclientid, dbConnection);
    const rows = await ent.findAll({
        where: { isActive: { [Op.not]: false } },
        attributes: ['ownerUuid'],
        group: ['ownerUuid'],
        raw: true,
    });
    return (rows as any[]).map((r) => r.ownerUuid).filter((x) => !!x);
}

export async function rebuildAllOwners(fromDay: string, toDay: string, timeZone: string): Promise<{ owners: number; rows: number }> {
    const owners = await listActiveOwners();
    let rows = 0;
    // sequential on purpose: keeps DB load low while the payment flow is running
    for (const ownerUuid of owners) {
        try {
            rows += await rebuildOwnerRange(ownerUuid, fromDay, toDay, timeZone);
        } catch (err: any) {
            console.error('[productSales] rebuild failed for owner', ownerUuid, err?.message || err);
        }
        await sleep(OWNER_PAUSE_MS);
    }
    await markRollupDone();
    return { owners: owners.length, rows };
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function markRollupDone() {
    resultCache.clear();
    await redisClient.set('productsales:rollup:lastAt', new Date().toISOString());
}

/** Runs `job` only if no other process/instance holds the rollup lock. */
export async function runWithRollupLock<T>(job: () => Promise<T>): Promise<T | null> {
    const ok = await redisClient.set(ROLLUP_LOCK_KEY, String(process.pid), 'EX', 60 * 60, 'NX');
    if (!ok) return null;
    try {
        return await job();
    } finally {
        await redisClient.del(ROLLUP_LOCK_KEY);
    }
}

/** last day whose numbers can no longer change (yesterday once CLOSE_AFTER_HOURS have passed) */
function lastClosedDay(timeZone: string): string {
    return momenttz.tz(timeZone).subtract(CLOSE_AFTER_HOURS, 'hours').subtract(1, 'day').format(DATE_FMT);
}

/**
 * One tick:
 *  - closed history: for each owner, build the closed days it does not have yet (once, then never again)
 *  - open days (today, and yesterday until it closes): rebuilt every tick
 */
async function scheduledRollup(timeZone: string) {
    const done = await runWithRollupLock(async () => {
        const started = Date.now();
        const today = momenttz.tz(timeZone).format(DATE_FMT);
        const closedDay = lastClosedDay(timeZone);
        const firstOpenDay = momenttz.tz(closedDay, DATE_FMT, timeZone).add(1, 'day').format(DATE_FMT);
        const oldestDay = momenttz.tz(today, DATE_FMT, timeZone).subtract(BACKFILL_DAYS - 1, 'days').format(DATE_FMT);

        const owners = await listActiveOwners();
        const closed = (await redisClient.hgetall(ROLLUP_CLOSED_KEY)) || {};
        let historyDays = 0;
        let rows = 0;

        for (const ownerUuid of owners) {
            try {
                // 1) history the owner is still missing (resumes where the last run stopped)
                const have = closed[ownerUuid];
                let from = have
                    ? momenttz.tz(have, DATE_FMT, timeZone).add(1, 'day').format(DATE_FMT)
                    : oldestDay;
                if (from < oldestDay) from = oldestDay;
                if (from <= closedDay) {
                    const capped = momenttz.tz(from, DATE_FMT, timeZone).add(MAX_HISTORY_DAYS_PER_TICK - 1, 'days').format(DATE_FMT);
                    const to = capped < closedDay ? capped : closedDay;
                    rows += await rebuildOwnerRange(ownerUuid, from, to, timeZone);
                    await redisClient.hset(ROLLUP_CLOSED_KEY, ownerUuid, to);
                    historyDays += momenttz.tz(to, DATE_FMT, timeZone).diff(momenttz.tz(from, DATE_FMT, timeZone), 'days') + 1;
                }
                // 2) open days: today (and yesterday during the first CLOSE_AFTER_HOURS after midnight)
                rows += await rebuildOwnerRange(ownerUuid, firstOpenDay, today, timeZone);
            } catch (err: any) {
                console.error('[productSales] rollup failed for owner', ownerUuid, err?.message || err);
            }
            await sleep(OWNER_PAUSE_MS);
        }
        await markRollupDone();
        console.log(`[productSales] rollup owners=${owners.length} history-days=${historyDays} open=${firstOpenDay}..${today} rows=${rows} in ${Date.now() - started}ms`);
        return true;
    });
    if (done === null) console.log('[productSales] rollup skipped (another run holds the lock)');
}

let schedulerStarted = false;

/** Every 15 minutes: today is rebuilt; closed days are built once per owner and then left alone. */
export function startProductSalesRollupScheduler(timeZone: string): void {
    if (schedulerStarted) return;
    schedulerStarted = true;
    const tick = () => scheduledRollup(timeZone).catch((err) => {
        console.error('[productSales] scheduled rollup failed:', err?.message || err);
    });
    setTimeout(tick, ROLLUP_START_DELAY_MS);
    setInterval(tick, ROLLUP_INTERVAL_MS);
}

// ---------------------------------------------------------------------------------------------
// 2. analyze
// ---------------------------------------------------------------------------------------------

const slotCache = new Map<string, { at: number; rows: any[] }>();

/** owners that have a vendingmachinesale_<owner> table, in ONE query instead of one per owner */
async function ownersWithSaleTable(): Promise<Set<string>> {
    const prefix = EEntity.vendingmachinesale + '_';
    const [rows] = await dbConnection.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename LIKE :p`,
        { replacements: { p: prefix + '%' } }
    );
    return new Set((rows as any[]).map((r) => String(r.tablename).substring(prefix.length)));
}

/** current slot setup of an owner's machines, cached briefly (stock moves, setup rarely does) */
async function ownerSlotRows(ownerUuid: string): Promise<any[]> {
    const hit = slotCache.get(ownerUuid);
    if (hit && Date.now() - hit.at < SLOT_CACHE_TTL_MS) return hit.rows;
    const ent = VendingMachineSaleFactory(EEntity.vendingmachinesale + '_' + ownerUuid, dbConnection);
    const rows = await ent.findAll({
        attributes: ['machineId', 'position', 'max', 'stock', 'isActive'],
        raw: true,
    });
    slotCache.set(ownerUuid, { at: Date.now(), rows });
    return rows;
}

async function loadSlots(machines: Array<{ ownerUuid: string; machineId: string }>): Promise<SlotRef[]> {
    const byOwner = new Map<string, Set<string>>();
    for (const m of machines) {
        const set = byOwner.get(m.ownerUuid) || new Set<string>();
        set.add(m.machineId);
        byOwner.set(m.ownerUuid, set);
    }
    const withTable = await ownersWithSaleTable();
    const slots: SlotRef[] = [];
    const owners = Array.from(byOwner.entries()).filter(([o]) => withTable.has(o));

    // a few owners at a time so a global load cannot take the whole DB pool
    for (let i = 0; i < owners.length; i += 5) {
        await Promise.all(owners.slice(i, i + 5).map(async ([ownerUuid, machineIds]) => {
            try {
                for (const r of await ownerSlotRows(ownerUuid)) {
                    if (!machineIds.has(r.machineId) || r.isActive === false || !r.stock?.name) continue;
                    slots.push({
                        ownerUuid,
                        machineId: r.machineId,
                        position: Number(r.position) || 0,
                        productKey: normalizeProductKey(r.stock.name),
                        productName: r.stock.name,
                        productImage: r.stock.image || '',
                        price: Number(r.stock.price) || 0,
                        max: Number(r.max) || 0,
                        stock: Number(r.stock.qtty) || 0,
                    });
                }
            } catch (err: any) {
                console.error('[productSales] load slots failed for owner', ownerUuid, err?.message || err);
            }
        }));
    }
    return slots;
}

const resultCache = new Map<string, { at: number; value: ProductSalesAnalyticsResult }>();

/**
 * Ranks products, channels and machines for a set of machines over [fromDay, toDay].
 * `machines` must already be filtered to what the caller may see.
 */
export async function analyzeProductSales(params: {
    scope: AnalyticsScope;
    machines: MachineRef[];
    fromDay: string;
    toDay: string;
    days: number;
}): Promise<ProductSalesAnalyticsResult> {
    // the data only changes when the rollup runs, so the same question gets the same answer until then
    const key = JSON.stringify([params.scope, params.fromDay, params.toDay,
        params.machines.map((m) => m.ownerUuid + ':' + m.machineId).sort()]);
    const hit = resultCache.get(key);
    if (hit && Date.now() - hit.at < RESULT_CACHE_TTL_MS) return hit.value;

    const value = await computeProductSales(params);
    if (resultCache.size >= RESULT_CACHE_MAX) resultCache.delete(resultCache.keys().next().value);
    resultCache.set(key, { at: Date.now(), value });
    return value;
}

async function computeProductSales(params: {
    scope: AnalyticsScope;
    machines: MachineRef[];
    fromDay: string;
    toDay: string;
    days: number;
}): Promise<ProductSalesAnalyticsResult> {
    const { scope, machines, fromDay, toDay, days } = params;
    const daily = await getProductSalesDailyEntity();

    const machineIds = Array.from(new Set(machines.map((m) => m.machineId)));
    const machineRef = new Map(machines.map((m) => [m.machineId, m]));

    const [agg, slots, lastRollupAt] = await Promise.all([
        machineIds.length
            ? daily.findAll({
                // "all machines" needs no IN-list of every machine: the date index is enough
                where: scope === 'global'
                    ? { saleDate: { [Op.between]: [fromDay, toDay] } }
                    : {
                        ownerUuid: { [Op.in]: Array.from(new Set(machines.map((m) => m.ownerUuid))) },
                        machineId: { [Op.in]: machineIds },
                        saleDate: { [Op.between]: [fromDay, toDay] },
                    },
                attributes: [
                    'machineId',
                    'position',
                    'productKey',
                    [fn('MAX', col('productName')), 'productName'],
                    [fn('MAX', col('productImage')), 'productImage'],
                    [fn('MAX', col('price')), 'price'],
                    [fn('SUM', col('qty')), 'qty'],
                    [fn('SUM', col('amount')), 'amount'],
                    [fn('SUM', col('billCount')), 'billCount'],
                    [fn('COUNT', fn('DISTINCT', col('saleDate'))), 'daysSold'],
                ],
                group: ['machineId', 'position', 'productKey'],
                raw: true,
            })
            : Promise.resolve([]),
        loadSlots(machines),
        redisClient.get('productsales:rollup:lastAt').catch((): null => null),
    ]);

    const rows = (agg as any[]).map((r) => ({
        machineId: r.machineId as string,
        position: Number(r.position) || 0,
        productKey: r.productKey as string,
        productName: r.productName as string,
        productImage: r.productImage as string,
        price: Number(r.price) || 0,
        qty: Number(r.qty) || 0,
        amount: Number(r.amount) || 0,
        billCount: Number(r.billCount) || 0,
        daysSold: Number(r.daysSold) || 0,
    })).filter((r) => machineRef.has(r.machineId));

    const totalQty = rows.reduce((a, r) => a + r.qty, 0);
    const totalAmount = rows.reduce((a, r) => a + r.amount, 0);
    const totalBills = rows.reduce((a, r) => a + r.billCount, 0);
    const machineCount = Math.max(1, machineIds.length);
    const channelsLoaded = slots.length;
    const channelsPerMachine = channelsLoaded / machineCount;

    // ---- products --------------------------------------------------------------------------
    type PAcc = {
        productKey: string; productName: string; productImage: string; price: number;
        qty: number; amount: number; billCount: number; daysSold: number;
        machinesSold: Set<string>; soldPositions: Set<number>;
        machinesLoaded: Set<string>; loadedPositions: Set<number>;
        currentChannels: number; currentCapacity: number; currentStock: number;
    };
    const products = new Map<string, PAcc>();
    const getP = (key: string, name: string, image: string, price: number): PAcc => {
        let p = products.get(key);
        if (!p) {
            p = {
                productKey: key, productName: name, productImage: image, price,
                qty: 0, amount: 0, billCount: 0, daysSold: 0,
                machinesSold: new Set(), soldPositions: new Set(),
                machinesLoaded: new Set(), loadedPositions: new Set(),
                currentChannels: 0, currentCapacity: 0, currentStock: 0,
            };
            products.set(key, p);
        }
        return p;
    };
    for (const r of rows) {
        const p = getP(r.productKey, r.productName, r.productImage, r.price);
        p.qty += r.qty;
        p.amount += r.amount;
        p.billCount += r.billCount;
        p.daysSold = Math.max(p.daysSold, r.daysSold);
        p.machinesSold.add(r.machineId);
        p.soldPositions.add(r.position);
    }
    for (const s of slots) {
        const p = getP(s.productKey, s.productName, s.productImage, s.price);
        p.machinesLoaded.add(s.machineId);
        p.loadedPositions.add(s.position);
        p.currentChannels += 1;
        p.currentCapacity += s.max;
        p.currentStock += s.stock;
        // prefer the current slot name/image/price
        p.productName = s.productName;
        if (s.productImage) p.productImage = s.productImage;
        if (s.price) p.price = s.price;
    }

    const sorted = Array.from(products.values()).sort((a, b) => b.amount - a.amount || b.qty - a.qty);
    let cum = 0;
    const actionCounts: Record<ProductAction, number> = { INCREASE: 0, KEEP: 0, REVIEW: 0, DISPOSE: 0, RELOAD: 0 };
    const productRows: ProductRankRow[] = sorted.map((p, i) => {
        const amountShare = totalAmount > 0 ? p.amount / totalAmount : 0;
        const qtyShare = totalQty > 0 ? p.qty / totalQty : 0;
        let abc: ProductRankRow['abc'] = '-';
        if (p.qty > 0) {
            abc = cum < ABC_A_LIMIT ? 'A' : cum < ABC_B_LIMIT ? 'B' : 'C';
        }
        cum += amountShare;

        const qtyPerDay = p.qty / days;
        const machinesLoaded = p.machinesLoaded.size;
        const currentChannelsPerMachine = machinesLoaded ? p.currentChannels / machinesLoaded : 0;
        const suggestedChannelsPerMachine = p.qty > 0
            ? Math.max(1, Math.round(qtyShare * channelsPerMachine))
            : 0;
        const daysToEmpty = qtyPerDay > 0 && p.currentChannels > 0 ? p.currentStock / qtyPerDay : null;

        let action: ProductAction;
        let reason: string;
        if (p.qty === 0) {
            action = 'DISPOSE';
            reason = `Loaded in ${p.currentChannels} channel(s) but no sale in ${days} day(s)`;
        } else if (p.currentChannels === 0 && abc !== 'C') {
            action = 'RELOAD';
            reason = 'Sold well in this period but is not loaded in any channel now';
        } else if (abc === 'A' && (
            suggestedChannelsPerMachine > Math.round(currentChannelsPerMachine) ||
            (daysToEmpty !== null && daysToEmpty < LOW_COVER_DAYS)
        )) {
            action = 'INCREASE';
            const parts: string[] = [];
            if (suggestedChannelsPerMachine > Math.round(currentChannelsPerMachine)) {
                parts.push(`add channels ${round(currentChannelsPerMachine, 1)} → ${suggestedChannelsPerMachine} per machine`);
            }
            if (daysToEmpty !== null && daysToEmpty < LOW_COVER_DAYS) {
                parts.push(`stock lasts only ${round(daysToEmpty, 1)} day(s), refill more qty`);
            }
            reason = `Top seller: ${parts.join('; ')}`;
        } else if (abc === 'C') {
            action = 'REVIEW';
            reason = `Bottom ${Math.round((1 - ABC_B_LIMIT) * 100)}% of revenue; consider replacing`;
        } else {
            action = 'KEEP';
            reason = abc === 'A' ? 'Top seller, channels are enough' : 'Average seller';
        }
        actionCounts[action] += 1;

        return {
            rank: i + 1,
            productKey: p.productKey,
            productName: p.productName,
            productImage: p.productImage,
            price: p.price,
            qty: p.qty,
            amount: round(p.amount),
            billCount: p.billCount,
            daysSold: p.daysSold,
            qtyPerDay: round(qtyPerDay),
            qtyShare: round(qtyShare * 100),
            amountShare: round(amountShare * 100),
            cumAmountShare: round(Math.min(cum, 1) * 100),
            abc,
            machinesSold: p.machinesSold.size,
            machinesLoaded,
            soldPositions: Array.from(p.soldPositions).sort((a, b) => a - b),
            loadedPositions: Array.from(p.loadedPositions).sort((a, b) => a - b),
            currentChannels: p.currentChannels,
            currentCapacity: p.currentCapacity,
            currentStock: p.currentStock,
            daysToEmpty: daysToEmpty === null ? null : round(daysToEmpty, 1),
            currentChannelsPerMachine: round(currentChannelsPerMachine, 1),
            suggestedChannelsPerMachine,
            action,
            reason,
        };
    });

    // ---- channels (only meaningful for a single machine / an owner's machines) ------------------
    let channelRows: ChannelRankRow[] = [];
    if (scope !== 'global') {
        type CAcc = { machineId: string; position: number; qty: number; amount: number; products: Map<string, { productName: string; qty: number; amount: number }> };
        const channels = new Map<string, CAcc>();
        const getC = (machineId: string, position: number) => {
            const key = `${machineId}|${position}`;
            let c = channels.get(key);
            if (!c) {
                c = { machineId, position, qty: 0, amount: 0, products: new Map() };
                channels.set(key, c);
            }
            return c;
        };
        for (const r of rows) {
            const c = getC(r.machineId, r.position);
            c.qty += r.qty;
            c.amount += r.amount;
            const cp = c.products.get(r.productKey) || { productName: r.productName, qty: 0, amount: 0 };
            cp.qty += r.qty;
            cp.amount += r.amount;
            c.products.set(r.productKey, cp);
        }
        const slotByChannel = new Map(slots.map((s) => [`${s.machineId}|${s.position}`, s]));
        for (const s of slots) getC(s.machineId, s.position);

        channelRows = Array.from(channels.values())
            .sort((a, b) => b.qty - a.qty || b.amount - a.amount || a.position - b.position)
            .map((c, i) => {
                const prods = Array.from(c.products.values())
                    .sort((a, b) => b.qty - a.qty)
                    .map((p) => ({ productName: p.productName, qty: p.qty, amount: round(p.amount) }));
                const slot = slotByChannel.get(`${c.machineId}|${c.position}`);
                return {
                    rank: i + 1,
                    machineId: c.machineId,
                    location: machineRef.get(c.machineId)?.location || '',
                    position: c.position,
                    qty: c.qty,
                    amount: round(c.amount),
                    qtyPerDay: round(c.qty / days),
                    topProductName: prods[0]?.productName || '',
                    products: prods,
                    loadedProductName: slot?.productName || '',
                    max: slot?.max || 0,
                    stock: slot?.stock || 0,
                };
            });
    }

    // ---- machines ------------------------------------------------------------------------------
    type MAcc = { machineId: string; qty: number; amount: number; products: Map<string, { name: string; qty: number }>; positions: Set<number> };
    const mAcc = new Map<string, MAcc>();
    for (const id of machineIds) mAcc.set(id, { machineId: id, qty: 0, amount: 0, products: new Map(), positions: new Set() });
    for (const r of rows) {
        const m = mAcc.get(r.machineId);
        if (!m) continue;
        m.qty += r.qty;
        m.amount += r.amount;
        m.positions.add(r.position);
        const mp = m.products.get(r.productKey) || { name: r.productName, qty: 0 };
        mp.qty += r.qty;
        m.products.set(r.productKey, mp);
    }
    const slotsPerMachine = new Map<string, number>();
    for (const s of slots) slotsPerMachine.set(s.machineId, (slotsPerMachine.get(s.machineId) || 0) + 1);

    const machineRows: MachineRankRow[] = Array.from(mAcc.values())
        .sort((a, b) => b.amount - a.amount || b.qty - a.qty)
        .map((m, i) => {
            const top = Array.from(m.products.values()).sort((a, b) => b.qty - a.qty)[0];
            const ref = machineRef.get(m.machineId);
            return {
                rank: i + 1,
                ownerUuid: ref?.ownerUuid || '',
                ownerPhone: ref?.ownerPhone || '',
                machineId: m.machineId,
                location: ref?.location || '',
                shopPhone: ref?.shopPhone || '',
                qty: m.qty,
                amount: round(m.amount),
                qtyPerDay: round(m.qty / days),
                amountShare: totalAmount > 0 ? round((m.amount / totalAmount) * 100) : 0,
                productsSold: m.products.size,
                channelsSold: m.positions.size,
                channelsLoaded: slotsPerMachine.get(m.machineId) || 0,
                topProductName: top?.name || '',
            };
        });

    return {
        scope,
        fromDate: fromDay,
        toDate: toDay,
        days,
        machineCount: machineIds.length,
        totals: {
            qty: totalQty,
            amount: round(totalAmount),
            billCount: totalBills,
            qtyPerDay: round(totalQty / days),
            amountPerDay: round(totalAmount / days),
            productsSold: productRows.filter((p) => p.qty > 0).length,
            productsLoaded: productRows.filter((p) => p.currentChannels > 0).length,
            channelsLoaded,
        },
        actionCounts,
        products: productRows,
        channels: channelRows,
        machines: machineRows,
        lastRollupAt: lastRollupAt || null,
    };
}
