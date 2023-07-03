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



// REDIS SERVER
export const redisHost = process.env.REDIS_SERVER_HOST ? process.env.REDIS_SERVER_HOST : 'localhost';
export const redisPort = process.env.REDIS_SERVER_PORT ? Number(process.env.REDIS_SERVER_PORT) : 6379;
console.log(`redis host`, redisHost, `redis port`, redisPort);

// REDIS LOCAL
// export const redisHost= process.env.REDIS_LOCAL_HOST ? process.env.REDIS_LOCAL_HOST : 'localhost';
// export const redisPort = process.env.REDIS_LOCAL_PORT ? Number(process.env.REDIS_LOCAL_PORT) : 6379;

// **** 2 ***
export const redisClient = redis.createClient({ url: 'redis://' + redisHost + ':' + redisPort });


// **** 1 ***
// export const redisClient = redis.createClient({ url: process.env.REDIS_HOST + '' || 'redis://localhost:6379' });

redisClient.connect();


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
export function writeMachineSetting(machineId: string, setting: any) {
    try {
        console.log('writeMachineSetting',machineId,setting);
        
        redisClient.set('_setting_' + machineId, JSON.stringify(setting));
    } catch (error) {
        console.log('error writeMachineSetting',error);
        
    }
    
}
export function readMachineSetting(machineId: string,) {
    return redisClient.get('_setting_' + machineId);

}
// export function writeMachineLimiter(machineId: string, balance: string) {
//     redisClient.set('_limiter_' + machineId, balance);
// }
// export function readMachineLimiter(machineId: string,) {
//     return redisClient.get('_limiter_' + machineId);

// }
export function  writeACKConfirmCashIn(transactionID:string) {
    return redisClient.setEx('_ack_confirm_CashIn_' + transactionID,60*24*7, 'yes');
}
export function  readACKConfirmCashIn(transactionID:string) {
    return redisClient.get('_ack_confirm_CashIn_' + transactionID);
}
export function  removeACKConfirmCashIn(transactionID:string) {
    return redisClient.del('_ack_confirm_CashIn_' + transactionID);
}
export function writeMerchantLimiterBalance(ownerUuid: string, balance: string) {
    redisClient.set('_limiter_balance_' + ownerUuid, balance);
}
export function readMerchantLimiterBalance(ownerUuid:string) {
    return redisClient.get('_limiter_balance_' + ownerUuid);

}
export function writeMachineBalance(machineId: string, balance: string) {
    redisClient.set('_balance_' + machineId, balance);
}
export function readMachineBalance(machineId: string,) {
    return redisClient.get('_balance_' + machineId);

}
export function readMachineSale(machineId: string) {
    // return redisClient.get('_machineSale_' + machineId);
    try {
        const p =path.normalize(__dirname+'../'+machineId);
        return fs.readFileSync(p,{encoding:'utf-8'});
    } catch (error) {
            console.log('errro readMachineSale',error);
            
    }
    return '';
    
}
export function writeMachineSale(machineId: string,value:string) {
    // return redisClient.set('_machineSale_' + machineId,value);
    try {
        const p =path.normalize(__dirname+'../'+machineId);
        fs.writeFileSync(p,value,{encoding:'utf-8'});
        return p;
    } catch (error) {
        console.log('errro writeMachineSale',error);
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
    console.log('m', m);
    fs.appendFileSync(logs, JSON.stringify({ m, position, time: new Date() }), { flag: 'a+' });
}
export function writeErrorLogs(m: string, e: any) {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = process.env._log_path + `/e_${da}.json`;
    console.log('error', m);

    fs.appendFileSync(logs, JSON.stringify({ m, e, time: new Date() }), { flag: 'a+' });
}
export function  hex2dec(hex: string) {
    try {
        return parseInt(hex, 16);
    } catch (error) {
        return -1;
    }

}
export interface IMachineStatus{lastUpdate:Date,machineId:string,billStatus:string,coinStatus:string,cardStatus:string,tempconrollerStatus:string,temp:string,doorStatus:string,billChangeValue:string,coinChangeValue:string,machineIMEI:string,allMachineTemp:string}

export function  machineStatus(x:string):IMachineStatus{
    let y:any;
    let b = ''
    console.log('xxxxxx',x);
    
    try {
      y= JSON.parse(x);
     b = y.b;
    } catch (error) {
      console.log('error',error);
      return {} as IMachineStatus;
    }
    // fafb52215400010000130000000000000000003030303030303030303013aaaaaaaaaaaaaa8d
    // fafb52
    // 21 //len
    // 54 // series
    const billStatus =b.substring(10,12);
    // 00 // bill acceptor
    const coinStatus=b.substring(12,14);
    // 01 // coin acceptor
   const cardStatus= b.substring(14,16);
    // 00 // card reader status
    const tempconrollerStatus= b.substring(16,18);
    // 00 // tem controller status
    const temp= b.substring(18,20);
    // 13 // temp
    const doorStatus= b.substring(20,22);
    // 00 // door 
    const billChangeValue= b.substring(22,30);
    // 00000000 // bill change
    const coinChangeValue=b.substring(30,38);
    // 00000000 // coin change
    const machineIMEI= b.substring(38,58);
    // 30303030303030303030
    const allMachineTemp= b.substring(58,74);
    // 13aaaaaaaaaaaaaa8d
    // // fafb header
    // // 52 command
    // // 01 length
    // // Communication number+ 
    // '00'//Bill acceptor status+ 
    // '00'//Coin acceptor status+ 
    // '00'// Card reader status+
    // '00'// Temperature controller status+ 
    // '00'// Temperature+ 
    // '00'// Door status+ 
    // '00 00 00 00'// Bill change(4 byte)+ 
    // '00 00 00 00'// Coin change(4 byte)+ 
    // '00 00 00 00 00 00 00 00 00 00'//Machine ID number (10 byte) + 
    // '00 00 00 00 00 00 00 00'// Machine temperature (8 byte, starts from the master machine. 0xaa Temperature has not been read yet) +
    // '00 00 00 00 00 00 00 00'//  Machine humidity (8 byte, start from master machine)
    return {lastUpdate:new Date(y.t),billStatus,coinStatus,cardStatus,tempconrollerStatus,temp,doorStatus,billChangeValue,coinChangeValue,machineIMEI,allMachineTemp} as IMachineStatus
  }

export async function readMachineStatus(machineId:string){
    const x = await redisClient.get('_machinestatus_'+machineId);
    return machineStatus( x);
}
export function writeMachineStatus(machineId: string, b: any) {
    redisClient.set('_machinestatus_' + machineId, JSON.stringify({b,t:new Date()}));
}
export function getNanoSecTime() {
    var hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}
export const USERMANAGER_URL = 'https://nocnoc-api.laoapps.com';

export const LAAB_URL = 'http://localhost:30000';
