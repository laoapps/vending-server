import axios from 'axios';
import express, { Router } from 'express';
import { EMessage, EESSP_COMMANDS, IReqModel, IResModel } from '../entities/syste.model';
const sspLib = require('encrypted-smiley-secure-protocol');
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from "ws-heartbeat/server";
import { initWs, PrintError, PrintSucceeded, wsSendToClient } from '../sevices/service';
export class KiosServer {
    wss: WebSocketServer.Server;
    constructor(router: Router,wss: WebSocketServer.Server) {
        
        initWs(wss);
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
                if(!Object.keys(EESSP_COMMANDS).includes(command))throw new Error(EMessage.commandnotfound)
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
                wsSendToClient(wss, EMessage.all,'LAST_REJECT_CODE', result, true);
            })
        })
        eSSP.on('READ_NOTE', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'READ_NOTE', result, true);
        })

        eSSP.on('EMPTIED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'EMPTIED', result, true);
        })
        eSSP.on('DISPENSING', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'DISPENSING', result, true);
        })
        eSSP.on('CASHBOX_REPLACED', result => {
            console.log(result)
             wsSendToClient(wss, EMessage.all,'CASHBOX_REPLACED', result, true);
        })
        eSSP.command('SET_BAUD_RATE', {
            baudrate: 9600, // 9600|38400|115200
            reset_to_default_on_reset: true
        })
        eSSP.open('/dev/ttyS0')
        // eSSP.open('COM1');

    }



   

    

}
