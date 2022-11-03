import axios from 'axios';
import { Router } from 'express';
import * as WebSocketServer from 'ws';
import { randomUUID } from 'crypto';

import { broadCast, PrintError, PrintSucceeded } from '../services/service';
import { EClientCommand, EZDM8_COMMAND, EMACHINE_COMMAND, EMessage, IMachineClientID, IMachineID, IMMoneyQRRes, IReqModel, IResModel, IStock, IVendingMachineBill, IVendingMachineSale, IMMoneyLogInRes, IMMoneyGenerateQR, IMMoneyGenerateQRRes, IMMoneyConfirm, IBillProcess, IBaseClass } from '../entities/system.model';
import moment from 'moment';
import { v4 as uuid4 } from 'uuid';
import { setWsHeartbeat } from 'ws-heartbeat/server';
import { SocketServerVMC } from './socketServerVMC';
export class InventoryVMC implements IBaseClass {
    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket: SocketServerVMC = {} as SocketServerVMC;

    stock = new Array<IStock>();
    vendingOnSale = new Array<IVendingMachineSale>();
    vendingBill = new Array<IVendingMachineBill>();
    vendingBillPaid = new Array<IVendingMachineBill>();
    clients = new Array<IMachineID>();
    delayTime = 3000;
    path='/vmc';
    public phonenumber ='2054452222'; //TPLUS
    public walletId = '2443128596';// TPLUS
    mmoneyusername='dbk';
    mmoneypassword='dbk@2022';
    production=true;
    constructor(router: Router, wss: WebSocketServer.Server) {
        this.ssocket = new SocketServerVMC();
        this.wss = wss;
        this.initWs(wss);
        try {
            router.get(this.path+'/', async (req, res) => {
                console.log('TEST IS WORKING');
                res.send({data:'test is working'})
            });
            router.post(this.path+'/', async (req, res) => {
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
                    // if (d.command == 'test') {
                    //     console.log('CB COMFIRM test', d);
                    //     if (!d.data.p || !d.data.machineId) throw new Error('Test cofirm failed')
                    //     this.callBackConfirmTest(d.data.p, d.data.machineId).then(r => {
                    //         return res.send(PrintSucceeded(d.command, { bill: r, transactionID: 'test' }, EMessage.succeeded));
                    //     }).catch(e => {
                    //         return res.send(PrintError(d.command, e, EMessage.error));
                    //     })
                    //     return;
                    // }


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
                        const sale = d.data.ids as Array<IVendingMachineSale>; // item id
                        const machineId = this.ssocket.findMachineIdToken(d.token);
                        const position = d.data.position;
                        if (!machineId) throw new Error('Invalid token');
                        if (!Array.isArray(sale)) throw new Error('Invalid array id');
                        // console.log('this.vendingOnSale', this.vendingOnSale);
                        const checkIds = Array<IVendingMachineSale>();

                        sale.forEach(v => {
                            v.stock.qtty = 1;
                            const x = this.vendingOnSale.find(vx => {
                                if (!checkIds.length
                                    && vx.stock.id + '' == v.stock.id + ''
                                    && vx.position == v.position
                                    && vx.stock.qtty >= v.stock.qtty
                                    && vx.stock.qtty > 0) {
                                    return true;
                                }
                                else if (vx.stock.qtty > 0
                                    && vx.stock.id + '' == v.stock.id + ''
                                    && vx.position == v.position
                                    && vx.stock.qtty >= v.stock.qtty
                                    && vx.stock.qtty > 0
                                    && checkIds.filter(vy => vy.stock.id + '' == v.stock.id + '').reduce((a, b) => {
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

                        console.log('checkIds', checkIds, 'ids', sale);

                        if (checkIds.length < sale.length) throw new Error('some array id not exist or wrong qtty');

                        const value = checkIds.reduce((a, b) => {
                            return a + (b.stock.price * b.stock.qtty);
                        }, 0);
                        // console.log('qtty', checkIds);
                        console.log('ids', sale.length);

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
                            vendingsales: sale
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

            router.get(this.path+'/init', async (req, res) => {
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
            router.get(this.path+'/refresh', async (req, res) => {
                try {
                    this.wss.clients.forEach(v => {
                        if (v.OPEN) {
                            v.send(JSON.stringify(PrintSucceeded('refresh', true, EMessage.succeeded)));
                        }
                    })

                    res.send(PrintSucceeded('refresh', true, EMessage.succeeded));
                } catch (error: any) {
                    console.log(error);
                    res.send(PrintError('init', error, error.message));
                }
            });
            router.get(this.path+'/getPaidBills', async (req, res) => {
                try {
                    res.send(PrintSucceeded('init', this.vendingBillPaid, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });
            router.get(this.path+'/getBills', async (req, res) => {
                try {
                    res.send(PrintSucceeded('init', this.vendingBill, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });
            router.get(this.path+'/getOnlineMachines', async (req, res) => {
                try {
                    console.log(' WS getOnlineMachines');
                    res.send(PrintSucceeded('init', this.ssocket.listOnlineMachine(), EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });


            router.get(this.path+'/submit_command', async (req, res) => {
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
            const exception =[6,7,8,9,10,16,17,18,19,20]
            new Array(60).fill(0).forEach((v, i) => {
                const c = x > i ? i : (i - (x * y) - 1);
                !(i % x) && i >= x ? y++ : '';
                if(!exception.includes(i))
                this.vendingOnSale.push({
                    machineId,
                    stock: this.stock[c],
                    position: i+1, // for VMC only
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
                        phonenumber:this.production? this.phonenumber:'2055516321',// '2055220199',
                        transactionID
                    } as IMMoneyGenerateQR;

                    axios.post<IMMoneyGenerateQRRes>('https://qr.mmoney.la/test/generateQR',
                        qr,
                        { headers: { 'mmoney-token': this.mMoneyLoginRes.token } }).then(rx => {
                            console.log('generateBillMMoney',r);
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
        const username = this.production?this.mmoneyusername:'test';
        const password = this.production?this.mmoneypassword:'12345';
        return new Promise<IMMoneyLogInRes>((resolve, reject) => {
            try {
                if (this.mMoneyLoginRes.expiresIn) {
                    if (new Date(this.mMoneyLoginRes.expiresIn).getTime() > new Date().getTime()) {
                        return resolve(this.mMoneyLoginRes);
                    }
                }
                axios.post('https://qr.mmoney.la/test/login', { username, password }).then(r => {
                     console.log(r);
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
    // callBackConfirmTest(position: Array<number>, machineId: string) {
    //     return new Promise<IVendingMachineBill>((resolve, reject) => {
    //         try {
    //             position.forEach((p, i) => {
    //                 this.wss.clients.forEach(v => {
    //                     setTimeout(() => {
    //                         const position = this.ssocket.processOrder(machineId, p, -1);
    //                         const res = {} as IResModel;
    //                         res.command = EMACHINE_COMMAND.confirm;
    //                         res.message = EMessage.confirmsucceeded;
    //                         res.status = 1;
    //                         res.data = { bill: null, position } as unknown as IBillProcess;
    //                         v.send(JSON.stringify(res));
    //                     }, 3000 * i);
    //                 })
    //             })
    //             resolve({} as IVendingMachineBill);
    //         } catch (error) {
    //             console.log(error);
    //             reject(error);
    //         }
    //     })
    // }
    callBackConfirm(transactionID: string, amount: number) {
        return new Promise<IVendingMachineBill>((resolve, reject) => {
            try {
                console.log('transactionID', transactionID, 'value', amount);

                const bill = this.vendingBill.find(v => v.transactionID + '' == transactionID && v.totalvalue == amount);
                if (!bill) throw new Error(EMessage.billnotfound);
                bill.paymentstatus = 'paid';
                bill.paymentref = '';
                bill.paymenttime = new Date();

                const cbill = bill.vendingsales.length;
                bill.vendingsales.forEach((p, i) => {
                    let x = '';
                    let y: WebSocketServer.WebSocket = null as any;
                    this.wss.clients.forEach(v => {
                        x = v['clientId'] as string;
                        if (x) {
                            if (x == bill.clientId) {
                                y = v;
                            }
                        }
                    })
                    if (y) {
                        this.setTask(bill, p, y, cbill, i).then(() => {
                            if (i == bill.vendingsales.length - 1) {
                                resolve(bill);
                            }
                        })

                    }
                })


            } catch (error) {
                console.log(error);
                reject(error);
            }

        })

    }
    setTask(bill: IVendingMachineBill, p: IVendingMachineSale, y: WebSocketServer.WebSocket, cbill: number, i: number) {
        return new Promise<any>((resolve, reject) => {
            setTimeout(() => {
                const position = this.ssocket.processOrder(bill.machineId, p.position, bill.transactionID);
                const res = {} as IResModel;
                res.command = EMACHINE_COMMAND.confirm;
                res.message = EMessage.confirmsucceeded;
                res.status = 1;
                // const ids = bill.vendingsales.map(v => v.stock.id);
                bill.vendingsales.find(v => {
                    const x = this.vendingOnSale.find(vx => vx.stock.id == v.stock.id && v.position == vx.position);
                    if (x){
                        x.stock.qtty--;
                        return true;
                    }
                    return false;
                });
                res.data = { bill, position } as unknown as IBillProcess;
                y.send(JSON.stringify(res), e => {
                    if (e) console.log(e);
                    if (i + 1 >= cbill) {
                        const x = this.vendingBill.findIndex(x => x.uuid == bill.uuid);
                        if (x != -1) {
                            const y = this.vendingBill.splice(x, 1);
                            this.vendingBillPaid.push(...y)
                        }
                    }
                });
            }, this.delayTime * i);
            resolve(true);
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
           
            
            this.ssocket.onResponse(data=>{
                this.wss.clients
            })
            setWsHeartbeat(wss, (ws, data, binary) => {
                console.log('WS HEART BEAT');

                if (data === '{"command":"ping"}') { // send pong if recieved a ping.
                    ws.send(JSON.stringify(PrintSucceeded('pong', { command: 'ping',production:this.production }, EMessage.succeeded)));
                }
            }, 15000);

            wss.on('connection', (ws: WebSocket) => {
                console.log('WS VMC');
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
    close(){
        this.wss.close();
        this.ssocket.server.close();
        this.ssocket.sclients.forEach(v => {
            v.destroy();
          });
    }
}


