import axios from 'axios';
import express, { Router } from 'express';
import { EMessage, EESSP_COMMANDS, IReqModel, IResModel } from '../entities/syste.model';
const sspLib = require('encrypted-smiley-secure-protocol');
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from "ws-heartbeat/server";
import { initWs, PrintError, PrintSucceeded, wsSendToClient } from '../services/service';
export class KiosServer {
    constructor(router: Router,wss: WebSocketServer.Server) {
        
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







      
        eSSP.on('JAM_RECOVERY', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'JAM_RECOVERY', result, true);
        })
        eSSP.on('ERROR_DURING_PAYOUT', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'ERROR_DURING_PAYOUT', result, true);
        })
        eSSP.on('SMART_EMPTYING', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'SMART_EMPTYING', result, true);
        })
        eSSP.on('SMART_EMPTIED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'SMART_EMPTIED', result, true);
        })
        eSSP.on('CHANNEL_DISABLE', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'CHANNEL_DISABLE', result, true);
        })
        eSSP.on('INITIALISING', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'INITIALISING', result, true);
        })
        eSSP.on('COIN_MECH_ERROR', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'COIN_MECH_ERROR', result, true);
        })
        eSSP.on('EMPTYING', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'EMPTYING', result, true);
        })
       
        eSSP.on('COIN_MECH_JAMMED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'COIN_MECH_JAMMED', result, true);
        })
        eSSP.on('COIN_MECH_RETURN_PRESSED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'COIN_MECH_RETURN_PRESSED', result, true);
        })
        eSSP.on('PAYOUT_OUT_OF_SERVICE', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'PAYOUT_OUT_OF_SERVICE', result, true);
        })
        eSSP.on('NOTE_FLOAT_REMOVED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_FLOAT_REMOVED', result, true);
        })

        eSSP.on('NOTE_FLOAT_ATTACHED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_FLOAT_ATTACHED', result, true);
        })
        eSSP.on('NOTE_TRANSFERED_TO_STACKER', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_TRANSFERED_TO_STACKER', result, true);
        })
        eSSP.on('NOTE_PAID_INTO_STACKER_AT_POWER-UP', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_PAID_INTO_STACKER_AT_POWER-UP', result, true);
        })
        eSSP.on('NOTE_PAID_INTO_STORE_AT_POWER-UP', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_PAID_INTO_STORE_AT_POWER-UP', result, true);
        })

        eSSP.on('NOTE_STACKING', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_STACKING', result, true);
        })
        eSSP.on('NOTE_DISPENSED_AT_POWER-UP', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_DISPENSED_AT_POWER-UP', result, true);
        })
        eSSP.on('NOTE_HELD_IN_BEZEL', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_HELD_IN_BEZEL', result, true);
        })
        eSSP.on('BAR_CODE_TICKET_ACKNOWLEDGE', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'BAR_CODE_TICKET_ACKNOWLEDGE', result, true);
        })
        eSSP.on('DISPENSED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'DISPENSED', result, true);
        })
        eSSP.on('JAMMED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'JAMMED', result, true);
        })
        eSSP.on('HALTED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'HALTED', result, true);
        })
        eSSP.on('FLOATING', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'FLOATING', result, true);
        })
        eSSP.on('TIME_OUT', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'TIME_OUT', result, true);
        })
        eSSP.on('DISPENSING', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'DISPENSING', result, true);
        })
        eSSP.on('NOTE_STORED_IN_PAYOUT', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_STORED_IN_PAYOUT', result, true);
        })
        eSSP.on('INCOMPLETE_PAYOUT', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'INCOMPLETE_PAYOUT', result, true);
        })
        eSSP.on('INCOMPLETE_FLOAT', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'INCOMPLETE_FLOAT', result, true);
        })
        eSSP.on('CASHBOX_PAID', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'CASHBOX_PAID', result, true);
        })
        eSSP.on('COIN_CREDIT', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'COIN_CREDIT', result, true);
        })
        eSSP.on('NOTE_PATH_OPEN', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_PATH_OPEN', result, true);
        })
        eSSP.on('NOTE_CLEARED_FROM_FRONT', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_CLEARED_FROM_FRONT', result, true);
        })
        eSSP.on('NOTE_CLEARED_TO_CASHBOX', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_CLEARED_TO_CASHBOX', result, true);
        })
        eSSP.on('CASHBOX_REMOVED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'CASHBOX_REMOVED', result, true);
        })
        eSSP.on('CASHBOX_REPLACED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'CASHBOX_REPLACED', result, true);
        })
        eSSP.on('BAR_CODE_TICKET_VALIDATED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'BAR_CODE_TICKET_VALIDATED', result, true);
        })
        eSSP.on('FRAUD_ATTEMPT', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'FRAUD_ATTEMPT', result, true);
        })
        eSSP.on('STACKER_FULL', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'STACKER_FULL', result, true);
        })
        eSSP.on('DISABLED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'DISABLED', result, true);
        })
        eSSP.on('UNSAFE_NOTE_JAM', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'UNSAFE_NOTE_JAM', result, true);
        })
        eSSP.on('SAFE_NOTE_JAM', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'SAFE_NOTE_JAM', result, true);
        })
        eSSP.on('NOTE_STACKED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_STACKED', result, true);
        })
        eSSP.on('NOTE_REJECTED', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_REJECTED', result, true);
        })
        eSSP.on('NOTE_REJECTING', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'NOTE_REJECTING', result, true);
        })
        eSSP.on('CLOSE', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'CLOSE', result, true);
        })
        eSSP.on('OPEN', result => {
            console.log(result)
            wsSendToClient(wss, EMessage.all,'OPEN', result, true);
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
