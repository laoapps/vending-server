
import axios from "axios";


import { EMessage, IReqModel, IResModel } from '../entities/syste.model';

import * as WebSocketServer from 'ws';
import moment from "moment";
import fs from 'fs';

const _default_format = 'YYYY-MM-DD HH:mm:ss';


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
export function int2hex(i: number) {
    const str = Number(i).toString(16);
    return str.length === 1 ? '0' + str : str;
}
export function initWs(wss: WebSocketServer.Server) {
    // setWsHeartbeat(wss, (ws, data, binary) => {
    //     if (data === '{"kind":"ping"}') { // send pong if recieved a ping.
    //         ws.send(JSON.stringify(PrintSucceeded('pong', { kind: 'ping' }, EMessage.succeeded)));

    //     }
    // }, 30000);

    wss.on('connection', (ws: WebSocket) => {
        console.log('new connection ', ws.url);

        console.log('current connection is alive', ws['isAlive']);



        ws.onopen = (ev: Event) => {
            console.log('open', ev);
            // ws['isAlive'] = true;
        }
        ws.onclose = (ev: CloseEvent) => {

        }
        ws.onerror = (ev: Event) => {
            console.log('error', ev);
        }

        //connection is up, let's add a simple simple event
        ws.onmessage = async (ev: MessageEvent) => {
            let d: IReqModel = {} as IReqModel;
            // ws['isAlive'] = true;
            try {
                console.log('comming', ev.data);

                d = JSON.parse(ev.data) as IReqModel;
                ws.send(JSON.stringify(PrintSucceeded('', d, EMessage.succeeded)));

            } catch (error) {
                console.log('message', error);
                ws.send(JSON.stringify(PrintSucceeded('', d, EMessage.succeeded)));

            }
        }
    });
}

export function xORChecksum(array = new Array<any>()) {
    return array.reduce((checksum, item) =>
        checksum ^ parseInt(item, 16)
        , 0)
}
export function chk8xor(byteArray = new Array<any>()) {
    let checksum = 0x00
    for (let i = 0; i < byteArray.length - 1; i++)
        checksum ^= parseInt(byteArray[i].replace(/^#/, ''), 16)
    const x =checksum.toString(16);
    if(x.length==1)return '0'+x;
    return x;
}

//    short crc = 0;
//         for(int i=offset; i < offset+ len; i++)
//         {
//             crc ^=data[i];
//         }
//         return (short) (crc & 0xff);
function toHex(str: string) {
    var result = '';
    for (var i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16);
    }
    return result;
}
function fromHex(hex: string) {
    let str='';
    try {
        str = decodeURIComponent(hex.replace(/(..)/g, '%$1'))
    }
    catch (e) {
        str = hex
        console.log('invalid hex input: ' + hex)
    }
    return str
}

export function writeSucceededRecordLog(m, position) {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = process.env._log_path + `/results_${da}.json`;
    fs.appendFileSync(logs, JSON.stringify({ m, position, time: new Date() }), { flag: 'a+' });
}
export function writeLogs(m, position,name='g_') {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = process.env._log_path + `/${name}_${da}.json`;
    console.log('m',m);
    fs.appendFileSync(logs, JSON.stringify({ m, position, time: new Date() }), { flag: 'a+' });
}
export function writeErrorLogs(m:string,e:any) {
    const da = moment().year() + '_' + moment().month() + '_' + moment().date();
    const logs = process.env._log_path + `/e_${da}.json`;
    console.log('error',m);
    
    fs.appendFileSync(logs, JSON.stringify({ m,e, time: new Date() }), { flag: 'a+' });
}
