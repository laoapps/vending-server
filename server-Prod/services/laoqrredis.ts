import { checkQRPaidMmoneyAndConfirmServer, checkQRPaidMmoneyResponse } from "../controllers/excel.controller";
import { EMessage } from "../entities/system.model";
import { CheckMmoneyPaid, redisClient } from "./service";

type TransactionItem = {
    transactionID: string;
    createdAt: string | Date;
};

const FIVE_MINUTES = 5 * 60 * 1000;

export async function saveTransactionLaoQrToRedis(
    // redisClient: any,
    machineId: string,
    transactionID: string,
): Promise<TransactionItem[]> {

    const redisKey = machineId + EMessage.ListTransactionLaoQRCheck;

    let raw = '[]';

    try {
        raw = (await redisClient.get(redisKey)) ?? '[]';
    } catch (err) {
        console.error('Redis GET error:', err);
    }

    let trandList: TransactionItem[] = [];

    try {
        trandList = JSON.parse(raw);
        if (!Array.isArray(trandList)) {
            trandList = [];
        }
    } catch (err) {
        console.error('JSON parse error:', err);
        trandList = [];
    }

    const now = Date.now();

    // 🧹 ลบรายการที่เกิน 5 นาที
    trandList = trandList.filter(item => {
        const createdAt = new Date(item.createdAt).getTime();
        return now - createdAt <= FIVE_MINUTES;
    });

    // ➕ เพิ่ม transaction ใหม่
    trandList.push({
        transactionID,
        createdAt: new Date(),
    });

    // console.log('-----> trandList', trandList);


    // 💾 save กลับ redis
    await redisClient.setex(
        redisKey,
        60 * 5,
        JSON.stringify(trandList)
    );

    return trandList;
}



export async function removeTransactionLaoQRFromRedis(
    machineId: string,
    transactionID: string,
): Promise<TransactionItem[]> {

    const redisKey = machineId + EMessage.ListTransactionLaoQRCheck;

    let raw = '[]';

    try {
        raw = (await redisClient.get(redisKey)) ?? '[]';
    } catch (err) {
        console.error('Redis GET error:', err);
    }

    let trandList: TransactionItem[] = [];

    try {
        trandList = JSON.parse(raw);
        if (!Array.isArray(trandList)) {
            trandList = [];
        }
    } catch (err) {
        console.error('JSON parse error:', err);
        trandList = [];
    }

    // ❌ ลบ transactionID ที่ตรงกัน
    const before = trandList.length;

    trandList = trandList.filter(
        item => item.transactionID !== transactionID
    );

    const after = trandList.length;

    if (before !== after) {
        console.log(`🗑️ Removed transactionID: ${transactionID}`);
    }

    // 💾 save กลับ redis (คง TTL เดิมไว้)
    await redisClient.setex(
        redisKey,
        60 * 5,
        JSON.stringify(trandList)
    );

    return trandList;
}



export async function getTransactionsLaoQRFromRedis(
    machineId: string,
) {

    try {
        const redisKey = machineId + EMessage.ListTransactionLaoQRCheck;

        let raw = '[]';

        try {
            raw = (await redisClient.get(redisKey)) ?? '[]';
        } catch (err) {
            console.error('Redis GET error:', err);
            return [];
        }

        let trandList: TransactionItem[] = [];

        try {
            trandList = JSON.parse(raw);
            if (!Array.isArray(trandList)) {
                return [];
            }
        } catch (err) {
            console.error('JSON parse error:', err);
            return [];
        }

        const now = Date.now();

        // 🧹 cleanup ตัวที่เกิน 5 นาที
        const cleanedList = trandList.filter(item => {
            const createdAt = new Date(item.createdAt).getTime();
            return now - createdAt <= FIVE_MINUTES;
        });

        // 🔄 ถ้ามีการลบ → update redis
        if (cleanedList.length !== trandList.length) {
            await redisClient.setex(
                redisKey,
                60 * 5,
                JSON.stringify(cleanedList)
            );
        }

        for (let index = 0; index < cleanedList.length; index++) {
            const element = cleanedList[index];
            // console.log('-----> ELEMENT :', element.transactionID);
            await delayTime(500);
            const result = await checkQRPaidMmoneyAndConfirmServer(element.transactionID);
            // console.log('-----> MMONEY :', result.message);

            if (result.status == 1) {
                await removeTransactionLaoQRFromRedis(machineId, element.transactionID);
            }

        }
    } catch (errorCheck) {
        console.error('getTransactionsLaoQRFromRedis error:', errorCheck);
    }
    // console.log('-----> cleanedList :', cleanedList);
}


export function delayTime(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
