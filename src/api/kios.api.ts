import axios from 'axios';
import express, { Router } from 'express';
import { EMessage, IReqModel, IResModel } from '../entities/syste.model';
const sspLib = require('encrypted-smiley-secure-protocol');
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from "ws-heartbeat/server";
import { PrintError, PrintSucceeded } from '../sevices/service';
export class KiosServer {
    wss: WebSocketServer.Server;
    constructor(router: Router,wss: WebSocketServer.Server) {
        
        this.initWs(wss);
        this.wss = wss;
        let eSSP = new sspLib({
            id: 0x00,
            debug: false,
            timeout: 3000,
            fixedKey: '0123456701234567'
        });
        router.post('/command', async (req, res) => {
            const command = req.query['command']+'';
            try {
                
                eSSP.command(command)
                    .then(result => {
                        console.log('Serial number:', result.info.serial_number)
                        res.send(PrintSucceeded(command,result,EMessage.succeeded));
                    });
            } catch (error) {
                console.log(error);
                res.send(PrintError(command,error,EMessage.error));
            }
        })


       

        eSSP.on('READ_NOTE', result => {
            console.log(result)
        })

        eSSP.on('OPEN', () => {
            console.log('open');
        
            eSSP.command('SYNC')
            .then(() => eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 }))
            .then(() => eSSP.initEncryption())
            .then(() => eSSP.command('GET_SERIAL_NUMBER'))
            .then(result => {
                console.log('SERIAL NUMBER:', result.info.serial_number)
                return;
            })
            .then(() => eSSP.enable())
            .then(result => {
                if(result.status == 'OK'){
                    console.log('Device is active')
                }
                return;
            })
        })
        
        eSSP.on('NOTE_REJECTED', result => {
            console.log('NOTE_REJECTED', result);
        
            eSSP.command('LAST_REJECT_CODE')
            .then(result => {
                console.log(result)
                this.wsSendToClient(wss, EMessage.all, result, true);
            })
        })
        eSSP.on('READ_NOTE', result => {
            console.log(result)
            this.wsSendToClient(wss, EMessage.all, result, true);
        })

        eSSP.on('EMPTIED', result => {
            console.log(result)
            this.wsSendToClient(wss, EMessage.all, result, true);
        })
        eSSP.on('DISPENSING', result => {
            console.log(result)
            this.wsSendToClient(wss, EMessage.all, result, true);
        })
        eSSP.on('CASHBOX_REPLACED', result => {
            console.log(result)
             this.wsSendToClient(wss, EMessage.all, result, true);
        })
        
        eSSP.open('COM1');

    }



    initWs(wss: WebSocketServer.Server) {
        setWsHeartbeat(wss, (ws, data, binary) => {
            if (data === '{"kind":"ping"}') { // send pong if recieved a ping.
                ws.send('{"kind":"pong"}');
            }
        }, 30000);

        wss.on('connection', (ws: WebSocket) => {
            console.log('new connection ', ws.url);

            console.log('current connection is alive', ws['isAlive']);
            const that = this;


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
                   
                } catch (error) {
                    console.log('message', error);
                    ws.send(JSON.stringify(d));
                }
            }
        });
    }

    broadCast(wss: WebSocketServer.WebSocketServer, r: any,delay: boolean = false) {
        const d = {} as IResModel;
        d.data = r;
        console.log('send ws to client ', d);
        this.wsSendToClient(wss, EMessage.all, d, delay);
    }

    wsSendToClient(wss: WebSocketServer.Server, uuid: string, d: any, delay: boolean = false) {
        setTimeout(() => {
            wss.clients.forEach(ws => {
                if (ws) {
                    if (ws.readyState === 1) {
                        if (ws['ownerUuid'] + '' == uuid || uuid == EMessage.all) {
                            //d.data = x;
                            console.log('sending to ', uuid);

                            ws.send(JSON.stringify(d));
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

}
