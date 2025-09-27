import { EMessage } from "../entities/system.model";
import { redisClient } from "./service";

export function checkGenerateCount(machineId: string): Promise<{ status: number, message: any }> {
    return new Promise<{ status: number, message: any }>(async (resolve, reject) => {
        const LaoQRCount = await redisClient.get(machineId + EMessage.ListTransaction)
        if (LaoQRCount) {
            if (Number(LaoQRCount) >= 10) {
                // restartmavhine
                return resolve({ status: 1, message: 'LaoQR count exceeded' });

            }
            redisClient.setex(machineId + EMessage.ListTransaction, 20, (Number(LaoQRCount) + 1) + '');
            resolve({ status: 0, message: 'LaoQR count updated' });
        } else {
            redisClient.setex(machineId + EMessage.ListTransaction, 20, '1');
            resolve({ status: 0, message: 'LaoQR count initialized' });
        }
    });
}
