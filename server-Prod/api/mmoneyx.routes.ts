import express, { NextFunction, Request, Response } from "express";
import { findRealDB, findUuidByPhoneNumberOnUserManager, PrintError, PrintSucceeded } from "../services/service"; // Your existing redisClient
import { EEntity, EMessage } from "../entities/system.model";
import { MachineClientIDFactory } from "../entities/machineclientid.entity";
import { dbConnection } from "../entities";
import axios from "axios";


export class MmoneyxAPI {
    path = '/mmoneyx';
    machineClientlist = MachineClientIDFactory(
        EEntity.machineclientid,
        dbConnection
    );
    constructor(app: express.Router) {
        this.mmoneyxRoutes(app);
        console.log("[MmoneyxAPI] Routes registered");
    }

    private mmoneyxRoutes(app: express.Router): void {
        // === Add value to blockchain ===
        app.post(`${this.path}/mmoneyxRoutes`,
            checkToken,
            checkSuperAdmin,
            async (req, res) => {
                try {
                    const { user_id, starDate, endDate } = req.body;

                    if (!user_id || !starDate || endDate) {
                        return res.send(PrintError('mmoneyxRoutes', {}, EMessage.bodyIsEmpty));
                    }
                    const url = 'https://gateway.ltcdev.la/PartnerVending/GetTransIn';
                    const body = {
                        user_id: user_id,
                        starDate: starDate,
                        endDate: endDate
                    };
                    const result = await axios.post(url, body, {
                        headers: {
                            'Content-Type': 'application/json',
                            'api-key': process.env.MMONEYX_APIKEY
                        }
                    });

                    res.send(PrintSucceeded('add-value', result.data, EMessage.succeeded));
                } catch (error: any) {
                    console.error("[Blockchain] add-value error:", error);
                    res.send(PrintError('add-value', error.message, EMessage.error));
                }
            });
    }
}

export function checkToken(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers.token.toString();
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
export function checkSuperAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        // console.log('checkSupAdmin');
        const token = req.headers.token.toString();
        const secret = req.body.secret;
        let phoneNumber = req.body.shopPhonenumber;
        if (!token) throw new Error(EMessage.tokenNotFound);

        findRealDB(token).then((r) => {
            const uuid = r;
            if (!uuid) throw new Error(EMessage.notfound);
            // req['gamerUuid'] = gamerUuid;
            res.locals["superadmin"] = uuid;
            if (secret == 'e2f48898-3453-4214-9025-27e905b269d9') {
                res.locals["secret"] = uuid;
            }
            if (phoneNumber && secret == 'e2f48898-3453-4214-9025-27e905b269d9') {
                phoneNumber = `+85620${phoneNumber}`;
                findUuidByPhoneNumberOnUserManager(phoneNumber).then(r_owneruuid => {
                    res.locals["ownerUuid"] = r_owneruuid.uuid;
                    next();
                });
            } else {
                res.locals["ownerUuid"] = uuid;
                next();
            }
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