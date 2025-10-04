import Redis from 'ioredis';
import axios from "axios";
import { v4 as uuid4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import crypto, { hash } from 'crypto';
import { EMACHINE_COMMAND, EMessage, IMachineClientID, IReqModel, IResModel, IMachineStatus, IVendingEventLog, EEntity } from '../entities/system.model';
import moment from 'moment';
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from 'ws-heartbeat/server';
import { Request, Response } from 'express';
import { dbConnection, logEntity, vendingMachineEntity } from '../entities';
import { MachineSaleFactory } from '../entities/machinesale.entity';
import https from 'https';
import { hashSync } from 'bcryptjs';
import { VendingEventLogFactory } from '../entities/vendingevents.entity';

const _default_format = 'YYYY-MM-DD HH:mm:ss';
export const getNow = () => moment().format(_default_format);



// REDIS SERVER
export const redisHost = process.env.REDIS_SERVER_HOST ? process.env.REDIS_SERVER_HOST : 'localhost';
export const redisPort = process.env.REDIS_SERVER_PORT ? Number(process.env.REDIS_SERVER_PORT) : 6379;
console.log(`redis host`, redisHost, `redis port`, redisPort);

// REDIS LOCAL
// export const redisHost= process.env.REDIS_LOCAL_HOST ? process.env.REDIS_LOCAL_HOST : 'localhost';
// export const redisPort = process.env.REDIS_LOCAL_PORT ? Number(process.env.REDIS_LOCAL_PORT) : 6379;

// **** 2 ***

export const redisClient = new Redis('redis://' + redisHost + ':' + redisPort);


// **** 1 ***
// export const redisClient = redis.createClient({ url: process.env.REDIS_HOST + '' || 'redis://localhost:6379' });

// redisClient.connect();


export enum RedisKeys {
    storenamebyprofileuuid = 'store_name_by_profileuuid_',
}
export function returnLog(req: Request, res: Response, error = false) {
    return { superadmin: res.locals['superadmin'] + '', subadmin: res.locals['subadmin'] + '', ownerUuid: res.locals['ownerUuid'] + '', url: req.protocol + "://" + req.get('host') + req.originalUrl, body: req.body, error }
}
export function logUserActivity(data: { superadmin: string, subadmin: string, ownerUuid: string, url: string, body: any, error: boolean }) {
    try {
        const superadmin = data?.superadmin;
        const subadmin = data?.subadmin;
        const ownerUuid = data?.ownerUuid;
        const url = data?.url;
        const body = data?.body;
        const error = data?.error;
        logEntity.create({ superadmin, subadmin, ownerUuid, url, body, error })
        // const url =req.protocol + "://" + req.get('host') + req.originalUrl;
        // if (data.ownerUuid) {
        //     if (data.superadmin) {

        //     } 
        //     else if (data.subadmin) {

        //     } 
        //     //....
        // } 
    } catch (error) {
        console.log(error);
    }
}
export function PrintSucceeded(command: string, data: any, message: string, log: { superadmin: string, subadmin: string, ownerUuid: string, url: string, body: any, error: boolean } = null, transactionID: number = -1, code: string = '0'): IResModel {
    if (log)
        logUserActivity(log);
    return {
        command, data, message, code, status: 1, transactionID: transactionID + ''
    } as IResModel;
}
export function PrintError(command: string, data: any, message: string, log: { superadmin: string, subadmin: string, ownerUuid: string, url: string, body: any, error: boolean } = null, transactionID: number = -1, code: string = '0'): IResModel {
    logUserActivity(log);
    return {
        command, data: data, message, code, status: 0, transactionID: transactionID + ''
    } as IResModel;
}
export function broadCast(wss: WebSocketServer.WebSocketServer, comm: string, r: any, delay: boolean = false) {
    const d = {} as IResModel;
    d.data = r;
    console.log('send ws to client ', d);
    wsSendToClient(wss, EMessage.all, comm, d, delay);
}

export function wsSendToClient(wss: WebSocketServer.Server, comm: string, uuid: string, d: any, delay: boolean = false) {
    setTimeout(() => {
        wss.clients.forEach(ws => {
            if (ws) {
                if (ws.readyState === 1) {
                    if (ws['ownerUuid'] + '' == uuid || uuid == EMessage.all) {
                        //d.data = x;
                        console.log('sending to ', uuid);

                        ws.send(JSON.stringify(PrintSucceeded(comm, d, EMessage.succeeded, null)));
                        return;
                    }
                }
                else {
                    console.log('client ', ws['ownerUuid'], ws.readyState);

                }
            }

        });
    }, delay ? 1000 : 0);

}


// export function xORChecksum(array = new Array<any>()) {
//     return array.reduce((checksum, item) =>
//         checksum ^ parseInt(item, 16)
//         , 0)
// }
// export function  chk8xor(byteArray=new Array<any>()) {
//     let checksum = 0x00
//     for(let i = 0; i < byteArray.length - 1; i++)
//       checksum ^= byteArray[i]
//     return Number(checksum.toString(16))
//   }

export function generateChecksum(str: string, algorithm = '', encoding = null) {
    return crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex');
}

export function signinOnUserManager(data: { phonenumber: string, password: string }): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const findUserNameByPhonenumberParams: any = {
                object: "authorize",
                method: "findUserNameByPhoneNumber",
                data: {
                    phoneNumber: data.phonenumber,
                    service: process.env.SERVICE_NAME
                }
            }

            const getUsername = await axios.post(USERMANAGER_URL, findUserNameByPhonenumberParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.SERVICE_BACKEND_KEY + '' } });
            if (getUsername.data.status != 1) return resolve(EMessage.notfound);

            let loginParams: any = {
                object: "authorize",
                method: "login",
                data: {
                    username: getUsername.data.data[0].username,
                    password: data.password,
                    service: process.env.SERVICE_NAME
                }
            }

            const login = await axios.post(USERMANAGER_URL, loginParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.SERVICE_BACKEND_KEY + '' } });
            if (login.data.status != 1) return reject(EMessage.loginfailed);

            const userInfo: any = {
                uuid: login.data.data.user.uuid,
                phonenumber: login.data.data.user.phoneNumber,
                token: login.data.data.token,
                status: 1
            }

            resolve(userInfo);


        } catch (error) {
            reject(error);
        }
    });
}
export function checkPhoneNumberOnUserManager(phoneNumber: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const validateParams: any = {
                object: "authorize",
                method: "checkPhoneNumber",
                data: {
                    service: process.env.SERVICE_NAME,
                    phoneNumber
                }
            }
            console.log('param', validateParams);

            const validated = await axios.post(USERMANAGER_URL, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.SERVICE_BACKEND_KEY + '' } });
            console.log('phoneNumber', validated.data);//

            if (validated.data.status != 1) return resolve('');
            resolve(validated.data.data[0]);//{uuid:string,phoneNumber:string}
        } catch (error) {
            reject(error);
        }
    });
}
export function findUuidByPhoneNumberOnUserManager(phoneNumber: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const validateParams: any = {
                object: "authorize",
                method: "findUuidByPhoneNumber",
                data: {
                    service: process.env.SERVICE_NAME,
                    phoneNumber
                }
            }
            console.log('param', validateParams);

            const validated = await axios.post(USERMANAGER_URL, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.SERVICE_BACKEND_KEY + '' } });
            console.log('phoneNumber', validated.data);//

            if (validated.data.status != 1) return resolve('');
            resolve(validated.data.data[0]);//{uuid:string,phoneNumber:string}
        } catch (error) {
            reject(error);
        }
    });
}
export function findPhoneNumberByUuidOnUserManager(uuid: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const validateParams: any = {
                object: "authorize",
                method: "findPhoneNumberByUuid",
                data: {
                    service: process.env.SERVICE_NAME,
                    uuid
                }
            }
            console.log('param', validateParams);

            const validated = await axios.post(USERMANAGER_URL, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.SERVICE_BACKEND_KEY + '' } });
            console.log('phoneNumber', validated.data);//

            if (validated.data.status != 1) return resolve('');
            resolve(validated.data.data[0]);//{uuid:string,phoneNumber:string}
        } catch (error) {
            reject(error);
        }
    });
}
export function validateTokenOnUserManager(token: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {


            const validateParams: any = {
                object: "authorize",
                method: "validateToken",
                data: {
                    service: process.env.SERVICE_NAME,
                    token
                }
            }
            console.log('param', validateParams);

            const validated = await axios.post(USERMANAGER_URL, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.SERVICE_BACKEND_KEY + '' } });
            console.log('validated', validated.data);

            if (validated.data.status != 1) return resolve('');
            resolve(validated.data.data);//uuid
        } catch (error) {
            reject(error);
        }
    });
}

export function setVendingEvent(event: string, data: IVendingEventLog): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
        try {
            redisClient.set(event, JSON.stringify(data));
            await vendingMachineEntity.create(data);
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}
export function getVendingEvent(event: string): Promise<IVendingEventLog> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            redisClient.get(event, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result ? JSON.parse(result) : null);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}
export function listVendingEventLogs(machineId: string, date: number, month: number, year: number, offset = 0, limit = 100): Promise<{ rows: IVendingEventLog[], count: number }> {
    return new Promise<{ rows: IVendingEventLog[], count: number }>(async (resolve, reject) => {
        try {
            const r = await vendingMachineEntity.findAndCountAll({ where: { machineId, date, month, year }, order: [['createdAt', 'DESC']], limit, offset });
            resolve(r);
        } catch (error) {
            reject(error);
        }
    })
}


export function generateTokenOnUserManager(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const url = 'https://laabx-api.laoapps.com/api/v1/admin/AdminLogin';
            const validateParams: any = {
                username: 'v2',
                password: '76901806'
            }
            console.log('param', validateParams);

            const validated = await axios.post(url, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.SERVICE_BACKEND_KEY + '' } });
            console.log('validated', validated.data);

            if (validated.data.status != 1) return resolve('');
            resolve(validated.data.data);//uuid
        } catch (error) {
            reject(error);
        }
    });
}

export function isTokenValidOnUserManager(token: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const validateParams: any = {
                object: "authorize",
                method: "isTokenValid",
                data: {
                    token
                }
            }
            const validated = await axios.post(USERMANAGER_URL, validateParams);
            if (validated.data.status != 1) return resolve(EMessage.notfound);
            resolve(validated.data.data); // true or false
        } catch (error) {
            reject(error);
        }
    });
}

export function findRealDB(token: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        console.log('validate token on usermanager');

        validateTokenOnUserManager(token).then(r => {
            console.log('validate token on usermanager', r[0]);
            resolve(r[0]);
        }).catch(e => {
            resolve('')
        })
    })
}
export function writeDoorDone(key: string, v: string) {
    return redisClient.setex(key + '_doordone_', 60 * 1, v);

}
export function readDoorDone(key: string) {
    return redisClient.get(key + '_doordone_');

}

export function writeActiveMmoneyUser(key: string, v: string) {
    return redisClient.setex(key + '_mmoneyuser_', 30, v);

}
export function readActiveMmoneyUser(key: string) {
    return redisClient.get(key + '_mmoneyuser_');

}
export function writeMachineSetting(machineId: string, setting: any) {
    try {
        // console.log('writeMachineSetting',machineId,setting);

        return redisClient.set('_setting_' + machineId, JSON.stringify(setting));
    } catch (error) {
        console.log('error writeMachineSetting', error);

    }

}

export function writeMachineSettingVersion(machineId: string, obj: Object) {
    try {
        // console.log('writeMachineSetting',machineId,setting);
        return redisClient.set('_setting_version_' + machineId, hashSync(JSON.stringify(obj)));
    } catch (error) {
        console.log('error writeMachineSetting', error);

    }
}
// ads
export async function readMachineAds(machineId: string) {
    try {
        // console.log('writeMachineSetting',machineId,setting);
        let x: any = await redisClient.get('_ads_machine_' + machineId);
        if (!x) {
            x = [];
        }
        return JSON.parse(x);;
    } catch (error) {
        console.log('error writeMachineSetting', error);

    }
}
export async function writeMachineAds(machineId: string, ads: Object) {
    try {
        // console.log('writeMachineSetting',machineId,setting);
        return await redisClient.set('_ads_machine_' + machineId, JSON.stringify(Object));
    } catch (error) {
        console.log('error writeMachineSetting', error);

    }
}



export async function readMachineSettingVersion(machineId: string) {
    try {
        // console.log('writeMachineSetting',machineId,setting);
        return await redisClient.get('_setting_version_' + machineId);
    } catch (error) {
        console.log('error writeMachineSetting', error);

    }
}

///ads
export function writeMachineAdsVersion(machineId: string, obj: Object) {
    try {
        // console.log('writeMachineSetting',machineId,setting);
        return redisClient.set('_ads_version_' + machineId, hashSync(JSON.stringify(obj)));
    } catch (error) {
        console.log('error writeMachineSetting', error);

    }
}
export async function readMachineAdsVersion(machineId: string) {
    try {
        // console.log('writeMachineSetting',machineId,setting);
        return await redisClient.get('_ads_version_' + machineId);
    } catch (error) {
        console.log('error writeMachineSetting', error);

    }
}




export function readMachineSetting(machineId: string,) {
    return redisClient.get('_setting_' + machineId);

}

export function readMachineLimiterBalance(machineId: string,) {
    return redisClient.get('_limiter_machine_balance_' + machineId);

}
export function writeMachineLimiterBalance(machineId: string, value: string) {
    return redisClient.set('_limiter_machine_balance_' + machineId, value + '');

}
// export function writeMachineLimiter(machineId: string, balance: string) {
//     redisClient.set('_limiter_' + machineId, balance);
// }
// export function readMachineLimiter(machineId: string,) {
//     return redisClient.get('_limiter_' + machineId);

// }
export function writeACKConfirmCashIn(transactionID: string) {
    return redisClient.setex('_ack_confirm_CashIn_' + transactionID, 60 * 24 * 7, 'yes');
}
export function readACKConfirmCashIn(transactionID: string) {
    return redisClient.get('_ack_confirm_CashIn_' + transactionID);
}
export function removeACKConfirmCashIn(transactionID: string) {
    return redisClient.del('_ack_confirm_CashIn_' + transactionID);
}
export function writeMerchantLimiterBalance(ownerUuid: string, balance: string) {
    return redisClient.set('_limiter_balance_' + ownerUuid, balance);
}
export function readMerchantLimiterBalance(ownerUuid: string) {
    return redisClient.get('_limiter_balance_' + ownerUuid);

}
export function writeMachineBalance(machineId: string, balance: string) {
    return redisClient.set('_balance_' + machineId, balance);
}
export function readMachineBalance(machineId: string,) {
    return redisClient.get('_balance_' + machineId);

}
export function readMachineSale(machineId: string) {
    // return redisClient.get('_machineSale_' + machineId);
    try {
        // const p =path.resolve(__dirname, '..');
        // console.log('path readMachineSale',p);

        // return fs.readFileSync(p+'/'+machineId,{encoding:'utf-8'});
        console.log();

        return redisClient.get('_MachineSale_' + machineId);
    } catch (error) {
        console.log('errro readMachineSale', error);

    }
    return '';

}
export function listMachineSaleLog(machineId: string, offset = 0, limit = 100) {
    const ent = MachineSaleFactory('MachineSale_' + machineId, logEntity.sequelize);
    return ent.findAndCountAll({ where: { machineId }, order: [['createdAt', 'DESC']], limit, offset });
}
export async function logMachineSale(machineId: string, value: string) {
    const ent = MachineSaleFactory('MachineSale_' + machineId, logEntity.sequelize);
    await ent.sync();
    return ent.create({ machineId, sale: value });
}
export function writeMachineSale(machineId: string, value: string) {
    // return redisClient.set('_machineSale_' + machineId,value);
    try {
        logMachineSale(machineId, value).then(r => {
            console.log('logMachineSale', r);
        }).catch(e => {
            console.log('error logMachineSale', e);
        });
        redisClient.set('_MachineSale_' + machineId, value);
        // console.log(`write la der`, value);
        return machineId;
    } catch (error) {
        console.log('errro writeMachineSale', error);
    }
    return '';

}

export function getSucceededRecordLog(da = moment().year() + '_' + moment().month() + '_' + moment().date()) {

    const logs = process.env._log_path + `/results_${da}.json`;
    return fs.readFileSync(logs).toString();
}
export function writeSucceededRecordLog(m, position) {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = process.env._log_path + `/results_${da}.json`;
    fs.appendFileSync(logs, JSON.stringify({ m, position, time: new Date() }), { flag: 'a+' });
}
export function writeLogs(m, position, name = 'g_') {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = process.env._log_path + `/${name}_${da}.json`;
    // console.log('m', m);
    fs.appendFileSync(logs, JSON.stringify({ m, position, time: new Date() }), { flag: 'a+' });
}
export function writeErrorLogs(m: string, e: any) {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = process.env._log_path + `/e_${da}.json`;
    console.log('error', m);

    fs.appendFileSync(logs, JSON.stringify({ m, e, time: new Date() }), { flag: 'a+' });
}
export function hex2dec(hex: string) {
    try {
        return parseInt(hex, 16);
    } catch (error) {
        return -1;
    }

}

// export function machineStatus(x: string): IMachineStatus {
//     let y: any;
//     let b = ''
//     // console.log('xxxxxx',x);

//     try {
//         y = JSON.parse(x);
//         b = y.b;
//     } catch (error) {
//         //   console.log('error',error);
//         return {} as IMachineStatus;
//     }
//     // fafb52215400010000130000000000000000003030303030303030303013aaaaaaaaaaaaaa8d
//     // fafb52
//     // 21 //len
//     // 54 // series
//     const billStatus = b.substring(10, 12);
//     // 00 // bill acceptor
//     const coinStatus = b.substring(12, 14);
//     // 01 // coin acceptor
//     const cardStatus = b.substring(14, 16);
//     // 00 // card reader status
//     const tempconrollerStatus = b.substring(16, 18);
//     // 00 // tem controller status
//     const temp = b.substring(18, 20);
//     // 13 // temp
//     const doorStatus = b.substring(20, 22);
//     // 00 // door 
//     const billChangeValue = b.substring(22, 30);
//     // 00000000 // bill change
//     const coinChangeValue = b.substring(30, 38);
//     // 00000000 // coin change
//     const machineIMEI = b.substring(38, 58);
//     // 30303030303030303030
//     const allMachineTemp = b.substring(58, 74);
//     // 13aaaaaaaaaaaaaa8d
//     // // fafb header
//     // // 52 command
//     // // 01 length
//     // // Communication number+ 
//     // '00'//Bill acceptor status+ 
//     // '00'//Coin acceptor status+ 
//     // '00'// Card reader status+
//     // '00'// Temperature controller status+ 
//     // '00'// Temperature+ 
//     // '00'// Door status+ 
//     // '00 00 00 00'// Bill change(4 byte)+ 
//     // '00 00 00 00'// Coin change(4 byte)+ 
//     // '00 00 00 00 00 00 00 00 00 00'//Machine ID number (10 byte) + 
//     // '00 00 00 00 00 00 00 00'// Machine temperature (8 byte, starts from the master machine. 0xaa Temperature has not been read yet) +
//     // '00 00 00 00 00 00 00 00'//  Machine humidity (8 byte, start from master machine)
//     return { lastUpdate: new Date(y.t), billStatus, coinStatus, cardStatus, tempconrollerStatus, temp, doorStatus, billChangeValue, coinChangeValue, machineIMEI, allMachineTemp } as IMachineStatus
// }
export async function readMachineLockDrop(machineId: string) {
    return await redisClient.get('_machinelockdrop_' + machineId);
}
export function writeMachineLockDrop(machineId: string, lock = 'false') {
    redisClient.set('_machinelockdrop_' + machineId, lock ? lock : 'false');
}

export async function readMachinePendingStock(machineId: string) {
    return await redisClient.get('_machinependingstock_' + machineId);
}
export function writeMachinePendingStock(machineId: string, b: any) {
    redisClient.set('_machinependingstock_' + machineId, JSON.stringify(b));
}

export function readAminControl() {
    return redisClient.get('_amincontrol_');
}
export function setAdminControl(data = '') {
    redisClient.set('_amincontrol_', data);
}
export async function readMachineStatus(machineId: string) {
    const x = await redisClient.get('_machinestatus_' + machineId);
    return JSON.parse(x) as { b: any, t: Date };
}
export function writeMachineStatus(machineId: string, b: any) {
    redisClient.set('_machinestatus_' + machineId, JSON.stringify({ b, t: new Date() }));
}
export function getNanoSecTime() {
    var hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}
export const USERMANAGER_URL = 'https://nocnoc-api.laoapps.com';

export const LAAB_URL = 'http://localhost:30000';


export function base64ToFile(data: string, filename = moment.now(), ext = '.png') {
    let buff = Buffer.from(data, 'base64');
    fs.writeFileSync(process.env._image_path + '/' + filename + ext, buff?.toString());
    return filename + '';
}

export function convertVersion(version: string) {
    let text = version;
    let versionText: string = '';
    const parses = parseInt(text);

    if (parses > 0 && parses < 10) {
        return `0.0.${parses}`;
    }
    if (parses >= 10 && parses < 100) {
        text = text.substring(text.length - parses.toString().length - 1, text.length);
    } else {
        text = text.substring(text.length - parses.toString().length, text.length);
    }

    let s: string = '';
    for (let i = 0; i < text.length; i++) {
        s += `${text[i]}.`;
    }
    versionText = `${s}0`;
    versionText = versionText.substring(0, versionText.length - 2);
    return versionText;
}

export function parseMachineVMCStatus(hexString: string): IMachineStatus {
    // Remove any spaces or non-hex characters if present
    const cleanHex = hexString.replace(/[^0-9a-fA-F]/g, "").toLowerCase();

    // Minimum length check: header (4) + cmd (2) + len (2) + packNo (2) = 10 hex chars
    if (cleanHex.length < 10) {
        throw new Error("Packet too short");
    }

    // Verify header and command
    if (cleanHex.substring(0, 4) !== "fafb" || cleanHex.substring(4, 6) !== "52") {
        throw new Error("Invalid header or command");
    }

    // Extract length (1 byte, 2 hex chars)
    const length = parseInt(cleanHex.substring(6, 8), 16);
    const expectedDataLength = length * 2; // Length in hex chars
    const packetEnd = 8 + expectedDataLength; // End of data before checksum

    // Check if packet has enough data (including 2 chars for checksum)
    if (cleanHex.length < packetEnd + 2) {
        throw new Error(`Insufficient data: expected ${packetEnd + 2} chars, got ${cleanHex.length}`);
    }

    // Extract PackNO+Text (starts at offset 8)
    const data = cleanHex.substring(8, packetEnd);

    // Parse fields with bounds checking
    const packNo = parseInt(data.substring(0, 2), 16);
    const billStatus = parseInt(data.substring(2, 4), 16);
    const coinStatus = parseInt(data.substring(4, 6), 16);
    const cardStatus = parseInt(data.substring(6, 8), 16);
    const tempControllerStatus = parseInt(data.substring(8, 10), 16);
    const temperature = parseInt(data.substring(10, 12), 16);
    const doorStatus = parseInt(data.substring(12, 14), 16);
    const billChange = parseInt(data.substring(14, 22), 16) || 0; // Handle '00000000'
    const coinChange = parseInt(data.substring(22, 30), 16) || 0; // Handle '00000000'
    const machineIMEI = data.substring(30, 50); // 10 bytes = 20 hex chars

    // Machine temperature (8 bytes = 16 hex chars)
    let machineTemp = "";
    let machineHumidity = undefined;
    if (data.length >= 66) { // 50 + 16 = 66
        machineTemp = data.substring(50, 66);
        // Machine humidity (optional, 8 bytes = 16 hex chars)
        if (data.length >= 82) { // 66 + 16 = 82
            machineHumidity = data.substring(66, 82);
        }
    } else if (data.length >= 50) {
        // Partial temp if truncated
        machineTemp = data.substring(50);
    }

    return {
        packNo,
        billStatus,
        coinStatus,
        cardStatus,
        tempControllerStatus,
        temperature,
        doorStatus,
        billChange,
        coinChange,
        machineIMEI,
        machineTemp: machineTemp || "aaaaaaaaaaaaaaaa", // Default if missing
        machineHumidity, // Undefined if not present
        device: 'VMC',
        data: cleanHex,
    };
}

export function CheckMmoneyPaid(transactionID: string): Promise<{ status: number, message: any }> {
    return new Promise<{ status: number, message: any }>(async (resolve, reject) => {
        try {
            const agent = new https.Agent({
                rejectUnauthorized: false,
            });

            const API_BASE_URL = 'https://gateway.ltcdev.la/PartnerGenerateQR/checkTransaction';

            const authUsername = 'lmm'
            const authPassword = 'Lmm@2024qaz2wsx'

            const authToken = Buffer.from(`${authUsername}:${authPassword}`).toString('base64');

            const headers = {
                "Authorization": `Basic ${authToken}`,
                "username": 'Vendeex',
                "password": 'vendeex@2025qaz2wsx',
                "apikey": 'eb718666-b20e-4091-b964-67a61e06fffe',
                "Content-Type": 'application/json'
            }

            const res = await axios.post(API_BASE_URL, {
                tranid: transactionID
            },
                { headers, httpsAgent: agent }).then(res => {
                    if (res.data.success) {
                        resolve({ status: 1, message: res.data });
                    } else {
                        resolve({ status: 0, message: res.data });
                    }
                }).catch(e => {
                    resolve({ status: 0, message: e });
                });

        } catch (error) {
            console.log('==========>  Error save log is :', error);
            resolve({ status: 0, message: error })
        }
    })
}