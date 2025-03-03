
import { EMACHINE_COMMAND, IBankNote, IResModel } from '../entities/syste.model';
import os from 'os';
const sspLib = require('encrypted-smiley-secure-protocol');

import { SocketKiosClient } from './socketClient.kiosk';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import express, { Router } from 'express';
import axios from 'axios';
import http from 'http';
export class KiosESSP {

    sock: SocketKiosClient | null = null;
    credit_count=0;
    credit_value=0;
    notes = new Array<IBankNote>();
    credit_notes = new Array<IBankNote>();
    transactionID = -1;
    t: any;
    eSSP = new sspLib({
        id: 0,
        debug: false,
        timeout: 3000,
        fixedKey: '0123456701234567'
    });
    constructor(sock: SocketKiosClient, port = 'COM1') {
        try {
            this.sock = sock;
            const that = this;
            const f = fs.readFileSync(__dirname + '/config.json', 'utf8');
            const env = JSON.parse(f);
            process.env.channels = env.channels;
            that.initSSP();
            this.eSSP.open(port).then(r => {
                console.log('OPEN ' + port, r);
            }).catch(e => {
                console.log('ERROR OPEN ' + port, e);
            });
        } catch (error) {
            console.log(error);

        }

    }
    initBankNotes() {
        this.notes.push({
            value: 1000,
            amount: 0,
            currency: 'LAK',
            channel: 1,
            image: 'lak1000.jpg'
        })
        this.notes.push({
            value: 2000,
            amount: 0,
            currency: 'LAK',
            channel: 2,
            image: 'lak2000.jpg'
        })
        this.notes.push({
            value: 5000,
            amount: 0,
            currency: 'LAK',
            channel: 3,
            image: 'lak5000.jpg'
        })
        this.notes.push({
            value: 10000,
            amount: 0,
            currency: 'LAK',
            channel: 4,
            image: 'lak10000.jpg'
        })
        this.notes.push({
            value: 20000,
            amount: 0,
            currency: 'LAK',
            channel: 5,
            image: 'lak20000.jpg'
        })
        this.notes.push({
            value: 50000,
            amount: 0,
            currency: 'LAK',
            channel: 6,
            image: 'lak50000.jpg'
        })
        this.notes.push({
            value: 100000,
            amount: 0,
            currency: 'LAK',
            channel: 7,
            image: 'lak100000.jpg'
        })
    }
    // isReading=false;
    counter = 0;
    tCounter: any;
    setCounter(v: number) {
        try {
            this.counter = v;
            clearInterval(this.tCounter);
            this.tCounter = null;
            this.tCounter = setInterval(() => {
                try {
                    console.log('COUNTER', this.counter);

                    this.counter--;
                    if (this.counter <= 0) {
                        clearInterval(this.tCounter);
                        this.transactionID=-1;
                        this.eSSP.command('DISABLE').then(result => {
                            console.log('DISABLE', this.transactionID);
                            this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'DISABLE' },this.transactionID, EMACHINE_COMMAND.status);
                        })
                    }
                } catch (error) {
                    console.log(error);

                }

            }, 1000)
        } catch (error) {
            console.log(error);

        }

    }
    setTransactionID(transactionID: number, counter: number = 30) {
        try {
            console.log('SET TRANSACTION ', transactionID);

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
                        this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'ENABLE' },transactionID, EMACHINE_COMMAND.status);
                    })

                } else {
                    this.eSSP.command('DISABLE').then(result => {
                        console.log('DISABLE', transactionID);
                         this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'DISABLE' },transactionID, EMACHINE_COMMAND.status);
                    })
                }
            })
        } catch (error) {
            console.log('error', error);

        }
        // console.log('READING NOTE',this.isReading,transactionID);

        // if(this.isReading){
        //     setTimeout(() => {
        //         this.setTransactionID(transactionID);
        //     }, 1000);
        //     return;
        // }

    }
    initWebServer() {
        try {
            const app = express();
            const router = express.Router();
            app.use(express.json({ limit: '50mb' }));
            app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 5000 }));
            app.use(cors());
            app.use(cookieParser());
            app.disable('x-powered-by');
            app.use(helmet.hidePoweredBy());

            app.post('/', (req, res) => {
                const d = req.body as IResModel;
                try {
                    if (d.data == 'disable') {
                        this.setTransactionID(-1);
                        res.send({ status: 1, message: 'Disabled OK' });
                    }
                    else if (d.data == 'reset') {
                        this.setTransactionID(-1);
                        this.credit_count=0;
                        this.credit_notes.length=0;
                        this.credit_value=0;
                        this.writeLog({cc:this.credit_count,cv:this.credit_value,cn:this.credit_notes}, 'CREDIT_DETAILS');
                        res.send({ status: 1, message: 'reset OK',data:{cc:this.credit_count,cn:this.credit_notes,cv:this.credit_value} });
                    }
                    else if (d.data == 'showdetails') {
                        this.setTransactionID(-1);
                        res.send({ status: 1, message: 'show details OK',data:{cc:this.credit_count,cn:this.credit_notes,cv:this.credit_value} });
                    }
                    res.send({ status: 1, message: 'Nothing', });
                } catch (error) {
                    res.send({ status: 0, message: 'error not found', data: error });
                }



            })
            const server = http.createServer(app);
            server.listen(19007, async function () {
                console.log('HTTP listening on port ' + 19006);
            });
        } catch (error) {
            console.log(error, 'error');

        }

    }
    initSSP() {
        try {
            // this.eSSP.close();
            this.eSSP.on('OPEN', () => {
                console.log('OPEN');
                try {
                    this.eSSP.command('SYNC')
                        .then(result => {
                            console.log('SYNC:', result)
                        })
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
                        .then(() => this.eSSP.command('RESET_COUNTERS').then(result => {
                            if (result) if (result.status == 'OK') {
                                console.log('RESET_COUNTERS', result)
                            }
                            return;
                        }))
                        .then(() => this.eSSP.enable())
                        .then(result => {
                            if (result) if (result.status == 'OK') {
                                console.log('enable request', result.info)
                            }
                            return;
                        })
                        .then(() => this.eSSP.command('SETUP_REQUEST'))
                        .then(result => {
                            if (result) if (result.status == 'OK') {
                                console.log('SETUP_REQUEST request', result.info)
                            }
                            return;
                        })

                        .then(() => this.eSSP.command('SET_CHANNEL_INHIBITS', { channels: process.env.channels || [1, 1, 1, 1, 1, 1, 1] })
                            .then(result => {
                                if (result) if (result.status == 'OK') {
                                    console.log('SET_CHANNEL_INHIBITS', result.info)
                                }
                            }));
                    
                } catch (error) {
                    console.log(error);

                }

            })

            this.eSSP.on('NOTE_REJECTED', result => {
                try {
                    console.log('NOTE_REJECTED', result);

                    this.eSSP.command('LAST_REJECT_CODE')
                        .then(result => {
                            try {
                                console.log(result)
                                this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'NOTE_REJECTED' },this.transactionID, EMACHINE_COMMAND.status);

                            } catch (error) {
                                console.log(error);

                            }
                        })
                    this.writeLog(result, 'NOTE_REJECTED');
                } catch (error) {
                    console.log(error);

                }

            })
            let countRead = 0;
            this.eSSP.on('READ_NOTE', result => {
                try {
                    console.log('READ_NOTE', result, countRead, this.counter);

                    if (this.transactionID == -1 || this.counter <= 5) {

                        this.eSSP.command('REJECT_BANKNOTE').then(r => {
                            // this.eSSP.disable()
                            this.writeLog(result, 'REJECT_BANKNOTE');
                            this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'REJECT_BANKNOTE' },this.transactionID, EMACHINE_COMMAND.status);
                            // this.isReading=false;
                            result.transactionID = this.transactionID;
                            this.writeLog(result, 'REJECT_BANKNOTE')
                            countRead = 0;
                        })
                        return;
                    }
                    else if (!countRead && this.counter > 5) {
                        this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'READ_NOTE' },this.transactionID, EMACHINE_COMMAND.status);
                        countRead = 1;
                        return;
                    }

                    // this.isReading=true;

                    else if (countRead && result.channel > 0 && this.transactionID !== -1) {
                        countRead = 0;
                        this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'READ_NOTE' },this.transactionID, EMACHINE_COMMAND.status);
                        // this.isReading=false;
                        result.transactionID = this.transactionID;
                        this.writeLog(result, 'READ_NOTE')
                        return;
                    }
                } catch (error) {
                    console.log(error);

                }



            })
            this.eSSP.on('CREDIT_NOTE', result => {
                try {
                    console.log('CREDIT_NOTE', result)
                    this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'CREDIT_NOTE' },this.transactionID, EMACHINE_COMMAND.status);
                    result.transactionID = this.transactionID;
                    this.writeLog(result, 'CREDIT_NOTE');
                    // this.isReading=false;
                   
                    const n = this.notes.find(v=>v.channel==result.channel);
                    if(n){
                        this.credit_count++;
                        this.credit_value+=n.value||0;
                        this.credit_notes.push(n);
                        this.writeLog({cc:this.credit_count,cv:this.credit_value,cn:this.credit_notes}, 'CREDIT_DETAILS');
                    }
                   
                } catch (error) {
                    console.log(error);

                }

            })
            this.eSSP.on('JAMMED', result => {
                try {
                    console.log('JAMMED', result)
                    this.sock?.send({ channel: result.channel, transactionID: this.transactionID, command: 'JAMMED' },this.transactionID, EMACHINE_COMMAND.status);
                    // this.eSSP.command('DISABLE').then(result => {
                    // this.sock?.send({ channel: result, transactionID: this.transactionID, command: 'DISABLE' }, EMACHINE_COMMAND.status);
                    // })
                    result.transactionID = this.transactionID;
                    this.writeLog(result, 'JAMMED');
                    // this.isReading=false;
                } catch (error) {
                    console.log(error);

                }

            })
            this.eSSP.on('DISPENSED', result => {
                try {
                    console.log('DISPENSED', result)
                    result.transactionID = this.transactionID;
                    this.writeLog(result, 'DISPENSED');
                    // this.isReading=false;
                } catch (error) {
                    console.log(error);

                }

            })

            this.eSSP.on('JAM_RECOVERY', result => {
                try {
                    console.log('JAM_RECOVERY', result)
                    result.transactionID = this.transactionID;
                    this.writeLog(result, 'JAM_RECOVERY');
                    // this.isReading=false;
                } catch (error) {
                    console.log(error);

                }

            })
            this.eSSP.on('DISABLED', result => {
                try {
                    console.log('DISABLED', result)
                    this.writeLog(result, 'DISABLED')
                    // this.isReading=false;
                } catch (error) {
                    console.log(error);
                }

            })
            this.eSSP.on('ENABLED', result => {
                try {
                    console.log('ENABLED', result)
                    this.writeLog(result, 'ENABLED')
                    // this.isReading=false;
                } catch (error) {
                    console.log(error);
                }

            })






            process.on("exit", () => {
                try {
                    this.eSSP.close();
                } catch (error) {
                    console.log(error, 'error');

                }

            })
        } catch (error) {
            console.log(error, 'error');

        }

    }

    writeLog(data: any, name: string) {
        try {
            const d = { data }
            const o = os.platform();
            if (o != 'win32')
                // linux
                fs.writeFileSync(__dirname + '/logs/' + name + '' + new Date().getTime(), JSON.stringify(d), { flag: 'a' });
            else
                fs.writeFileSync(__dirname + '\\logs\\' + name + '' + new Date().getTime(), JSON.stringify(d), { flag: 'a' });
            console.log('OS', o);
        } catch (error) {
            console.log(error);

        }


    }
    close() {
        try {
            this.eSSP.close((e) => {
                console.log('closing', e);
            })
        } catch (error) {
            console.log('error', error);

        }

    }


}
