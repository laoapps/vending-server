import * as redis from 'redis';
import axios from "axios";
import { v4 as uuid4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { EMACHINE_COMMAND, EMessage, IMachineClientID, IReqModel, IResModel } from '../entities/system.model';
import moment from 'moment';
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from 'ws-heartbeat/server';

const _default_format = 'YYYY-MM-DD HH:mm:ss';
export const getNow = () => moment().format(_default_format);


export const redisClient = redis.createClient({ url: process.env.REDIS_HOST + '' || 'localhost' });
export enum RedisKeys {
    storenamebyprofileuuid = 'store_name_by_profileuuid_',
}

export function PrintSucceeded(command: string, data: any, message: string, transactionID: number = -1, code: string = '0'): IResModel {
    return {
        command, data, message, code, status: 1, transactionID
    } as IResModel;
}
export function PrintError(command: string, data: any, message: string, transactionID: number = -1, code: string = '0'): IResModel {
    return {
        command, data: data, message, code, status: 0, transactionID
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

                        ws.send(JSON.stringify(PrintSucceeded(comm, d, EMessage.succeeded)));
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

export function signinOnUserManager(data: { phonenumber: string, password: string }): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        try {
            const findUserNameByPhonenumberParams: any = {
                object: "authorize",
                method: "findUserNameByPhoneNumber",
                data: {
                    phoneNumber: data.phonenumber,
                    service: process.env.name
                }
            }

            const getUsername = await axios.post(USERMANAGER_URL, findUserNameByPhonenumberParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.backendKey + '' } });
            if (getUsername.data.status != 1) return resolve(EMessage.notfound);

            let loginParams: any = {
                object: "authorize",
                method: "login",
                data: {
                    username: getUsername.data.data[0].username,
                    password: data.password,
                    service: process.env.name
                }
            }

            const login = await axios.post(USERMANAGER_URL, loginParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.backendKey + '' } });
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
                    service: process.env.name,
                    phoneNumber
                }
            }
            console.log('param', validateParams);

            const validated = await axios.post(USERMANAGER_URL, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.backendKey + '' } });
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
                    service: process.env.name,
                    phoneNumber
                }
            }
            console.log('param', validateParams);

            const validated = await axios.post(USERMANAGER_URL, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.backendKey + '' } });
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
                    service: process.env.name,
                    uuid
                }
            }
            console.log('param', validateParams);

            const validated = await axios.post(USERMANAGER_URL, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.backendKey + '' } });
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
                    service: process.env.name,
                    token
                }
            }
            console.log('param', validateParams);

            const validated = await axios.post(USERMANAGER_URL, validateParams, { headers: { 'Content-Type': 'application/json', 'BackendKey': process.env.backendKey + '' } });
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
export function getSucceededRecordLog(da = moment().year() + '_' + moment().month() + '_' + moment().date()) {
    
    const logs = __dirname + `/logs/results_${da}.json`;
    return fs.readFileSync(logs).toString();
}
export function writeSucceededRecordLog(m, position) {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = __dirname + `/logs/results_${da}.json`;
    fs.appendFileSync(logs, JSON.stringify({ m, position, time: new Date() }), { flag: 'a+' });
}
export function writeLogs(m, position,name='g_') {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = __dirname + `/logs/${name}_${da}.json`;

    fs.appendFileSync(logs, JSON.stringify({ m, position, time: new Date() }), { flag: 'a+' });
}
export const USERMANAGER_URL = 'https://nocnoc-api.laoapps.com';

export const LAAB_URL = 'http://localhost:30000';
