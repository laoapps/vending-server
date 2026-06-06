import express, { NextFunction, Request, Response } from "express";
import {
    addValue,
    deductValue,
    clearValueToZero,
    findOrCreateValueRecord
} from "../controllers/blockchain.controller";
import { findPhoneNumberByUuidOnUserManager, findRealDB, PrintError, PrintSucceeded, redisClient, sendCouponeToUser } from "../services/service"; // Your existing redisClient
import { v4 as uuidv4 } from "uuid";
import cryptojs, { AES } from "crypto-js";
import { EEntity, EMessage } from "../entities/system.model";
import { MachineClientIDFactory } from "../entities/machineclientid.entity";
import { dbConnection } from "../entities";

/**
 * BlockchainValueAPI
 * Class-based API module (same pattern as LaabVendingAPI, CashNV9LAAB, etc.)
 *
 * Usage in server.ts:
 *   new BlockchainValueAPI(app);
 */
export class BlockchainValueAPI {
    path = '/coupon';
    machineClientlist = MachineClientIDFactory(
        EEntity.machineclientid,
        dbConnection
    );
    constructor(app: express.Router) {
        this.registerRoutes(app);
        console.log("[BlockchainValueAPI] Routes registered");
    }

    private registerRoutes(app: express.Router): void {
        // === Add value to blockchain ===
        // app.post(`${this.path}/add-value`, async (req, res) => {
        //   try {
        //     const { machineId, ownerUuid, amount, note, actor } = req.body;

        //     if (!machineId || !ownerUuid || typeof amount !== "number" || amount <= 0) {
        //       return res.status(400).json({
        //         success: false,
        //         error: "machineId, ownerUuid and positive amount are required",
        //       });
        //     }

        //     const result = await addValue(
        //       machineId,
        //       ownerUuid,
        //       amount,
        //       note || "API top-up",
        //       actor || `api:${req.ip}`
        //     );

        //     res.json(result);
        //   } catch (error: any) {
        //     console.error("[Blockchain] add-value error:", error);
        //     res.status(500).json({ success: false, error: error.message });
        //   }
        // });

        // === Deduct value from blockchain ===
        // app.post(`${this.path}/deduct-value`, async (req, res) => {
        //     try {
        //         const { machineId, ownerUuid, amount, note, actor } = req.body;

        //         if (!machineId || !ownerUuid || typeof amount !== "number" || amount <= 0) {
        //             return res.status(400).json({
        //                 success: false,
        //                 error: "machineId, ownerUuid and positive amount are required",
        //             });
        //         }

        //         const result = await deductValue(
        //             machineId,
        //             ownerUuid,
        //             amount,
        //             note || "API deduction",
        //             actor || `api:${req.ip}`
        //         );

        //         res.json(result);
        //     } catch (error: any) {
        //         console.error("[Blockchain] deduct-value error:", error);
        //         res.status(500).json({ success: false, error: error.message });
        //     }
        // });

        // // === Clear value to 0 ===
        // app.post(`${this.path}/clear-value`, async (req, res) => {
        //     try {
        //         const { machineId, ownerUuid, note, actor } = req.body;

        //         if (!machineId || !ownerUuid) {
        //             return res.status(400).json({
        //                 success: false,
        //                 error: "machineId and ownerUuid are required",
        //             });
        //         }

        //         const result = await clearValueToZero(
        //             machineId,
        //             ownerUuid,
        //             note || "API clear to zero",
        //             actor || `api:${req.ip}`
        //         );

        //         res.json(result);
        //     } catch (error: any) {
        //         console.error("[Blockchain] clear-value error:", error);
        //         res.status(500).json({ success: false, error: error.message });
        //     }
        // });

        // === Generate QR Coupon (stores in your Redis) ===
        app.post(`${this.path}/generate-qr-coupon`, async (req, res) => {
            try {
                // const { token } = req.body;
                const token = req.body.token;
                // console.log('-----> BODY :', req.body);
                // console.log('query', req.query);


                if (!token) {
                    return res.send(PrintError('generate-qr-coupon', 'token is required', EMessage.error));
                }

                // TODO: For better performance, consider adding a hashedToken column in MachineClientID
                const mlist = await this.machineClientlist.findAll({
                    attributes: { exclude: ['photo'] }
                });

                const matchedMachine = mlist.find(v =>
                    cryptojs.SHA256(v.machineId + v.otp).toString(cryptojs.enc.Hex) === token
                );

                if (!matchedMachine?.machineId || !matchedMachine?.ownerUuid) {
                    return res.send(PrintError('generate-qr-coupon', 'Invalid machine token', EMessage.error));
                }

                const uuid = uuidv4();
                const baseUrl = process.env.SERVER_URL + "/coupon/redeem-coupon";

                // Store minimal mapping in Redis (machineId:ownerUuid)
                await redisClient.setex(
                    `vendingChange:${uuid}`,
                    5 * 60,
                    `${matchedMachine.machineId}:${matchedMachine.ownerUuid}`
                );

                const record = await findOrCreateValueRecord(
                    matchedMachine.machineId,
                    matchedMachine.ownerUuid
                );

                const payload = {
                    type: "vendingChange",
                    uuid,
                    url: baseUrl,
                    generatedAt: new Date().toISOString(),
                    record,
                };

                res.json(PrintSucceeded('generate-qr-coupon', payload, EMessage.succeeded));
            } catch (error: any) {
                console.error("[Blockchain] generate-qr-coupon error:", error);
                res.send(PrintError('generate-qr-coupon', error.message, EMessage.error));
            }
        });

        // ==================== Redeem Coupon ====================
        app.post(`${this.path}/redeem-coupon`, checkToken, async (req, res) => {
            try {
                const { uuid } = req.body;
                const ownerUuid = res.locals["ownerUuid"];

                if (!uuid) {
                    return res.send(PrintError('redeem-coupon', 'uuid is required', EMessage.error));
                }

                const qrDataRaw = await redisClient.get(`vendingChange:${uuid}`);
                if (!qrDataRaw) {
                    return res.send(PrintError('redeem-coupon', 'QR expired or invalid', EMessage.notfound));
                }

                const [machineId, machineOwnerUuid] = qrDataRaw.split(":");
                if (!machineId || !machineOwnerUuid) {
                    return res.send(PrintError('redeem-coupon', 'Invalid QR data', EMessage.error));
                }

                const record = await findOrCreateValueRecord(machineId, machineOwnerUuid);
                if (!record || record.ownerUuid !== machineOwnerUuid) {
                    return res.send(PrintError('redeem-coupon', 'Owner mismatch', EMessage.notallowed));
                }

                const clearResult = await clearValueToZero(
                    machineId,
                    machineOwnerUuid,
                    `Redeemed via QR uuid=${uuid}`,
                    `thirdparty:${ownerUuid}`
                );

                await redisClient.del(`vendingChange:${uuid}`);

                const phoneNumber = await findPhoneNumberByUuidOnUserManager(ownerUuid);

                const result = {
                    success: true,
                    uuid,
                    machineId,
                    ownerUuid: machineOwnerUuid,
                    clearedValue: clearResult.amount,
                    previousValue: clearResult.previousValue,
                    redeemedAt: new Date().toISOString(),
                    txHash: clearResult.txHash,
                };

                // Send coupon to user (fire and forget)
                if (phoneNumber) {
                    await sendCouponeToUser(phoneNumber, clearResult.amount);
                }

                console.log("[Blockchain Redeem] Result:", result);
                res.send(PrintSucceeded('redeem-coupon', result, EMessage.succeeded));
            } catch (error: any) {
                console.error("[Blockchain] redeem-coupon error:", error);
                res.send(PrintError('redeem-coupon', error.message, EMessage.error));
            }
        });

        // === Get current value + tx history (for dashboard) ===
        // GET /coupon/value?token=SHA256(machineId+otp)
        app.get(`${this.path}/value`, async (req, res) => {
            try {
                const token = req.query.token as string;

                if (!token) {
                    return res.send(PrintError('get-value', 'token is required', EMessage.error));
                }

                const mlist = await this.machineClientlist.findAll({ attributes: { exclude: ['photo'] } });
                const m = mlist.find(v =>
                    cryptojs.SHA256(v.machineId + v.otp).toString(cryptojs.enc.Hex) === token
                );

                if (!m?.machineId || !m?.ownerUuid) {
                    return res.send(PrintError('get-value', 'Invalid or unknown machine token', EMessage.error));
                }

                const record = await findOrCreateValueRecord(m.machineId, m.ownerUuid);

                res.send(PrintSucceeded('get-value', {
                    machineId: m.machineId,
                    ownerUuid: m.ownerUuid,
                    currentValue: typeof record.value === "string" ? parseFloat(record.value) : record.value,
                    data: record.data,
                    updatedAt: record.updatedAt,
                }, EMessage.succeeded));

            } catch (error: any) {
                res.send(PrintError('get-value', error.message, EMessage.error));
            }
        });
    }
}

export function checkToken(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.body.token;
        if (!token) throw new Error(EMessage.tokenNotFound);

        findRealDB(token)
            .then((ownerUuid) => {
                if (!ownerUuid) throw new Error(EMessage.notfound);
                res.locals["ownerUuid"] = ownerUuid;
                next();
            })
            .catch((e) => {
                console.log(e);
                res.status(400).end();
            });
    } catch (error) {
        console.log(error);
        res.status(400).end();
    }
}

