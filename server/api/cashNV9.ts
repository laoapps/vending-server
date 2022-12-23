import axios from 'axios';
import { Router } from 'express';
import * as WebSocketServer from 'ws';
import { randomUUID } from 'crypto';

import { broadCast, PrintError, PrintSucceeded } from '../services/service';
import { EClientCommand, EZDM8_COMMAND, EMACHINE_COMMAND, EMessage, IMachineClientID, IMachineID, IMMoneyQRRes, IReqModel, IResModel, IStock, IVendingMachineBill, IVendingMachineSale, IMMoneyLogInRes, IMMoneyGenerateQR, IMMoneyGenerateQRRes, IMMoneyConfirm, IBillProcess, IBankNote, IBillCashIn, IMMoneyLoginCashin, IMMoneyRequestRes, IBaseClass, EEntity } from '../entities/system.model';
import moment from 'moment';
import { v4 as uuid4 } from 'uuid';
import { setWsHeartbeat } from 'ws-heartbeat/server';
import { SocketServerZDM8 } from './socketServerZDM8';
import { SocketServerESSP } from './socketServerNV9';
import crypto from 'crypto';
import cryptojs from 'crypto-js'
import os from 'os';
import fs from 'fs';
import { BillCashInFactory, BillCashInStatic } from '../entities/billcash.entity';
import { dbConnection } from '../entities';
import { MachineIDFactory, MachineIDStatic } from '../entities/machineid.entity';
export class CashNV9 implements IBaseClass {
    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket: SocketServerESSP = {} as SocketServerESSP;


    clients = new Array<IMachineID>();

    delayTime = 500;

    notes = new Array<IBankNote>();

    // bankNotes = new Array<IBankNote>();
    // badBN = new Array<IBankNote>();

    billCashIn = new Array<IBillCashIn>();
    // completedBillCashIn = new Array<IBillCashIn>();
    badBillCashIn = new Array<IBillCashIn>();
    requestors = new Array<IMMoneyRequestRes>();

    // mmMoneyLogin: IMMoneyLoginCashin | null = null;
    loginTokenList=new Array<{m:IMMoneyLoginCashin,t:number}>();

    lastOperation = Array<{machineId:string,time:Date}>();

    /// <<<<<<<<< PRODUCTION >>>>>>>>>>>>>>>
    //     Cash In Production :
    // Create account requester success.
    MMoneyRequesterId = 59
    MMoneyName = 'LMM KIOS'
    MMoneyUsername = 'lmmkios'
    MMoneyPassword = 'Qh7~Lq9@'
    production = true;

    pathMMoneyLogin = 'https://api.mmoney.la/ewallet-ltc-api/oauth/token.service';
    pathMMoneyConfirm = 'https://api.mmoney.la/ewallet-ltc-api/cash-management/confirm-cash-in.service';
    pathMMoneyInquiry = 'https://api.mmoney.la/ewallet-ltc-api/cash-management/inquiry-cash-in.service';
    pathMMoneyRequest = 'https://api.mmoney.la/ewallet-ltc-api/cash-management/request-cash-in.service';

    /// <<<<<<<<< PRODUCTION >>>>>>>>>>>>>>>


    path = '/cashNV9'
    constructor(router: Router, wss: WebSocketServer.Server) {
        this.ssocket = new SocketServerESSP();
        this.ssocket.setCashInstant(this);
        this.wss = wss;
        this.initWs(wss);
        try {
            router.post(this.path + '/', async (req, res) => {
                const d = req.body as IReqModel;
                try {
                    res.send(PrintSucceeded('cashNV9', this.notes, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError(d.command, error, EMessage.error));
                }
            });



            /// 0. init for demo 


            router.get(this.path + '/loadBankNotes', async (req, res) => {
                try {
                    console.log(' REST loadBankNotes');
                    res.send(PrintSucceeded('loadBankNotes', this.notes, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('loadBankNotes', error, EMessage.error));
                }
            });
            router.get(this.path + '/requestMmoneyCashIn', async (req, res) => {
                try {
                    console.log(' REST requestMmoneyCashIn');
                    res.send(PrintSucceeded('loadBankNotes', this.notes, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('loadBankNotes', error, EMessage.error));
                }
            });
            router.get(this.path + '/getOnlineMachines', async (req, res) => {
                try {
                    console.log(' WS getOnlineMachines');
                    res.send(PrintSucceeded('WS getOnlineMachines', this.ssocket.listOnlineMachine(), EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('WS getOnlineMachines', error, EMessage.error));
                }
            });
            router.get(this.path + '/getClientWS', async (req, res) => {
                try {
                    console.log(' WS getClientWS');
                    res.send(PrintSucceeded('WS getClientWS', await this.listOnlineWSClients(), EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('WS getClientWS', error, EMessage.error));
                }
            });
          
            router.post(this.path + '/getBillCashIn', async (req, res) => {
                try {
                    let { msisdn, limit, skip } = req.body;
                    limit = limit > 0 ? limit : 5;
                    const offset = limit * skip;
                    console.log(' REST getBillCashIn');
                    const bEnt: BillCashInStatic = BillCashInFactory(EEntity.billcash + '_' + msisdn, dbConnection);
                    bEnt.sync().then(r => {
                        bEnt.findAndCountAll({ order: ['updatedAt', 'DESC'], limit, offset }).then(async r => {
                            res.send(PrintSucceeded('REST getBillCashIn', r, EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('REST getBillCashIn', e, EMessage.error));
                        })
                    })

                } catch (error) {
                    console.log(error);
                    res.send(PrintError('REST getBillCashIn', error, EMessage.error));
                }
            });
            router.post(this.path + '/getMachineHistory', async (req, res) => {
                try {
                    let { machineId, limit, skip } = req.body;
                    limit = limit > 0 ? limit : 5;
                    const offset = limit * skip;
                    console.log(' REST getMachineHistory');
                    const bEnt: MachineIDStatic = MachineIDFactory(EEntity.machineID + '_' + machineId, dbConnection);
                    bEnt.sync().then(r => {
                        bEnt.findAndCountAll({ order: ['updatedAt', 'DESC'], limit, offset }).then(async r => {
                            res.send(PrintSucceeded('REST getMachineHistory', r, EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('REST getMachineHistory', e, EMessage.error));
                        })
                    })
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('REST getMachineHistory', error, EMessage.error));
                }
            });
            router.post(this.path + '/getMachineId', async (req, res) => {
                try {
                    let { limit, skip } = req.body;
                    limit = limit > 0 ? limit : 5;
                    const offset = limit * skip;
                    console.log(' REST getMachineId');
                    const bEnt: MachineIDStatic = MachineIDFactory(EEntity.machineID, dbConnection);
                    bEnt.sync().then(r => {
                        bEnt.findAndCountAll({ order: ['updatedAt', 'DESC'], limit, offset }).then(async r => {
                            res.send(PrintSucceeded('REST getMachineId', r, EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('REST getMachineId', e, EMessage.error));
                        })
                    })
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('REST getMachineId', error, EMessage.error));
                }
            });



            router.post(this.path + '/validateMmoneyCashIn', async (req, res) => {
                try {
                    console.log(' REST validateMmoneyCashIn');
                    const { n, token } = req.body;
                    const machineId = this.ssocket.findMachineIdToken(token);
                    if (!machineId) throw new Error(EMessage.MachineIdNotFound);

                    // if(this.checkTooFast(machineId.machineId))throw new Error(EMessage.TooFast);
                   
                    

                    const sock = this.ssocket.findOnlneMachine(machineId.machineId);
                    if (!sock) throw new Error(EMessage.MachineIsNotOnline);
                    this.validateMmoneyCashIn(n, 1000, JSON.stringify(machineId)).then(r => {
                        this.requestors.push(r);
                        res.send(PrintSucceeded('validateMmoneyCashIn', {
                            transID: r.transID,
                            transData: [
                                {
                                    accountNameEN: r.transData[0].accountNameEN,
                                    accountRef: r.transData[0].accountRef
                                }
                            ]
                        }, EMessage.succeeded));
                    }).catch(e => {
                        console.log(e);
                        res.send(PrintError(' ERROR validateMmoneyCashIn', e.message, EMessage.error));
                    })
                } catch (error: any) {
                    console.log(error);
                    res.send(PrintError(' ERROR validateMmoneyCashIn', error.message, EMessage.error));
                }
            });
            this.initBankNotes();

        } catch (error) {
            console.log(error);

        }

    }
    checkTooFast(machineId:string){
        const existO =this.lastOperation.find(v=>v.machineId==machineId);

        if(existO){
            console.log('too fast',moment.duration(moment().diff(moment(existO.time))).asMilliseconds());
            console.log('diff',moment().diff(moment(existO.time)));
            console.log(existO);
            
            
            if(moment.duration(moment().diff(moment(existO.time))).asMilliseconds()<3000)
                return false;
            existO.time = new Date();
        }else{
            this.lastOperation.push({machineId:machineId,time:new Date()})
        }
        return true;
    }


    wsSend(clientId: Array<string>, data: any) {
        try {
            console.log('CLIENT ID', clientId, data);
            console.log('CLIENT ID', clientId, data);
            if (clientId.length) {
                this.wss.clients.forEach(v => {
                    console.log('CLIENT ID', v['clientId']);

                    if (v.OPEN) {
                        if (clientId.includes(v['clientId'] + '')) {
                            v.send(JSON.stringify(data));
                            console.log('SENDING ', v['clientId'], data);

                        }
                    }
                })
            }

        } catch (error) {
            console.log('ERROR', error);

        }
    }
    listOnlineWSClients() {
        return new Promise<Array<string>>((resolve, reject) => {
            const clientIds = Array<string>();
            this.wss.clients.forEach(v => {
                console.log('CLIENT ID', v['clientId']);

                clientIds.push(v['clientId'])

                if (clientIds.length == this.wss.clients.size) {
                    resolve(clientIds);
                }
            });
        });


    }
    prePareForMaintenance(){
        //TODO:
        // from REST API , admin can set the maintenance schedule
        // broadCast for all client WS with counter
        // check if the machine ws in the progress
        //.... accept the current transaction first and terminate 
        //.... check machine if it's reading state , and credit state
        // set terminateByAdmin
    }
    initWs(wss: WebSocketServer.Server) {
        try {
            setWsHeartbeat(wss, (ws, data, binary) => {
                console.log('WS HEART BEAT');

                if (data === '{"command":"ping"}') { // send pong if recieved a ping.
                    ws.send(JSON.stringify(PrintSucceeded('pong', { command: 'ping',production:this.production }, EMessage.succeeded)));
                }
            }, 15000);

            wss.on('connection', (ws: WebSocket) => {
                console.log(' WS new connection ', ws.url);

                console.log(' WS current connection is alive', ws['isAlive'])

                ws.onopen = (ev: Event) => {
                    console.log(' WS open', ev);
                }

                // ws['isAlive'] = true;
                ws.onclose = (ev: CloseEvent) => {
                    console.log(' WS CLOSE');
                    const x = this.billCashIn.find(v=>v.clientId=ws['clientId']);
                    if(x){
                       
                        this.ssocket.terminateByClientClose(x.machineId)
                    }
                   
                }
                ws.onerror = (ev: Event) => {
                    console.log(' WS error');
                }

                //connection is up, let's add a simple simple event
                ws.onmessage = async (ev: MessageEvent) => {
                    let d: IReqModel = {} as IReqModel;
                    // ws['isAlive'] = true;
                    try {
                        console.log(' WS comming', ev.data.toString());

                        d = JSON.parse(ev.data.toString()) as IReqModel;

                        const res = {} as IResModel
                        if (d.command == EMACHINE_COMMAND.login) {
                            res.command = d.command;
                            res.message = EMessage.loginok;
                            res.status = 1;
                            if (d.token) {
                                const x = d.token as string;
                                console.log(' WS online machine', this.ssocket.listOnlineMachine());
                                let machineId = this.ssocket.findMachineIdToken(x)

                                if (!machineId) throw new Error('machine is not exist');
                                const sock = this.ssocket.findOnlneMachine(machineId.machineId);
                                if (!sock) throw new Error('machine is not online');
                                this.ssocket.terminateByClientClose(machineId.machineId);
                                const requestor = this.requestors.find(v => v.transID == d.data.transID);
                                if (!requestor) throw new Error('Requestor is not exist');


                                ws['machineId'] = machineId.machineId;
                                ws['clientId'] = uuid4();
                                const bsi = {} as IBillCashIn;
                                bsi.clientId = ws['clientId'];
                                bsi.createdAt = new Date();
                                bsi.updatedAt = bsi.createdAt;
                                bsi.transactionID = d.data.transID;
                                bsi.uuid = uuid4();
                                bsi.userUuid; // later
                                bsi.id; // auto

                                bsi.isActive = true;

                                bsi.badBankNotes = []; // update from machine
                                bsi.bankNotes = []; // update from machine

                                bsi.confirm; // update when cash has come
                                bsi.confirmTime; // update when cash has come

                                bsi.requestTime = new Date();
                                bsi.requestor = requestor;
                                bsi.machineId = machineId.machineId
                                res.data = { clientId: ws['clientId'], billCashIn: bsi };
                                console.log('billCashIn', res.data);

                                ws.send(JSON.stringify(PrintSucceeded(d.command, res, EMessage.succeeded)));

                                bsi.requestor = requestor;
                                this.billCashIn.push(bsi);
                                //

                                this.updateBillCash(bsi, machineId.machineId, bsi.transactionID);
                                this.ssocket.processOrder(machineId.machineId, bsi.transactionID);
                                return;
                            } else throw new Error(EMessage.MachineIdNotFound)
                        } else if (d.command == 'ping') {
                            console.log('WS PING');
                            return ws.send(JSON.stringify(PrintSucceeded(d.command, res, EMessage.succeeded)));
                        }
                        console.log('WS CLOSE');
                        ws.close();



                    } catch (error: any) {
                        console.log(' WS error', error);
                        ws.send(JSON.stringify(PrintError(d.command, [], error.message)));
                    }
                }

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
    sumBN(BN) {
        const bn = new Array<any>();
        BN.forEach(v => {
            if (!bn.length) {
                const y = JSON.parse(JSON.stringify(v));
                y.amount++;
                bn.push(y);
            }
            else {
                const x = bn.find(vx => vx.value == v.value)
                if (x) x.amount++;
                else {
                    const x = JSON.parse(JSON.stringify(v));
                    x.amount++;
                    bn.push(x);
                }
            }
        })
        return bn;
    }

    checkSum(toMsisdn, amount, description, remark1, remark2, remark3, remark4) {
        //const hash = crypto.createHash('sha256').update(pwd).digest('base64');
        //const input_str = `REF,2055220199,150000,LAK,ໝາເຫດ,ເລກອ້າງອິງ01,ເລກອ້າງອິງ02,ເລກອ້າງອິງ03,ເລກອ້າງອິງ04,ltc`;


        const input_str = `REF,${toMsisdn},${amount},LAK,${description},${remark1},${remark2},${remark3},${remark4},ltc`;

        //const input_str = "REF,2055220199,1000,LAK,,,,,,ltc";
        const hash = crypto.createHash("sha256").update(input_str).digest("base64");

        return hash;
    }
    validateMmoneyCashIn(msisdn: string, amount = 1, description: string, remark1 = '', remark2 = '', remark3 = '', remark4 = '') {

        const transID = new Date().getTime();
        return new Promise<IMMoneyRequestRes>((resolve, reject) => {
            try {
                // const mySum = this.checkSum(msisdn, amount, description, remark1, remark2, remark3, remark4);
                // if (moment(this.mmMoneyLogin?.expiry).isBefore(moment()) || !this.mmMoneyLogin) {
                    this.loginMmoney().then(r => {
                        // this.mmMoneyLogin = r;
                        this.loginTokenList.push({m:r,t:transID});
                        console.log('DATA mmMoneyLogin', r);

                        this.requestMmoneyCashin(msisdn, transID, amount, description).then(r => {
                            console.log('DATA requestMmoneyCashin', r);
                            resolve(r)
                        }).catch(e => {
                            console.log('ERROR requestMmoneyCashin', r);
                            reject(e)
                        });

                    }).catch(e => {
                        console.log('ERROR loginMmoney', e);
                        reject(e)
                    })
                // } else {
                //     this.requestMmoneyCashin(msisdn, transID, amount, description).then(r => {
                //         console.log('DATA requestMmoneyCashin', r);
                //         resolve(r)
                //     }).catch(e => {
                //         console.log('ERROR requestMmoneyCashin', e);
                //         reject(e)
                //     });
                // }
            } catch (error) {
                console.log('ERROR refillMMoney', error);
                reject(error)
            }

        })
    }
    refillMMoney(msisdn: string, amount, description, remark1 = '', remark2 = '', remark3 = '', remark4 = '') {

        const transID = new Date().getTime();
        return new Promise<any>((resolve, reject) => {
            try {
                const mySum = this.checkSum(msisdn, amount, description, remark1, remark2, remark3, remark4);
                // if (moment(this.mmMoneyLogin?.expiry).isBefore(moment()) || !this.mmMoneyLogin) {
                    this.loginMmoney().then(r => {
                        this.loginTokenList.push({m:r,t:transID});
                        console.log('DATA mmMoneyLogin', r);

                        this.processRefillMmoney(msisdn, transID, amount, description).then(r => {
                            console.log('DATA processRefillMmoney', r);
                            resolve(r)
                        }).catch(e => {
                            console.log('ERROR processRefillMmoney', r);
                            reject(e)
                        });

                    }).catch(e => {
                        console.log('ERROR loginMmoney', e);
                        reject(e)
                    })
                // } else {
                //     this.processRefillMmoney(msisdn, transID, amount, description).then(r => {
                //         console.log('DATA processRefillMmoney', r);
                //         resolve(r)
                //     }).catch(e => {
                //         console.log('ERROR processRefillMmoney', e);
                //         reject(e)
                //     });
                // }
            } catch (error) {
                console.log('ERROR refillMMoney', error);
                reject(error)
            }

        })

    }

    processRefillMmoney(msisdn: string, transID: number, value: number, remark: string) {
        return new Promise<any>((resolve, reject) => {
            this.requestMmoneyCashin(msisdn, transID, value, remark).then(r => {
                console.log('DATA requestMmoneyCashin', r);
                // {
                //     "22162": "73494",
                //     "transData": [
                //         {
                //             "transCashInID": "20221018110924835233",
                //             "transStatus": "R",
                //             "accountNo": "XXXXXX6226",
                //             "accountNameEN": "Sengkham Latthamone",
                //             "accountRef": "2054656226",
                //             "accountType": "TC WALLET",
                //             "transExpiry": "2022-10-18 11:14:24.835"
                //         }
                //     ],
                //     "responseCode": "0000",
                //     "responseMessage": "Operation success",
                //     "responseStatus": "SUCCESS",
                //     "transID": "202210141402042100639",
                //     "processTime": 23,
                //     "serverDatetime": "2022-10-18 11:09:24",
                //     "serverDatetimeMs": 1666066164838
                // }
                const x = r.transData[0];
                this.confirmMmoneyCashin(value, r.transID, x.transCashInID, remark).then(rx => {
                    console.log('Succeeded confirmMmoneyCashin', rx);
                    resolve(rx)
                }).catch(e => {
                    console.log('ERROR confirm Mmoney Cashin', e);
                    reject(e);
                })
            }).catch(e => {
                console.log('ERROR requestMmoneyCashin', e);
                reject(e);
            })
        });
    }
    loginMmoney() {
        const url = this.production ? this.pathMMoneyLogin : 'http://115.84.121.101:31153/ewallet-ltc-api/oauth/token.service';
        return new Promise<IMMoneyLoginCashin>((resolve, reject) => {
            // const data={
            //     username:'Dokbuakham',
            //     password:'Ko8-En6;',
            //     grant_type:'client_credentials'
            // }
            const params = new URLSearchParams();
            params.append('username', this.production ? this.MMoneyUsername : 'Dokbuakham');
            params.append('password', this.production ? this.MMoneyPassword : 'Ko8-En6;');
            params.append('grant_type', 'client_credentials');
            console.log('PARAM LOGIN', url, params);

            axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(r => {
                console.log('DATA loginMmoney', url, r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e => {
                console.log('ERROR', e);
                reject(e);
            })
        })

    }
    requestMmoneyCashin(msisdn: string, transID, value, remark = this.production ? this.MMoneyName : 'Test Dorkbouakham Cash-In') {
        const url = this.production ? this.pathMMoneyRequest : 'http://115.84.121.101:31153/ewallet-ltc-api/cash-management/request-cash-in.service';
        return new Promise<IMMoneyRequestRes>((resolve, reject) => {
            let data = {
                apiKey: "b7b7ef0830ff278262c72e57bc43d11f",
                apiToken: this.loginTokenList.find(v=>v.t==transID)?.m?.accessToken,
                transID,
                requestorID: this.production ? this.MMoneyRequesterId : 69,
                toAccountOption: "REF",
                toAccountRef: msisdn,
                transAmount: value,
                transCurrency: "LAK",
                transRemark: remark,
                transRefCol1: "",
                transRefCol2: "",
                transRefCol3: "",
                transRefCol4: "",
                transCheckSum: ""
            }

            data.transCheckSum = this.checkSum(data.toAccountRef, value, data.transRemark, data.transRefCol1, data.transRefCol2, data.transRefCol3, data.transRefCol4);
            console.log('IMMoneyRequestRes', data);
            axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(r => {
                console.log('DATA requestMmoneyCashin', r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e => {
                console.log('ERROR requestMmoneyCashin', e);
                reject(e);
            })

        })

    }
    confirmCredit(machineId: string, channel: number, transactionID: number) {

        const x = this.billCashIn.find(v => v.transactionID == transactionID && v.machineId == machineId);
        try {
            if (!x) throw new Error('Confirm FAILED  bill not found' + channel + transactionID);
            const n = this.notes.find(v => v.channel == channel);
            if (!n) throw new Error('Confirm FAILED  note not found' + channel + transactionID);
            console.log('MACHINE ID', machineId);
            this.refillMMoney(x.requestor.transData[0].accountRef, n.value, machineId + '-' + transactionID).then(rx => {
                console.log('Succeeded confirmMmoneyCashin', rx);
                // save to database
                x.bankNotes.push(n);
                x.confirm = rx;
                x.confirmTime = new Date();
                // SAVE TO DATABASE
                // this.completedBillCashIn.push(JSON.parse(JSON.stringify(x)))
                const res = {} as IResModel;
                res.command = EMACHINE_COMMAND.confirm;
                res.message = EMessage.confirmsucceeded;
                res.status = 1;
                res.data = x;
                this.updateBillCash(x, machineId, transactionID);

                this.wsSend([x?.clientId + ''], res);
                this.setCounter(machineId, transactionID, EMACHINE_COMMAND.ENABLE);
                this.ssocket.setMachineCounter(machineId);
            }).catch(e => {
                console.log('ERROR confirm Mmoney Cashin', e);

                this.updateBadBillCash(x, machineId, transactionID);
                // this.badBillCashIn.push({ transactionID, badBankNotes: [{ channel } as IBankNote], machineId } as IBillCashIn)
                const res = {} as IResModel;
                res.command = EMACHINE_COMMAND.status;
                res.message = e.message;
                res.status = 0;
                this.wsSend([x?.clientId + ''], res);
            })
        } catch (error: any) {
            // TODO: Notify to admin
            console.log(error);
            // save to database 
            // this.badBillCashIn.push({ transactionID, badBankNotes: [{ channel } as IBankNote], machineId } as IBillCashIn)
            this.updateBadBillCash(x as any, machineId, transactionID);
            const res = {} as IResModel;
            res.command = EMACHINE_COMMAND.status;
            res.message = error.message;
            res.status = 0;
            this.wsSend([x?.clientId + ''], res);

        }
    }
    updateBillCash(billCash: IBillCashIn, machineId: string, transactionID: number) {
        try {
            const bEnt: BillCashInStatic = BillCashInFactory(EEntity.billcash + '_'+this.production+'_' + billCash?.requestor?.transData[0]?.accountRef, dbConnection);
            bEnt.sync().then(r => {
                bEnt.create(billCash).then(rx => {
                    console.log('SAVED BILL CASH-IN', EEntity.billcash + '_'+this.production+'_' + billCash?.requestor?.transData[0]?.accountRef);
                })
            })
            const mId = this.ssocket.findMachineId(machineId);
            const mEnt: MachineIDStatic = MachineIDFactory(EEntity.machineIDHistory + '_'+this.production+'_' + machineId, dbConnection);
            mEnt.sync().then(r => {
                mEnt.create({
                    logintoken: this.loginTokenList.find(v=>v.t==transactionID)?.m?.accessToken + '',
                    machineCommands: '',
                    machineId: mId?.machineId + '_' + mId?.otp,
                    machineIp: '',
                    bill: billCash
                }).then(rx => {
                    console.log('SAVED MachineIDStatic', EEntity.machineIDHistory + '_'+this.production+'_' + mId?.machineId);
                    
                }).catch(e => {
                    console.log('  mEnt.create', e);
                })
            })
        } catch (error) {
            console.log('Error updateBillCash');

        }

    }
    updateBadBillCash(billCash: IBillCashIn, machineId: string, transactionID: number) {
        try {
            const bEnt: BillCashInStatic = BillCashInFactory(EEntity.badbillcash + '_'+this.production+'_' + billCash?.requestor?.transData[0]?.accountRef, dbConnection);
            bEnt.sync().then(r => {
                bEnt.create(billCash).then(rx => {
                    console.log('SAVED BILL CASH-IN', EEntity.badbillcash + '_'+this.production+'_' + billCash?.requestor?.transData[0]?.accountRef);

                })
            }).catch(e => {
                console.log(' bEnt.create', e);

            })
            const mId = this.ssocket.findMachineId(machineId);
            const mEnt: MachineIDStatic = MachineIDFactory(EEntity.machineIDHistory + '_'+this.production+'_' + machineId, dbConnection);
            mEnt.sync().then(r => {
                mEnt.create({
                    logintoken: this.loginTokenList.find(v=>v.t==transactionID)?.m?.accessToken + '',
                    machineCommands: '',
                    machineId: mId?.machineId + '_' + mId?.otp,
                    machineIp: '',
                    bill: billCash
                }).then(rx => {
                    console.log('SAVED MachineIDStatic', EEntity.machineIDHistory + '_' + mId?.machineId);
                    // const i = this.billCashIn.findIndex(v => v.transactionID == transactionID && v.machineId == machineId);
                    // this.billCashIn.splice(i, 1);
                }).catch(e => {
                    console.log('  mEnt.create', e);
                })
            })
        } catch (error) {
            console.log('Error updateBillCash');

        }

    }

    timers = new Array<{ clientId: string, t: any, ttl: number, machineId: string }>();
    setCounter(machineId: string, transactionID: number, command: EMACHINE_COMMAND) {
        const x = this.billCashIn.find(v => v.transactionID == transactionID && machineId == v.machineId);

        try {
            if (this.timers.find(v => v.machineId == machineId && v.ttl <= 5)) {
                this.ssocket.haltOrder(machineId);
                throw new Error(EMessage.TransactionTimeOut);

            }
            // if (!this.timers.find(v => v.machineId == machineId)) {
            //     this.ssocket.haltOrder(machineId);
            //     throw new Error(EMessage.transactionnotfound);

            // }
            if (!x) throw new Error('Confirm FAILED  bill not found' + command + transactionID);
            
            const res = {} as IResModel;
            if (command == EMACHINE_COMMAND.ENABLE) {
                res.command = EMACHINE_COMMAND.start;
                res.message = EMessage.succeeded;
                res.status = 1;
                res.data = 30;
                // 
                console.log('TIMERFIND INDEX ');

                const i = this.timers.findIndex(v => v.clientId == x.clientId);
                if (i != -1) {
                    console.log('TIMER EXIST and clear');
                    clearInterval(this.timers[i].t);
                    this.timers.splice(i, 1);
                }
                console.log('TIMER CREATE TIMER ');
                const that = this;
                const t = setInterval(() => {
                    console.log('TIMER find and creating');
                    const y = that.timers.find(vy => vy.clientId == x?.clientId);
                    if (!y) {
                        console.log('TIMER CREATE 30 ');
                        res.data = { t: 30 };
                    }
                    if (y) {
                        res.command = EMACHINE_COMMAND.setcounter;
                        res.message = EMessage.succeeded;
                        res.status = 1;
                        res.data = { t: --y.ttl };
                        console.log('setcounter exist -- ', y.ttl);

                        console.log('setcounter response WS', x?.clientId);
                        console.log('setcounter response WS', res);
                        that.wsSend([x?.clientId + ''], res);
                        // this.ssocket.setMachineCounter(machineId);
                        // remove counter

                        console.log('setcounter check if it is time out');

                        if (y.ttl == 0) {
                            console.log('setcounter time out');
                            const i = that.timers.findIndex(v => v.clientId == x.clientId);
                            const xi =this.loginTokenList.findIndex(v=>v.t==x.transactionID);
                            if(xi!=-1)
                            this.loginTokenList.splice(xi,1);
                            if (i != -1) {
                                console.log('setcounter response WS');
                                clearInterval(that.timers[i].t);
                                that.timers.splice(i, 1);
                                that.ssocket.haltOrder(machineId);
                                res.command = EMACHINE_COMMAND.stop;
                                that.wsSend([x?.clientId + ''], res);
                            }
                        }
                    }
                }, 1000);
                this.timers.push({
                    clientId: x.clientId, t, ttl: 30, machineId
                }
                )
                return;

            } else if (command == EMACHINE_COMMAND.READ_NOTE) {
                //pause
                // setTimeout(()=>{

                this.setCounter(machineId, transactionID, EMACHINE_COMMAND.ENABLE);
                this.ssocket.setMachineCounter(machineId);
                // },300)

                return;
            }
            else if (command == EMACHINE_COMMAND.REJECT_BANKNOTE) {

                this.setCounter(machineId, transactionID, EMACHINE_COMMAND.ENABLE);
                this.ssocket.setMachineCounter(machineId);
                return;
            }
            else if (command == EMACHINE_COMMAND.NOTE_REJECTED) {

                this.setCounter(machineId, transactionID, EMACHINE_COMMAND.ENABLE);
                this.ssocket.setMachineCounter(machineId);
                return;
            }
            else if (command == EMACHINE_COMMAND.DISABLE) {
                res.command = EMACHINE_COMMAND.stop;
                res.message = EMessage.disabled;
                res.status = 1;

            } else if (command == EMACHINE_COMMAND.JAMMED) {
                res.command = EMACHINE_COMMAND.stop;
                res.message = EMessage.jammed;
                res.status = 1;
            }
            console.log('TIMER response WS stop');
            this.wsSend([x?.clientId + ''], res);
            const i = this.timers.findIndex(v => v.clientId == x.clientId);
            if (i != -1) {
                clearInterval(this.timers[i].t);
                this.timers.splice(i, 1);
            }
        } catch (error: any) {
            console.log(error);
            // this.badBillCashIn.push({ transactionID, badBankNotes: [{} as IBankNote], machineId } as IBillCashIn)
            this.updateBadBillCash(x ? x : {} as IBillCashIn, machineId, transactionID);
            const res = {} as IResModel;
            res.command = EMACHINE_COMMAND.status;
            res.message = error.message;
            res.status = 0;
            this.wsSend([x?.clientId + ''], res);
            // TODO: Notify to admin

        }
    }



    confirmMmoneyCashin(value, transID, transCashInID, remark = 'Test Cash In') {
        const url = this.production ? this.pathMMoneyConfirm : 'http://115.84.121.101:31153/ewallet-ltc-api/cash-management/confirm-cash-in.service';
        return new Promise<any>((resolve, reject) => {
            const data = {
                apiKey: "efca1d20e1bdfc07b249e502f007fe0c",
                apiToken: this.loginTokenList.find(v=>v.t==Number(transID+''))?.m?.accessToken,
                transID,
                requestorID: this.production ? this.MMoneyRequesterId : 69,
                transCashInID
            }

            axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(r => {
                console.log('DATA confirmMmoneyCashin', r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e => {
                console.log('ERROR confirmMmoneyCashin', e);
                reject(e);
            })

        })

    }

    inquiryMmoneyCashin(transID, transCashInID) {
        const url = this.production ? this.pathMMoneyInquiry : 'http://115.84.121.101:31153/ewallet-ltc-api/cash-management/inquiry-cash-in.service';
        return new Promise<any>((resolve, reject) => {
            const data = {
                apiKey: "efca1d20e1bdfc07b249e502f007fe0c",
                apiToken: this.loginTokenList.find(v=>v.t==Number(transID+''))?.m?.accessToken,
                transID,
                requestorID: this.production ? this.MMoneyRequesterId : 69,
                transCashInID
            }
            axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(r => {
                console.log('DATA inquiryMmoneyCashin ', r.data);
                resolve(r.data);
                // {
                //     "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE2NjYxMTA4MjAsImNsaWVudF9pZCI6IkRva2J1YWtoYW0ifQ.uQNNHrtrTRnCL8fr8CENlGzvhawpWLhn5sZD8DBancAuQ6Z4qEom-4p7ugEPSXRiDmCgDJKIP212qzNQT0PxWw",
                //     "tokenType": "Bearer",
                //     "expiresIn": 86400000,
                //     "userName": "Dokbuakham",
                //     "issued": "2022-10-17 23:33:40",
                //     "expiry": "2022-10-18 23:33:40"
                // }
            }).catch(e => {
                console.log('ERROR inquiryMmoneyCashin', e);
                reject(e);
            })

        })

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
        this.wss.close();
        this.ssocket.server.close();
        this.ssocket.sclients.forEach(v => {
            v.destroy();
        });
    }
}


