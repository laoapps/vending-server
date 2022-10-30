import axios from 'axios';
import { EMACHINE_COMMAND } from '../entities/syste.model';

const sspLib = require('encrypted-smiley-secure-protocol');

import { SocketKiosClient } from './socketClient.kios';
import fs  from 'fs';
export class KiosESSP {

    sock: SocketKiosClient | null = null;


    transactionID = -1;
    t: any;
    eSSP = new sspLib({
        id: 0,
        debug: false,
        timeout: 3000,
        fixedKey: '0123456701234567'
    });
    constructor(sock: SocketKiosClient) {
        this.sock = sock;
        const that = this;
        that.initSSP();
        
    }
    setTransactionID(transactionID: number) {
        this.transactionID = transactionID;
        if (this.t) {
            clearInterval(this.t);
            this.t = null;
        }
        if (this.transactionID != -1) {
            this.eSSP.command('ENABLE').then(result => {
                this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'ENABLE' },EMACHINE_COMMAND.status);
            })
            this.t = setInterval(() => {
                if (this.transactionID != -1) {
                    this.eSSP.command('DISABLE')
                        .then(result => {
                            this.transactionID = -1;
                            console.log(result)
                            this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'DISABLE' },EMACHINE_COMMAND.status);
                        })
                }
            }, 30000)
        }else {
            this.eSSP.command('DISABLE').then(result => {
                clearInterval(this.t);
                this.t=null
                this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'DISABLE' },EMACHINE_COMMAND.status);
            })
        }
       
    }


    initSSP() {

        this.eSSP.on('OPEN', () => {
            console.log('OPEN');

            this.eSSP.command('SYNC')
                .then(() => this.eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 }))
                .then(() => this.eSSP.initEncryption())
                .then(() => this.eSSP.command('GET_SERIAL_NUMBER'))
                .then(result => {
                    console.log('SERIAL NUMBER:', result.info.serial_number)
                    return;
                })
                .then(() => this.eSSP.command('DISPLAY_ON'))
                .then(result => {
                    if (result.status == 'OK') {
                        console.log('DISPLAY_ON', result.info)
                    }
                })
                .then(result => {
                    if (result.status == 'OK') {
                        console.log('Device is active')
                    }
                    return;
                })
                .then(() => this.eSSP.command('SETUP_REQUEST'))
                .then(result => {
                    if (result.status == 'OK') {
                        console.log('SETUP_REQUEST request', result.info)
                    }
                    return;
                }).then(() => this.eSSP.enable())
            // .then(() => eSSP.command('SET_CHANNEL_INHIBITS',{channels:[1,1,1,1,1,1,1]})
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('SET_CHANNEL_INHIBITS', result.info)
            //     }
            // })
            //     return;
            // })
            // .then(() => eSSP.command('CHANNEL_VALUE_REQUEST'))
            // .then(result => {
            //     if (result.status == 'OK') {

            //         console.log('Device value request', result.info)
            //     }

            //     return;
            // })// get info from the validator and store useful vars

            // inhibits, this sets which channels can receive notes
            // NV11.SetInhibits(textBox1);
            // enable, this allows the validator to operate
            // NV11.EnableValidator(textBox1);
            // value reporting, set whether the validator reports channel or coin value in 
            // subsequent requests
            // NV11.SetValueReportingType(false, textBox1);
            // check for notes already in the float on startup
            // NV11.CheckForStoredNotes(textBox1);


            // .then(() => eSSP.command('RESET'))
            // .then(result => {
            //     if (result.status == 'OK') {

            //         console.log('RESET request', result.info)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('SET_VALUE_REPORTING_TYPE',{reportBy:'value'}))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log(result);

            //         console.log('SET_VALUE_REPORTING_TYPE', result)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('GET_NOTE_POSITIONS'))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         const x = [];
            //         Object.keys(result.info.slot).forEach(k => {
            //             if (result.info.slot[k].value)
            //                 x.push(
            //                     (result.info.slot[k].value))
            //         })
            //         console.log('GET_NOTE_POSITIONS', x)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('PAYOUT_NOTE'))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('PAYOUT_NOTE', result.info)
            //     }
            //     return;
            // })
            // // .then(() => eSSP.command('CHANNEL_VALUE_REQUEST'))
            // // .then(result => {
            // //     if (result.status == 'OK') {

            // //         console.log('CHANNEL_VALUE_REQUEST', result)
            // //     }
            // //     return;
            // // })
            // .then(() => eSSP.command('GET_NOTE_POSITIONS'))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         const x = [];
            //         console.log('GET_NOTE_POSITIONS',result.info.slot);
            //         // Object.keys(result.info.slot).forEach(k => {
            //         //     if (result.info.slot[k].value)
            //         //         x.push( result.info.slot[k].value)
            //         // })
            //         // console.log('GET_NOTE_POSITIONS', x)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('GET_DENOMINATION_ROUTE'))
            //     .then(result => {
            //         if (result.status == 'OK') {
            //             console.log('GET_DENOMINATION_ROUTE',result)
            //         }
            //         console.log('GET_DENOMINATION_ROUTE',result)
            //         return;
            //     })
            // .then(() => eSSP.command('SET_REFILL_MODE'))
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('SET_REFILL_MODE',result.info)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('FLOAT_BY_DENOMINATION'), {
            //     value: [
            //         {
            //             number: 1,
            //             denomination: 1000,
            //             country_code: 'LAK'
            //         }, {
            //             number: 1,
            //             denomination: 1000,
            //             country_code: 'LAK'
            //         }
            //     ],
            //     test: false
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('FLOAT_BY_DENOMINATION',result)
            //     }
            //     console.log('FLOAT_BY_DENOMINATION',result)
            //     return;
            // })
            // .then(() => eSSP.command('GET_DENOMINATION_ROUTE'),  {
            //     isHopper: true, // true/false
            //     value: 1000,
            //     country_code: 'LAK'
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('GET_DENOMINATION_ROUTE',result)
            //     }
            //     console.log('GET_DENOMINATION_ROUTE',result)
            //     return;
            // })
            //  .then(() => eSSP.command('PAYOUT_BY_DENOMINATION'), {
            //     value: [
            //         {
            //             number: 1,
            //             denomination: 1000,
            //             country_code: 'LAK'
            //         }, {
            //             number: 1,
            //             denomination: 1000,
            //             country_code: 'LAK'
            //         }
            //     ],
            //     test: false
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('PAYOUT_BY_DENOMINATION',result)
            //     }
            //     console.log('PAYOUT_BY_DENOMINATION',result)
            //     return;
            // })
            // .then(() => eSSP.command('SMART_EMPTY'), {
            //     isHopper: false, // true/false
            //     value: 1000,
            //     country_code: 'LAK'
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('SMART_EMPTY',result)
            //     }
            //     console.log('SMART_EMPTY',result)
            //     return;
            // })
            // .then(() => eSSP.command('FLOAT_AMOUNT', {
            //     min_possible_payout: 1000,
            //     amount: 1000,
            //     country_code: 'LAK',
            //     test: false
            // }), {
            //     isHopper: false, // true/false
            //     value: 1000,
            //     country_code: 'LAK'
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('FLOAT_AMOUNT',result)
            //     }
            //     console.log('PAYOUT_AMOUNT',result)
            //     return;
            // })
            // .then(() => eSSP.command('PAYOUT_AMOUNT',{
            //     amount: 1000,
            //     country_code: 'LAK',
            //     test: false
            // }), {
            //     isHopper: false, // true/false
            //     value: 1000,
            //     country_code: 'LAK'
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('PAYOUT_AMOUNT',result)
            //     }
            //     console.log('PAYOUT_AMOUNT',result)
            //     return;
            // })
            // .then(() => eSSP.command('GET_BAR_CODE_READER_CONFIGURATION'), {
            //     isHopper: false, // true/false
            //     value: 1000,
            //     country_code: 'LAK'
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('GET_BAR_CODE_DATA',result)
            //     }
            //     console.log('GET_BAR_CODE_DATA',result)
            //     return;
            // })
            // .then(() => eSSP.command('GET_BAR_CODE_READER_CONFIGURATION'), {
            //     isHopper: false, // true/false
            //     value: 1000,
            //     country_code: 'LAK'
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('GET_BAR_CODE_READER_CONFIGURATION',result)
            //     }
            //     console.log('GET_BAR_CODE_READER_CONFIGURATION',result)
            //     return;
            // })
            // .then(() => eSSP.command('GET_ALL_LEVELS'), {
            //     isHopper: false, // true/false
            //     value: 1000,
            //     country_code: 'LAK'
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('GET_ALL_LEVELS',result)
            //     }
            //     console.log('GET_ALL_LEVELS',result)
            //     return;
            // })
            // .then(() => eSSP.command('GET_DENOMINATION_ROUTE'), {
            //     isHopper: false, // true/false
            //     value: 1000,
            //     country_code: 'LAK'
            // })
            // .then(result => {
            //     if (result.status == 'OK') {
            //         console.log('GET_NOTE_POSITIONS',result)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('FLOAT_AMOUNT', {
            //     min_possible_payout: 1000,
            //     amount: 10000,
            //     country_code: 'LAK',
            //     test: false
            // }))
            // .then(result => {
            //     if (result.status == 'OK') {

            //         console.log('Device value request', result.info)
            //     }else{
            //         console.log(result);
            //     }
            //     return;
            // })
        })

        this.eSSP.on('NOTE_REJECTED', result => {
            console.log('NOTE_REJECTED', result);

            this.eSSP.command('LAST_REJECT_CODE')
                .then(result => {
                    console.log(result)
                    this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'NOTE_REJECTED' },EMACHINE_COMMAND.status);
                })
                this.writeLog(result);
        })
        this.eSSP.on('READ_NOTE', result => {
            console.log('READ_NOTE', result)
            if (result.channel > 0)
                this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'READ_NOTE' },EMACHINE_COMMAND.status);
                this.writeLog(result);
        
            })
        this.eSSP.on('CREDIT_NOTE', result => {
            console.log('CREDIT_NOTE', result)
            this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'CREDIT_NOTE' },EMACHINE_COMMAND.status);
            this.writeLog(result);
        })
        this.eSSP.on('JAMMED', result => {
            console.log('JAMMED', result)
            this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'JAMMED' },EMACHINE_COMMAND.status);
            this.eSSP.command('DISABLE').then(result => {
                this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'DISABLE' },EMACHINE_COMMAND.status);
            })
            this.writeLog(result);
        })
        this.eSSP.on('DISPENSED', result => {
            console.log('DISPENSED', result)
            this.writeLog(result);
        })
        
        this.eSSP.on('JAM_RECOVERY', result => {
            console.log('JAM_RECOVERY', result)
            this.writeLog(result);
        })
        this.eSSP.open('COM1');
        process.on("exit", () => {
            this.eSSP.close();
        })
    }
  
    writeLog(data:any){
        const d ={data}
        fs.writeFileSync(__dirname+'/'+new Date().getTime(), JSON.stringify(d));

    }
    close() {
        this.eSSP.close((e) => {
            console.log('closing', e);
        })
    }


}
