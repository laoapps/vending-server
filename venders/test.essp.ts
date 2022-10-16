// import axios from 'axios';


const sspLib = require('encrypted-smiley-secure-protocol');
import { SerialPort } from 'serialport';

export class KiosServer {
     eSSP = new sspLib({
        id: 0x00,
        debug: false,
        timeout: 3000,
        fixedKey: '0123456701234567'
    });
    constructor() {

        let buffer = '';
        const that = this;

         
      


        this.eSSP.on('OPEN', () => {
            console.log('open');
        
            this.eSSP.command('SYNC')
            .then(() => this.eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 }))
            .then(() => this.eSSP.initEncryption())
            .then(() => this.eSSP.command('GET_SERIAL_NUMBER'))
            .then(result => {
                console.log('SERIAL NUMBER:', result.info.serial_number)
                return;
            })
            .then(() => this.eSSP.enable())
            .then(result => {
                if(result.status == 'OK'){
                    console.log('Device is active')
                }
                return;
            })
        })
        
        this.eSSP.on('NOTE_REJECTED', result => {
            console.log('NOTE_REJECTED', result);
        
            this.eSSP.command('LAST_REJECT_CODE')
            .then(result => {
                console.log(result)
                // //this.send(sock, EMessage.all,'LAST_REJECT_CODE', result);
            })
        })







      
        this.eSSP.on('JAM_RECOVERY', result => {
            console.log(result)
            // //this.send(sock, EMessage.all,'JAM_RECOVERY', result);
        })
        this.eSSP.on('ERROR_DURING_PAYOUT', result => {
            console.log(result)
            // //this.send(sock, EMessage.all,'ERROR_DURING_PAYOUT', result);
        })
        this.eSSP.on('SMART_EMPTYING', result => {
            console.log(result)
            // //this.send(sock, EMessage.all,'SMART_EMPTYING', result);
        })
        this.eSSP.on('SMART_EMPTIED', result => {
            console.log(result)
            // //this.send(sock, EMessage.all,'SMART_EMPTIED', result);
        })
        this.eSSP.on('CHANNEL_DISABLE', result => {
            console.log(result)
            // //this.send(sock, EMessage.all,'CHANNEL_DISABLE', result);
        })
        this.eSSP.on('INITIALISING', result => {
            console.log(result)
            // //this.send(sock, EMessage.all,'INITIALISING', result);
        })
        this.eSSP.on('COIN_MECH_ERROR', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'COIN_MECH_ERROR', result);
        })
        this.eSSP.on('EMPTYING', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'EMPTYING', result);
        })
       
        this.eSSP.on('COIN_MECH_JAMMED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'COIN_MECH_JAMMED', result);
        })
        this.eSSP.on('COIN_MECH_RETURN_PRESSED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'COIN_MECH_RETURN_PRESSED', result);
        })
        this.eSSP.on('PAYOUT_OUT_OF_SERVICE', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'PAYOUT_OUT_OF_SERVICE', result);
        })
        this.eSSP.on('NOTE_FLOAT_REMOVED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_FLOAT_REMOVED', result);
        })

        this.eSSP.on('NOTE_FLOAT_ATTACHED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_FLOAT_ATTACHED', result);
        })
        this.eSSP.on('NOTE_TRANSFERED_TO_STACKER', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_TRANSFERED_TO_STACKER', result);
        })
        this.eSSP.on('NOTE_PAID_INTO_STACKER_AT_POWER-UP', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_PAID_INTO_STACKER_AT_POWER-UP', result);
        })
        this.eSSP.on('NOTE_PAID_INTO_STORE_AT_POWER-UP', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_PAID_INTO_STORE_AT_POWER-UP', result);
        })

        this.eSSP.on('NOTE_STACKING', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_STACKING', result);
        })
        this.eSSP.on('NOTE_DISPENSED_AT_POWER-UP', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_DISPENSED_AT_POWER-UP', result);
        })
        this.eSSP.on('NOTE_HELD_IN_BEZEL', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_HELD_IN_BEZEL', result);
        })
        this.eSSP.on('BAR_CODE_TICKET_ACKNOWLEDGE', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'BAR_CODE_TICKET_ACKNOWLEDGE', result);
        })
        this.eSSP.on('DISPENSED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'DISPENSED', result);
        })
        this.eSSP.on('JAMMED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'JAMMED', result);
        })
        this.eSSP.on('HALTED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'HALTED', result);
        })
        this.eSSP.on('FLOATING', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'FLOATING', result);
        })
        this.eSSP.on('TIME_OUT', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'TIME_OUT', result);
        })
        this.eSSP.on('DISPENSING', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'DISPENSING', result);
        })
        this.eSSP.on('NOTE_STORED_IN_PAYOUT', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_STORED_IN_PAYOUT', result);
        })
        this.eSSP.on('INCOMPLETE_PAYOUT', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'INCOMPLETE_PAYOUT', result);
        })
        this.eSSP.on('INCOMPLETE_FLOAT', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'INCOMPLETE_FLOAT', result);
        })
        this.eSSP.on('CASHBOX_PAID', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'CASHBOX_PAID', result);
        })
        this.eSSP.on('COIN_CREDIT', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'COIN_CREDIT', result);
        })
        this.eSSP.on('NOTE_PATH_OPEN', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_PATH_OPEN', result);
        })
        this.eSSP.on('NOTE_CLEARED_FROM_FRONT', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_CLEARED_FROM_FRONT', result);
        })
        this.eSSP.on('NOTE_CLEARED_TO_CASHBOX', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_CLEARED_TO_CASHBOX', result);
        })
        this.eSSP.on('CASHBOX_REMOVED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'CASHBOX_REMOVED', result);
        })
        this.eSSP.on('CASHBOX_REPLACED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'CASHBOX_REPLACED', result);
        })
        this.eSSP.on('BAR_CODE_TICKET_VALIDATED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'BAR_CODE_TICKET_VALIDATED', result);
        })
        this.eSSP.on('FRAUD_ATTEMPT', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'FRAUD_ATTEMPT', result);
        })
        this.eSSP.on('STACKER_FULL', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'STACKER_FULL', result);
        })
        this.eSSP.on('DISABLED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'DISABLED', result);
        })
        this.eSSP.on('UNSAFE_NOTE_JAM', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'UNSAFE_NOTE_JAM', result);
        })
        this.eSSP.on('SAFE_NOTE_JAM', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'SAFE_NOTE_JAM', result);
        })
        this.eSSP.on('NOTE_STACKED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_STACKED', result);
        })
        this.eSSP.on('NOTE_REJECTED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_REJECTED', result);
        })
        this.eSSP.on('NOTE_REJECTING', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'NOTE_REJECTING', result);
        })
        this.eSSP.on('CLOSE', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'CLOSE', result);
        })
        this.eSSP.on('OPEN', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'OPEN', result);
        })
        this.eSSP.on('READ_NOTE', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'READ_NOTE', result);
        })

        this.eSSP.on('EMPTIED', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'EMPTIED', result);
        })
        this.eSSP.on('DISPENSING', result => {
            console.log(result)
            //this.send(sock, EMessage.all,'DISPENSING', result);
        })
        this.eSSP.on('CASHBOX_REPLACED', result => {
            console.log(result)
             //this.send(sock, EMessage.all,'CASHBOX_REPLACED', result);
        })
        this.eSSP.command('SET_BAUD_RATE', {
            baudrate: 9600, // 9600|38400|115200
            reset_to_default_on_reset: true
        })
        // this.eSSP.open('/dev/ttyS0')
         this.eSSP.open('COM1');


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

    close() {
        this.eSSP.close()
    }



   

    

}
