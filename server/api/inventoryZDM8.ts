import axios from 'axios';
import { Router } from 'express';
import * as WebSocketServer from 'ws';
import { randomUUID } from 'crypto';

import { broadCast, PrintError, PrintSucceeded } from '../services/service';
import { EClientCommand, EZDM8_COMMAND, EMACHINE_COMMAND, EMessage, IMachineClientID, IMachineID, IMMoneyQRRes, IReqModel, IResModel, IStock, IVendingMachineBill, IVendingMachineSale, IMMoneyLogInRes, IMMoneyGenerateQR, IMMoneyGenerateQRRes, IMMoneyConfirm, IBillProcess } from '../entities/syste.model';
import moment from 'moment';
import { v4 as uuid4 } from 'uuid';
import { setWsHeartbeat } from 'ws-heartbeat/server';
import { SocketServerZDM8 } from './socketServerZDM8';
export class InventoryZDM8 {
    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket: SocketServerZDM8 = {} as SocketServerZDM8;

    stock = new Array<IStock>();
    vendingOnSale = new Array<IVendingMachineSale>();
    vendingBill = new Array<IVendingMachineBill>();
    vendingBillPaid = new Array<IVendingMachineBill>();
    clients = new Array<IMachineID>();


    constructor(router: Router, wss: WebSocketServer.Server, socket: SocketServerZDM8) {
        this.ssocket = socket;
        this.wss = wss;
        this.initWs(wss);
        try {



            router.post('/', async (req, res) => {
                const d = req.body as IReqModel;
                try {
                    console.log('POST Data', d);




                    if (d.command == EClientCommand.confirmMMoney) {
                        console.log('CB COMFIRM', d);
                        const c = d.data as IMMoneyConfirm;
                        // c.wallet_ids
                        this.callBackConfirm(c.tranid_client, c.amount).then(r => {
                            return res.send(PrintSucceeded(d.command, { bill: r, transactionID: c.tranid_client }, EMessage.succeeded));
                        }).catch(e => {
                            return res.send(PrintError(d.command, e, EMessage.error));
                        })
                        return;
                    }
                    if (d.command == 'test') {
                        console.log('CB COMFIRM test', d);
                        if (!d.data.p || !d.data.machineId) throw new Error('Test cofirm failed')
                        this.callBackConfirmTest(d.data.p, d.data.machineId).then(r => {
                            return res.send(PrintSucceeded(d.command, { bill: r, transactionID: 'test' }, EMessage.succeeded));
                        }).catch(e => {
                            return res.send(PrintError(d.command, e, EMessage.error));
                        })
                        return;
                    }


                    const clientId = d.data.clientId;
                    let loggedin = false;
                    // console.log(' WS client length', this.wss.clients);

                    this.wss.clients.forEach(v => {
                        console.log('WS CLIENT ID', v['clientId'], '==>' + clientId);

                        if (v['clientId'] == clientId)
                            loggedin = true;
                    })
                    if (!loggedin) throw new Error(EMessage.notloggedinyet);

                    else if (d.command == EClientCommand.list) {
                        return res.send(PrintSucceeded(d.command, this.vendingOnSale, EMessage.succeeded));
                    } else if (d.command == EClientCommand.buyMMoney) {
                        const ids = d.data.ids as Array<IVendingMachineSale>; // item id
                        const machineId = this.ssocket.findMachineIdToken(d.token);
                        const position = d.data.position;
                        if (!machineId) throw new Error('Invalid token');
                        if (!Array.isArray(ids)) throw new Error('Invalid array id');
                        // console.log('this.vendingOnSale', this.vendingOnSale);
                        const checkIds = Array<IVendingMachineSale>();
                        ids.forEach(v => {
                            const x = this.vendingOnSale.find(vx => {
                                if (!checkIds.length && vx.stock.id + '' == v.stock.id + '') {
                                    return true;
                                }
                                else if (vx.stock.qtty > 0 && vx.position == v.position && checkIds.filter(vy => vy.stock.id + '' == v.stock.id + '').reduce((a, b) => {
                                    return a + b.stock.qtty;
                                }, 0) <= vx.stock.qtty) {
                                    return true;
                                }
                                return false;
                            });
                            if (x) {
                                const y = JSON.parse(JSON.stringify(x)) as IVendingMachineSale;
                                y.stock.qtty = 1;
                                checkIds.push(y);
                            }

                            // return false;
                        })

                        // console.log('checkIds', checkIds, 'ids', ids);

                        if (checkIds.length < ids.length) throw new Error('some array id not exist or wrong qtty');

                        const value = checkIds.reduce((a, b) => {
                            return a + (b.stock.price * b.stock.qtty);
                        }, 0);
                        // console.log('qtty', checkIds);
                        console.log('ids', ids.length);

                        console.log(' value' + d.data.value + ' ' + value);

                        if (Number(d.data.value) != value) throw new Error('Invalid value' + d.data.value + ' ' + value);

                        const transactionID = new Date().getTime();
                        const qr = await this.generateBillMMoney(value, transactionID + '');
                        if (!qr.qrCode) throw new Error(EMessage.GenerateQRMMoneyFailed);
                        const bill = {
                            uuid: uuid4(),
                            clientId,
                            qr: qr.qrCode,
                            transactionID,
                            machineId: machineId.machineId,
                            hashM: '',
                            hashP: '',
                            paymentmethod: d.command,
                            paymentref: qr.name,
                            paymentstatus: 'pending',
                            paymenttime: new Date(),
                            requestpaymenttime: new Date(),
                            totalvalue: value,
                            vendingsales: ids
                        };
                        this.vendingBill.push(bill);

                        return res.send(PrintSucceeded(d.command, bill, EMessage.succeeded));
                    } else {
                        return res.send(PrintError(d.command, [], EMessage.notsupport));
                    }
                } catch (error) {
                    console.log(error);
                    res.send(PrintError(d.command, error, EMessage.error));
                }
            });



            /// 0. init for demo 

            router.get('/init', async (req, res) => {
                try {
                    const machineId = req.query['machineId'];
                    if (!this.ssocket.findOnlneMachine(machineId + '')) throw new Error(EMessage.MachineIsNotOnline)
                    this.init(machineId + '');

                    res.send(PrintSucceeded('init', this.vendingOnSale, EMessage.succeeded));
                } catch (error: any) {
                    console.log(error);
                    res.send(PrintError('init', error, error.message));
                }
            });
            router.get('/getPaidBills', async (req, res) => {
                try {
                    res.send(PrintSucceeded('init', this.vendingBillPaid, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });
            router.get('/getBills', async (req, res) => {
                try {
                    res.send(PrintSucceeded('init', this.vendingBill, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });
            router.get('/getOnlineMachines', async (req, res) => {
                try {
                    console.log(' WS getOnlineMachines');
                    res.send(PrintSucceeded('init', this.ssocket.listOnlineMachine(), EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });


            router.get('/submit_command', async (req, res) => {
                try {
                    const machineId = req.query['machineId'] + '';
                    const position = Number(req.query['position']) ? Number(req.query['position']) : 0;
                    console.log(' WS submit command', machineId, position);

                    res.send(PrintSucceeded('submit command', this.ssocket.processOrder(machineId, position, new Date().getTime()), EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });
        } catch (error) {
            console.log(error);

        }

    }
    init(machineId: string) {
        this.stock = [];
        this.vendingOnSale = [];
        try {
            this.stock.push(...[{
                id: 0,
                name: 'Coke can 330ml',
                image: 'cokecan.jpg'
                ,
                price: 9000,
                qtty: 5,
                hashP: '',
                hashM: ''
            }, {
                id: 1,
                name: 'Pepsi can 330ml',
                image: 'pepsican.jpeg'
                ,
                price: 9000,
                qtty: 5,
                hashP: '',
                hashM: ''

            }, {
                id: 2,
                name: 'Oishi green tea 450ml',
                image: 'oishiteabottle.png'
                ,
                price: 12000,
                qtty: 5,
                hashP: '',
                hashM: ''
            }
                , {
                id: 3,
                name: 'Chinese tea 330ml',
                image: 'chineseteacan.jpg',
                price: 8000,
                qtty: 5,
                hashP: '',
                hashM: ''

            }
                , {
                id: 4,
                name: 'Water tiger head 380ml',
                image: 'tigerheadbottle.png',
                price: 9000,
                qtty: 5,
                hashP: '',
                hashM: ''
            }]
            );
            let x = 5;
            let y = 0;
            new Array(60).fill(0).forEach((v, i) => {
                const c = x > i ? i : (i - (x * y) - 1);
                !(i % x) && i >= x ? y++ : '';
                this.vendingOnSale.push({
                    machineId,
                    stock: this.stock[c],
                    position: i,
                    hashP: '',
                    hashM: ''
                })
            });
        } catch (error) {
            console.log(error);
        }
    }

    generateBillMMoney(value: number, transactionID: string) {
        return new Promise<IMMoneyGenerateQRRes>((resolve, reject) => {
            // generate QR from MMoney
            this.loginMmoney().then(r => {
                if (r) {
                    const qr = {
                        amount: value,
                        phonenumber: '2054445447',// '2055220199',
                        transactionID
                    } as IMMoneyGenerateQR;

                    axios.post<IMMoneyGenerateQRRes>('https://qr.mmoney.la/test/generateQR',
                        qr,
                        { headers: { 'mmoney-token': this.mMoneyLoginRes.token } }).then(rx => {
                            // console.log(r);
                            if (rx.status) {
                                resolve(rx.data as IMMoneyGenerateQRRes);
                            } else {
                                reject(new Error(rx.statusText));
                            }

                        }).catch(e => {
                            reject(e)
                        });
                } else {
                    reject(new Error(EMessage.loginfailed))
                }

            }).catch(e => {
                console.log(e);
                reject(e);
            })

        })
    }
    mMoneyLoginRes = {} as IMMoneyLogInRes;
    loginMmoney() {
        const username = 'test';
        const password = '12345';
        return new Promise<IMMoneyLogInRes>((resolve, reject) => {
            try {
                if (this.mMoneyLoginRes.expiresIn) {
                    if (new Date(this.mMoneyLoginRes.expiresIn).getTime() > new Date().getTime()) {
                        return resolve(this.mMoneyLoginRes);
                    }
                }
                axios.post('https://qr.mmoney.la/test/login', { username, password }).then(r => {
                    // console.log(r);
                    if (r.status) {
                        this.mMoneyLoginRes = r.data as IMMoneyLogInRes;
                        this.mMoneyLoginRes.expiresIn = moment().add(moment.duration('PT' + this.mMoneyLoginRes.expiresIn.toUpperCase()).asMilliseconds(), 'milliseconds') + '';
                        resolve(this.mMoneyLoginRes);
                    } else {
                        reject(new Error(EMessage.loginfailed));
                    }

                }).catch(e => {
                    reject(e)
                });
            } catch (error) {
                console.log(error);

            }

        })
    }
    callBackConfirmTest(position: Array<number>, machineId: string) {
        return new Promise<IVendingMachineBill>((resolve, reject) => {
            try {
                position.forEach((p, i) => {
                    this.wss.clients.forEach(v => {
                        setTimeout(() => {
                            const position = this.ssocket.processOrder(machineId, p, -1);
                            const res = {} as IResModel;
                            res.command = EMACHINE_COMMAND.confirm;
                            res.message = EMessage.confirmsucceeded;
                            res.status = 1;
                            res.data = { bill: null, position } as unknown as IBillProcess;
                            v.send(JSON.stringify(res));
                        }, 3000 * i);
                    })
                })
                resolve({} as IVendingMachineBill);
            } catch (error) {
                console.log(error);
                reject(error);
            }
        })
    }
    callBackConfirm(transactionID: string, amount: number) {
        return new Promise<IVendingMachineBill>((resolve, reject) => {
            try {
                const bill = this.vendingBill.find(v => v.transactionID + '' == transactionID && v.totalvalue == amount);
                if (!bill) throw new Error(EMessage.billnotfound);
                bill.paymentstatus = 'paid';
                bill.paymentref = '';
                bill.paymenttime = new Date();

                bill.vendingsales.map(v => v.position).forEach((p, i) => {
                    this.wss.clients.forEach(v => {
                        const x = v['clientId'] as string;
                        if (x) {
                            if (x == bill.clientId) {

                                setTimeout(() => {
                                    const position = this.ssocket.processOrder(bill.machineId, p, bill.transactionID);
                                    const res = {} as IResModel;
                                    res.command = EMACHINE_COMMAND.confirm;
                                    res.message = EMessage.confirmsucceeded;
                                    res.status = 1;

                                    const i = this.vendingBill.findIndex(i => i.uuid == bill.uuid);
                                    this.vendingBill.splice(i, 1);

                                    const ids = bill.vendingsales.map(v => v.stock.id);
                                    ids.forEach(vid => {
                                        const x = this.vendingOnSale.find(v => v.stock.id == vid);
                                        if (x)
                                            x.stock.qtty--;

                                    });
                                    res.data = { bill, position } as unknown as IBillProcess;
                                    v.send(JSON.stringify(res));
                                }, 3000 * i);
                            }
                        }
                    })
                })

                resolve(bill);
            } catch (error) {
                console.log(error);
                reject(error);
            }

        })

    }

    checkMachineId(machineId: string): IMachineClientID | null {
        const x = this.ssocket.sclients.find(v => {
            const x = v['machineId'] as IMachineClientID;
            if (x) {
                return x.machineId == machineId;
            }
            return false;
        });
        if (x) return x['machineId'] as IMachineClientID;
        return null;

    }
    initWs(wss: WebSocketServer.Server) {
        try {


            wss.on('connection', (ws: WebSocket) => {
                console.log(' WS new connection ', ws.url);

                console.log(' WS current connection is alive', ws['isAlive'])

                ws.onopen = (ev: Event) => {
                    console.log(' WS open', ev);
                }

                // ws['isAlive'] = true;
                ws.onclose = (ev: CloseEvent) => {

                }
                ws.onerror = (ev: Event) => {
                    console.log(' WS error', ev);
                }
                setWsHeartbeat(wss, (wsx, data, binary) => {
                    console.log('WS HEART BEAT');

                    if (data === '{"command":"ping"}') { // send pong if recieved a ping.
                        ws.send(JSON.stringify(PrintSucceeded('pong', { command: 'ping' }, EMessage.succeeded)));
                    }
                }, 15000);
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

                                if (!machineId) throw new Error('machine is not exit');
                                ws['machineId'] = machineId.machineId;
                                ws['clientId'] = uuid4();
                                res.data = { clientId: ws['clientId'] };
                                return ws.send(JSON.stringify(PrintSucceeded(d.command, res, EMessage.succeeded)));
                            } else throw new Error(EMessage.MachineIdNotFound)
                            
                        }else if(d.command=='ping'){
                            return;
                        }
                        console.log('WS CLOSE');
                        
                        ws.close();

                    } catch (error: any) {
                        console.log(' WS error', error);
                        ws.send(JSON.stringify(PrintError(d.command, [], error.message)));
                        ws.close();
                    }
                }

            });
        } catch (error) {
            console.log(error);

        }
    }
}


