import axios from 'axios';

import { EMessage, EESSP_COMMANDS, IReqModel, IResModel } from '../entities/syste.model';
const sspLib = require('encrypted-smiley-secure-protocol');
import { SerialPort } from 'serialport';
import { initWs, PrintError, PrintSucceeded } from '../services/service';
import { SocketKiosClient } from './socketClient.kios';
export class KiosServer {
    port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600 }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
    })
    constructor(sock: SocketKiosClient) {

        // Read data that is available but keep the stream in "paused mode"
        // this.port.on('readable', function () {
        //     console.log('Data:', this.port.read())
        // })

        // Switches the port into "flowing mode"
        // this.port.on('data', function (data) {
        //     console.log('Data:', data)
        // })
        let buffer = '';
        const that = this;
        this.port.on("open", function () {
            console.log('open serial communication');
            // Listens to incoming data
            that.port.on('data', function (data: any) {
                console.log('data', data);
                buffer += new String(data);
                console.log('buffer', buffer);
                if (buffer.length == 4) {
                    buffer = '';
                    sock.send(buffer)
                }

            });
        });
         
        let eSSP = new sspLib({
            id: 0x00,
            debug: false,
            timeout: 3000,
            fixedKey: '0123456701234567'
        });


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
                // this.send(sock, EMessage.all,'LAST_REJECT_CODE', result);
            })
        })







      
        eSSP.on('JAM_RECOVERY', result => {
            console.log(result)
            // this.send(sock, EMessage.all,'JAM_RECOVERY', result);
        })
        eSSP.on('ERROR_DURING_PAYOUT', result => {
            console.log(result)
            // this.send(sock, EMessage.all,'ERROR_DURING_PAYOUT', result);
        })
        eSSP.on('SMART_EMPTYING', result => {
            console.log(result)
            // this.send(sock, EMessage.all,'SMART_EMPTYING', result);
        })
        eSSP.on('SMART_EMPTIED', result => {
            console.log(result)
            // this.send(sock, EMessage.all,'SMART_EMPTIED', result);
        })
        eSSP.on('CHANNEL_DISABLE', result => {
            console.log(result)
            // this.send(sock, EMessage.all,'CHANNEL_DISABLE', result);
        })
        eSSP.on('INITIALISING', result => {
            console.log(result)
            // this.send(sock, EMessage.all,'INITIALISING', result);
        })
        eSSP.on('COIN_MECH_ERROR', result => {
            console.log(result)
            this.send(sock, EMessage.all,'COIN_MECH_ERROR', result);
        })
        eSSP.on('EMPTYING', result => {
            console.log(result)
            this.send(sock, EMessage.all,'EMPTYING', result);
        })
       
        eSSP.on('COIN_MECH_JAMMED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'COIN_MECH_JAMMED', result);
        })
        eSSP.on('COIN_MECH_RETURN_PRESSED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'COIN_MECH_RETURN_PRESSED', result);
        })
        eSSP.on('PAYOUT_OUT_OF_SERVICE', result => {
            console.log(result)
            this.send(sock, EMessage.all,'PAYOUT_OUT_OF_SERVICE', result);
        })
        eSSP.on('NOTE_FLOAT_REMOVED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_FLOAT_REMOVED', result);
        })

        eSSP.on('NOTE_FLOAT_ATTACHED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_FLOAT_ATTACHED', result);
        })
        eSSP.on('NOTE_TRANSFERED_TO_STACKER', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_TRANSFERED_TO_STACKER', result);
        })
        eSSP.on('NOTE_PAID_INTO_STACKER_AT_POWER-UP', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_PAID_INTO_STACKER_AT_POWER-UP', result);
        })
        eSSP.on('NOTE_PAID_INTO_STORE_AT_POWER-UP', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_PAID_INTO_STORE_AT_POWER-UP', result);
        })

        eSSP.on('NOTE_STACKING', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_STACKING', result);
        })
        eSSP.on('NOTE_DISPENSED_AT_POWER-UP', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_DISPENSED_AT_POWER-UP', result);
        })
        eSSP.on('NOTE_HELD_IN_BEZEL', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_HELD_IN_BEZEL', result);
        })
        eSSP.on('BAR_CODE_TICKET_ACKNOWLEDGE', result => {
            console.log(result)
            this.send(sock, EMessage.all,'BAR_CODE_TICKET_ACKNOWLEDGE', result);
        })
        eSSP.on('DISPENSED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'DISPENSED', result);
        })
        eSSP.on('JAMMED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'JAMMED', result);
        })
        eSSP.on('HALTED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'HALTED', result);
        })
        eSSP.on('FLOATING', result => {
            console.log(result)
            this.send(sock, EMessage.all,'FLOATING', result);
        })
        eSSP.on('TIME_OUT', result => {
            console.log(result)
            this.send(sock, EMessage.all,'TIME_OUT', result);
        })
        eSSP.on('DISPENSING', result => {
            console.log(result)
            this.send(sock, EMessage.all,'DISPENSING', result);
        })
        eSSP.on('NOTE_STORED_IN_PAYOUT', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_STORED_IN_PAYOUT', result);
        })
        eSSP.on('INCOMPLETE_PAYOUT', result => {
            console.log(result)
            this.send(sock, EMessage.all,'INCOMPLETE_PAYOUT', result);
        })
        eSSP.on('INCOMPLETE_FLOAT', result => {
            console.log(result)
            this.send(sock, EMessage.all,'INCOMPLETE_FLOAT', result);
        })
        eSSP.on('CASHBOX_PAID', result => {
            console.log(result)
            this.send(sock, EMessage.all,'CASHBOX_PAID', result);
        })
        eSSP.on('COIN_CREDIT', result => {
            console.log(result)
            this.send(sock, EMessage.all,'COIN_CREDIT', result);
        })
        eSSP.on('NOTE_PATH_OPEN', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_PATH_OPEN', result);
        })
        eSSP.on('NOTE_CLEARED_FROM_FRONT', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_CLEARED_FROM_FRONT', result);
        })
        eSSP.on('NOTE_CLEARED_TO_CASHBOX', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_CLEARED_TO_CASHBOX', result);
        })
        eSSP.on('CASHBOX_REMOVED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'CASHBOX_REMOVED', result);
        })
        eSSP.on('CASHBOX_REPLACED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'CASHBOX_REPLACED', result);
        })
        eSSP.on('BAR_CODE_TICKET_VALIDATED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'BAR_CODE_TICKET_VALIDATED', result);
        })
        eSSP.on('FRAUD_ATTEMPT', result => {
            console.log(result)
            this.send(sock, EMessage.all,'FRAUD_ATTEMPT', result);
        })
        eSSP.on('STACKER_FULL', result => {
            console.log(result)
            this.send(sock, EMessage.all,'STACKER_FULL', result);
        })
        eSSP.on('DISABLED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'DISABLED', result);
        })
        eSSP.on('UNSAFE_NOTE_JAM', result => {
            console.log(result)
            this.send(sock, EMessage.all,'UNSAFE_NOTE_JAM', result);
        })
        eSSP.on('SAFE_NOTE_JAM', result => {
            console.log(result)
            this.send(sock, EMessage.all,'SAFE_NOTE_JAM', result);
        })
        eSSP.on('NOTE_STACKED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_STACKED', result);
        })
        eSSP.on('NOTE_REJECTED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_REJECTED', result);
        })
        eSSP.on('NOTE_REJECTING', result => {
            console.log(result)
            this.send(sock, EMessage.all,'NOTE_REJECTING', result);
        })
        eSSP.on('CLOSE', result => {
            console.log(result)
            this.send(sock, EMessage.all,'CLOSE', result);
        })
        eSSP.on('OPEN', result => {
            console.log(result)
            this.send(sock, EMessage.all,'OPEN', result);
        })
        eSSP.on('READ_NOTE', result => {
            console.log(result)
            this.send(sock, EMessage.all,'READ_NOTE', result);
        })

        eSSP.on('EMPTIED', result => {
            console.log(result)
            this.send(sock, EMessage.all,'EMPTIED', result);
        })
        eSSP.on('DISPENSING', result => {
            console.log(result)
            this.send(sock, EMessage.all,'DISPENSING', result);
        })
        eSSP.on('CASHBOX_REPLACED', result => {
            console.log(result)
             this.send(sock, EMessage.all,'CASHBOX_REPLACED', result);
        })
        eSSP.command('SET_BAUD_RATE', {
            baudrate: 9600, // 9600|38400|115200
            reset_to_default_on_reset: true
        })
        eSSP.open('/dev/ttyS0')
        // eSSP.open('COM1');


    }
    //  checkSum(buff: any) {
    //     try {
    //         const x = crc.crc16modbus(Buffer.from(buff as any, 'hex')).toString(16);
    //         console.log(x);
    
    //         return x.substring(2) + x.substring(0, 2);
    //     }
    //     catch (e) {
    //         console.log('error', e);
    //         return '';
    //     }
    // }
    send(socket:SocketKiosClient,message:string,command:any,data:any){

    }
    close() {
        this.port.close((e) => {
            console.log('closing', e);
        })
    }



   

    

}
