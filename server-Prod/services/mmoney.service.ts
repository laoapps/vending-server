import { EMessage } from "../entities/system.model";
import { redisClient } from "./service";

export async function AddTransactionToCheck(machineID: string, transactionID: string): Promise<{ status: number, message: string }> {
    return new Promise<{ status: number, message: string }>(async (resolve, reject) => {
        try {
            const key = machineID + EMessage.ListTransactionMmoneyCheck;
            const data = await redisClient.get(key);
            let transactionList: { transactionID: string; createdAt: string }[] = data ? JSON.parse(data) : [];

            // ลบ transaction ที่เกิน 5 นาที
            const now = new Date();
            transactionList = transactionList.filter(item => {
                const createdAt = new Date(item.createdAt);
                const diffMs = now.getTime() - createdAt.getTime();
                // console.log('Checking transaction:', item.transactionID, 'Created at:', createdAt, 'Now:', now, 'Diff (ms):', diffMs);

                return diffMs <= 5 * 60 * 1000; // 5 นาที
            });

            // ลบรายการที่มี transactionID ซ้ำ
            transactionList = transactionList.filter(item => item.transactionID !== transactionID);

            // เพิ่มรายการใหม่เข้าไปด้านท้าย
            transactionList.push({
                transactionID,
                createdAt: now.toISOString()
            });

            // จำกัดรายการให้เหลือแค่ 5 รายการล่าสุด
            if (transactionList.length > 5) {
                console.log('Transaction list exceeds 5 items, trimming...');
                transactionList = transactionList.slice(-5);
            }
            console.log('Updated transaction list:', transactionList);

            // บันทึกกลับลง Redis
            await redisClient.setex(key, 60 * 5, JSON.stringify(transactionList));

            resolve({ status: 1, message: EMessage.succeeded });
        } catch (error) {
            console.log('Error in AddTransactionToCheck:', error);
            resolve({ status: 0, message: EMessage.unknownError });
        }
    });
}



export async function GetTransactionToCheck(machineID: string): Promise<{ status: number, message: any }> {
    return new Promise<{ status: number, message: any }>(async (resolve, reject) => {
        try {
            const key = machineID + EMessage.ListTransactionMmoneyCheck;
            const data = await redisClient.get(key);
            let transactionList: { transactionID: string; createdAt: string }[] = data ? JSON.parse(data) : [];

            // ลบ transaction ที่เกิน 5 นาที
            const now = new Date();
            transactionList = transactionList.filter(item => {
                const createdAt = new Date(item.createdAt);
                const diffMs = now.getTime() - createdAt.getTime();
                // console.log('Checking transaction:', item.transactionID, 'Created at:', createdAt, 'Now:', now, 'Diff (ms):', diffMs);

                return diffMs <= 5 * 60 * 1000; // 5 นาที
            });

            resolve({ status: 1, message: transactionList });
        } catch (error) {
            console.log('Error in GetTransactionToCheck:', error);
            resolve({ status: 0, message: EMessage.unknownError });
        }
    });
}


export async function DeleteTransactionToCheck(machineID: string): Promise<{ status: number, message: any }> {
    return new Promise<{ status: number, message: any }>(async (resolve, reject) => {
        try {
            const key = machineID + EMessage.ListTransactionMmoneyCheck;

            await redisClient.del(key);
            resolve({ status: 1, message: EMessage.succeeded });
        } catch (error) {
            console.log('Error in GetTransactionToCheck:', error);
            resolve({ status: 0, message: EMessage.unknownError });
        }
    });
}