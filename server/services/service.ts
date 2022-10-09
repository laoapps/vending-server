import * as redis from 'redis';
import axios from "axios";
import { v4 as uuid4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { EMACHINE_COMMAND, EMessage, IMachineClientID, IReqModel, IResModel } from '../entities/syste.model';
import moment from 'moment';
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from 'ws-heartbeat/server';

const _default_format = 'YYYY-MM-DD HH:mm:ss';
export const getNow = () => moment().format(_default_format);
// export const redisClient = redis.createClient({ url: process.env.DATABASE_HOST + '' || 'localhost' });
export enum RedisKeys {
    storenamebyprofileuuid = 'store_name_by_profileuuid_',
}

export function PrintSucceeded(command: string, data: any, message: string, code: string = '0'): IResModel {
    return {
        command, data, message, code, status: 1
    } as IResModel;
}
export function PrintError(command: string, data: any, message: string, code: string = '0'): IResModel {
    return {
        command, data: data, message, code, status: 0
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
