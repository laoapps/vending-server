import axios from 'axios';
import { EMACHINE_COMMAND } from '../entities/syste.model';
import os from 'os';
const sspLib = require('encrypted-smiley-secure-protocol');

import { SocketKiosClient } from './socketClient.kios';
import fs from 'fs';
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
        this.eSSP.open('COM1').then(r => {
            console.log('OPEN COM1', r);

        }).catch(e => {
            console.log('ERROR OPEN COM1', e);
        });


    }
    // isReading=false;
    counter = 0;
    tCounter: any;
    setCounter(v: number) {
        this.counter = v;
        clearInterval(this.tCounter);
        this.tCounter = null;
        this.tCounter = setInterval(() => {
            console.log('COUNTER', this.counter);

            this.counter--;
            if (this.counter <= 0) {
                clearInterval(this.tCounter);
            }
        }, 1000)
    }
    setTransactionID(transactionID: number, counter: number = 30) {
        // console.log('READING NOTE',this.isReading,transactionID);

        // if(this.isReading){
        //     setTimeout(() => {
        //         this.setTransactionID(transactionID);
        //     }, 1000);
        //     return;
        // }
        console.log('SET TRANSACTION ',transactionID);
        
        this.setCounter(counter);

        this.eSSP.command('RESET_COUNTERS').then(result => {
            console.log('RESET_COUNTERS', result)
            this.transactionID = transactionID;
            // if (this.t) {
            //     clearInterval(this.t);
            //     this.t = null;
            // }
            if (this.transactionID != -1) {
                this.eSSP.command('ENABLE').then(result => {
                    console.log('ENABLED', transactionID);
                    this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'ENABLE' }, EMACHINE_COMMAND.status);
                })

            } else {
                // this.eSSP.command('DISABLE').then(result => {
                //     console.log('DISABLE',transactionID); 
                //     this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'DISABLE' }, EMACHINE_COMMAND.status);
                // })
            }
        })


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
                // .then(() => this.eSSP.command('DISPLAY_ON'))
                // .then(result => {
                //     if (result) if (result.status == 'OK') {
                //         console.log('DISPLAY_ON', result.info)
                //     }
                // })
                // .then(result => {
                //     console.log('Device is active', result)
                //     if (result) if (result.status == 'OK') {
                //         console.log('Device is active')
                //     }
                //     return;
                // })
                .then(() => this.eSSP.command('SETUP_REQUEST'))
                .then(result => {
                    if (result) if (result.status == 'OK') {
                        console.log('SETUP_REQUEST request', result.info)
                    }
                    return;
                })
                .then(() => this.eSSP.enable())
                .then(() => this.eSSP.command('RESET_COUNTERS').then(result => {
                    if (result) if (result.status == 'OK') {
                        console.log('RESET_COUNTERS', result)
                    }
                    return;
                }))
            // .then(() => eSSP.command('SET_CHANNEL_INHIBITS',{channels:[1,1,1,1,1,1,1]})
            // .then(result => {
            //     if (result)if (result.status == 'OK') {
            //         console.log('SET_CHANNEL_INHIBITS', result.info)
            //     }
            // })
            //     return;
            // })
            // .then(() => eSSP.command('CHANNEL_VALUE_REQUEST'))
            // .then(result => {
            //     if (result)if (result.status == 'OK') {

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
            //     if (result)if (result.status == 'OK') {

            //         console.log('RESET request', result.info)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('SET_VALUE_REPORTING_TYPE',{reportBy:'value'}))
            // .then(result => {
            //     if (result)if (result.status == 'OK') {
            //         console.log(result);

            //         console.log('SET_VALUE_REPORTING_TYPE', result)
            //     }
            //     return;
            // })
            // .then(() => eSSP.command('GET_NOTE_POSITIONS'))
            // .then(result => {
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
            //         console.log('PAYOUT_NOTE', result.info)
            //     }
            //     return;
            // })
            // // .then(() => eSSP.command('CHANNEL_VALUE_REQUEST'))
            // // .then(result => {
            // //     if (result)if (result.status == 'OK') {

            // //         console.log('CHANNEL_VALUE_REQUEST', result)
            // //     }
            // //     return;
            // // })
            // .then(() => eSSP.command('GET_NOTE_POSITIONS'))
            // .then(result => {
            //     if (result)if (result.status == 'OK') {
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
            //         if (result)if (result.status == 'OK') {
            //             console.log('GET_DENOMINATION_ROUTE',result)
            //         }
            //         console.log('GET_DENOMINATION_ROUTE',result)
            //         return;
            //     })
            // .then(() => eSSP.command('SET_REFILL_MODE'))
            // .then(result => {
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {
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
            //     if (result)if (result.status == 'OK') {

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
                    this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'NOTE_REJECTED' }, EMACHINE_COMMAND.status);
                })
            this.writeLog(result, 'NOTE_REJECTED');
        })
        let countRead=0;
        this.eSSP.on('READ_NOTE', result => {
            console.log('READ_NOTE', result,countRead,this.counter);

             if (this.transactionID == -1 || this.counter <= 5) {
                
                this.eSSP.command('REJECT_BANKNOTE').then(r => {
                    // this.eSSP.disable()
                    this.writeLog(result, 'REJECT_BANKNOTE');
                    this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'REJECT_BANKNOTE' }, EMACHINE_COMMAND.status);
                    // this.isReading=false;
                    result.transactionID=this.transactionID;
                    this.writeLog(result,'REJECT_BANKNOTE')
                    countRead=0;
                })
                return;
            }
            else if(!countRead&&this.counter > 5){
                this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'READ_NOTE' }, EMACHINE_COMMAND.status);
                countRead=1;
                 return;
            }
           
            // this.isReading=true;
          
            else if (countRead&&result.channel > 0&&this.transactionID !== -1 ) {
                countRead=0;
                this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'READ_NOTE' }, EMACHINE_COMMAND.status);
                // this.isReading=false;
                result.transactionID=this.transactionID;
                this.writeLog(result,'READ_NOTE')
                return;
            }


        })
        this.eSSP.on('CREDIT_NOTE', result => {
            console.log('CREDIT_NOTE', result)
            this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'CREDIT_NOTE' }, EMACHINE_COMMAND.status);
            result.transactionID=this.transactionID;
            this.writeLog(result, 'CREDIT_NOTE');
            // this.isReading=false;
        })
        this.eSSP.on('JAMMED', result => {
            console.log('JAMMED', result)
            this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'JAMMED' }, EMACHINE_COMMAND.status);
            // this.eSSP.command('DISABLE').then(result => {
            // this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'DISABLE' }, EMACHINE_COMMAND.status);
            // })
            result.transactionID=this.transactionID;
            this.writeLog(result, 'JAMMED');
            // this.isReading=false;
        })
        this.eSSP.on('DISPENSED', result => {
            console.log('DISPENSED', result)
            result.transactionID=this.transactionID;
            this.writeLog(result, 'DISPENSED');
            // this.isReading=false;
        })

        this.eSSP.on('JAM_RECOVERY', result => {
            console.log('JAM_RECOVERY', result)
            result.transactionID=this.transactionID;
            this.writeLog(result, 'JAM_RECOVERY');
            // this.isReading=false;
        })
        this.eSSP.on('DISABLED', result => {
            //  console.log('DISABLED', result)
            // this.writeLog(result,'DISABLED);
            // this.isReading=false;
        })






        process.on("exit", () => {
            this.eSSP.close();
        })
    }

    writeLog(data: any, name: string) {
        try {
             const d = { data }
        const o= os.platform();
        if(o!='win32')
        // linux
         fs.writeFileSync(__dirname + '/logs/' + name + '' + new Date().getTime(), JSON.stringify(d),{flag:'a'});
        else 
         fs.writeFileSync(__dirname + '\\logs\\' + name + '' + new Date().getTime(), JSON.stringify(d),{flag:'a'});
        console.log('OS',o);
        } catch (error) {
            console.log(error);
            
        }
       
        
    }
    close() {
        this.eSSP.close((e) => {
            console.log('closing', e);
        })
    }


}
