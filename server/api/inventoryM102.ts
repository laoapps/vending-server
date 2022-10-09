import axios from 'axios';
import express, { Router } from 'express';
import * as WebSocketServer from 'ws';
import { randomUUID } from 'crypto';
import net from 'net';
import { broadCast, PrintError, PrintSucceeded } from '../services/service';
import { EClientCommand, EM102_COMMAND, EMACHINE_COMMAND, EMessage, EZDM8_COMMAND, IMachineClientID, IMachineID, IMMoneyQRRes, IReqModel, IResModel, IStock, IVendingMachineBill, IVendingMachineSale } from '../entities/syste.model';
import { SocketServerM102 } from './socketServerM102';
import { v4 as uuid4 } from 'uuid';
import { setWsHeartbeat } from 'ws-heartbeat/server';
export class InventoryM102 {
    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket: SocketServerM102 = {} as SocketServerM102;

    stock = new Array<IStock>();
    vendingOnSale = new Array<IVendingMachineSale>();
    vendingBill = new Array<IVendingMachineBill>();
    vendingBillPaid = new Array<IVendingMachineBill>();
    clients = new Array<IMachineID>();


    constructor(router: Router, wss: WebSocketServer.Server, socket: SocketServerM102) {
        this.ssocket = socket;
        this.wss = wss;
        this.initWs(wss);


        router.post('/', async (req, res) => {
            const { limit, skip, data, command  } = req.body;
            try {
                const clientId = data.clientId;
                let loggedin = false;
                this.wss.clients.forEach(v => {
                    loggedin = v['clientId'] == clientId;
                })


                if (!loggedin) throw new Error(EMessage.notloggedinyet);
                if (command == EClientCommand.confirmMMoney) {
                    this.callBackConfirm(data.uuid, data.ids, data.value, data.machineId, data.ref, data.others).then(r => {
                        res.send(PrintSucceeded(command, { uuid: data.uuid, ids: data.ids, value: data.value, machineId: data.machineId, ref: data.ref, others: data.others }, EMessage.succeeded));
                    }).catch(e => {
                        res.send(PrintError(command, e, EMessage.error));
                    })
                }
                else if (command == EClientCommand.list) {
                    res.send(PrintSucceeded(command, this.vendingOnSale, EMessage.succeeded));
                } else if (command == EClientCommand.buyMMoney) {
                    const ids = data.ids as Array<string>; // item id
                    const machineId = data.machineId;
                    const value = this.vendingOnSale.filter(v => ids.includes(v.stock.id + '')).reduce((a, b) => {
                        return a + b.stock.price;
                    }, 0);
                    const { uuid, qr } = await this.generateBillMMoney(ids, value, machineId);

                    this.vendingBill.push({
                        uuid,
                        clientId,
                        machineId,
                        hashM: '',
                        hashP: '',
                        paymentmethod: command,
                        paymentref: '',
                        paymentstatus: 'pending',
                        paymenttime: new Date(),
                        requestpaymenttime: new Date(),
                        totalvalue: value,
                        vendingsales: ids.map(v => {
                            const stock = this.vendingOnSale.find(x => x.id + '' == v)?.stock || {} as IStock;
                            const position = this.vendingOnSale.find(x => ids.includes(x.id + ''))?.position || {} as -1;
                            return { stock, position } as IVendingMachineSale;
                        })
                    });
                    const re = { ids,qr,value,uuid } as IMMoneyQRRes;
                    res.send(PrintSucceeded(command,re, EMessage.succeeded));
                } else {
                    res.send(PrintError(command, [], EMessage.notsupport));
                }
            } catch (error) {
                console.log(error);
                res.send(PrintError(command, error, EMessage.error));
            }
        });
        // router.post('/confirm', async (req, res) => {
        //     try {
        //         const { uuid, value, ids } = req.body;
        //         broadCast(this.wss, 'confirm', { uuid, value, ids })
        //     } catch (error) {
        //         console.log(error);
        //         res.send(PrintError('confirm', error, EMessage.error));
        //     }
        // })


        /// 0. init for demo 

        router.get('/init', async (req, res) => {
            try {
                const machineId = req.query['machineId'];
                if(!this.ssocket.findOnlneMachine(machineId+'')) throw new Error(EMessage.MachineIsNotOnline)
                this.init(machineId+'');
                
                res.send(PrintSucceeded('init', this.vendingOnSale, EMessage.succeeded));
            } catch (error:any) {
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
                res.send(PrintSucceeded('init', this.ssocket.listOnlineMachine(), EMessage.succeeded));
            } catch (error) {
                console.log(error);
                res.send(PrintError('init', error, EMessage.error));
            }
        });


        router.get('/submit_command', async (req, res) => {
            try {
                const machineId = req.query['machineId']+'';
                const position = Number(req.query['position'])? Number(req.query['position']):0;
                console.log('submit command');
                
                res.send(PrintSucceeded('submit command', this.ssocket.processOrder(machineId,position), EMessage.succeeded));
            } catch (error) {
                console.log(error);
                res.send(PrintError('init', error, EMessage.error));
            }
        });
    }
    init(machineId:string) {
        this.stock = [];
        this.vendingOnSale = [];
        try {
            this.stock.push(...[{
                id: 0,
                name: 'Coke can 330ml',
                image: 'cokecan.jpg'
                ,
                price: 9000,
                qtty: 1000,
                hashP: '',
                hashM: ''
            }, {
                id: 1,
                name: 'Pepsi can 330ml',
                image: 'pepsican.jpeg'
                ,
                price: 9000,
                qtty: 1000,
                hashP: '',
                hashM: ''

            }, {
                id: 2,
                name: 'Oishi green tea 450ml',
                image: 'oishiteabottle.png'
                ,
                price: 12000,
                qtty: 1000,
                hashP: '',
                hashM: ''
            }
                , {
                id: 3,
                name: 'Chinese tea 330ml',
                image: 'chineseteacan.jpg',
                price: 8000,
                qtty: 100,
                hashP: '',
                hashM: ''

            }
                , {
                id: 4,
                name: 'Water tiger head 380ml',
                image: 'tigerheadbottle.png',
                price: 9000,
                qtty: 100,
                hashP: '',
                hashM: ''
            }]
            )
            new Array(60).fill(0).forEach((v, i) => {
                const c = Math.floor(Math.random() * this.stock.length);
                this.vendingOnSale.push({
                    machineId,
                    stock: this.stock[c],
                     position: i,
                    hashP: '',
                    hashM: ''
                })
            })
        } catch (error) {
            console.log(error);
        }
    }

    generateBillMMoney(ids: Array<string>, value: number, machineId: string) {
        return new Promise<any>((resolve, reject) => {
            const uuid = randomUUID();
            resolve({ uuid, qr: 'qr',value, machineId });
            // generate QR from MMoney
            // axios.post('https://', { ids, value, machineId }).then(r => {
            //     console.log(r);
            //     resolve({ uuid, qr: r.data.qr,value, machineId });
            // }).catch(e => {
            //     reject(e)
            // })
        })
    }
    callBackConfirm(uuid: string, ids: Array<string>, value: number, machineId: string, ref: string, others: any) {
        return new Promise<any>((resolve, reject) => {
            try {
                const c = this.checkMachineId(machineId);
                if (!c) throw new Error(EMessage.MachineIdNotFound);

                const sale = this.vendingBill.find(v => v.uuid == uuid);
                if (!sale) throw new Error(EMessage.billnotfound);
                sale.vendingsales.map(v=>v.position).forEach((p,i)=>{
                    setTimeout(() => {
                        const position =this.ssocket.processOrder(machineId,p);
                        this.wss.clients.forEach(v => {
                            const x = v['clientId'] as string;
                            if (x) {
                                if (x == sale?.clientId) {
                                    const res = {} as IResModel;
                                    res.command = EM102_COMMAND.release;
                                    res.message = EMessage.confirmsucceeded;
                                    res.status = 1;
                                    res.data = {sale,position};
                                    const i =this.vendingBill.findIndex(i => i.uuid == uuid);
                                    delete this.vendingBill[i];
                                    v.send(JSON.stringify(res));
                                }
                            }
                        })
                    }, 3000*i);
                   
                })
                // this.wss.
                sale.paymentstatus = 'paid';
                sale.paymentref = ref;
                sale.paymenttime = new Date();
                this.wss.clients.forEach(v => {
                    const x = v['clientId'] as string;
                    if (x) {
                        if (x == sale?.clientId) {
                            const res = {} as IResModel;
                            res.command = EM102_COMMAND.release;
                            res.message = EMessage.confirmsucceeded;
                            res.status = 1;
                            res.data = sale;
                            const i =this.vendingBill.findIndex(v => v.uuid == uuid);
                            this.vendingBillPaid.push(this.vendingBill.splice(i,1)[0]);
                            v.send(JSON.stringify(res));
                        }
                    }
                })
                resolve(true);
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
        setWsHeartbeat(wss, (ws, data, binary) => {
            if (data === '{"kind":"ping"}') { // send pong if recieved a ping.
                ws.send(JSON.stringify(PrintSucceeded('pong', { kind: 'ping' }, EMessage.succeeded)));
            }
        }, 15000);

        wss.on('connection', (ws: WebSocket) => {
            console.log('new connection ', ws.url);

            console.log('current connection is alive', ws['isAlive']);



            ws.onopen = (ev: Event) => {
                console.log('open', ev);
                // ws['isAlive'] = true;
                ws.onclose = (ev: CloseEvent) => {

                }
                ws.onerror = (ev: Event) => {
                    console.log('error', ev);
                }

                //connection is up, let's add a simple simple event
                ws.onmessage = async (ev: MessageEvent) => {
                    let d: IReqModel = {} as IReqModel;
                    // ws['isAlive'] = true;
                    try {
                        console.log('comming', ev.data.toString());

                        d = JSON.parse(ev.data.toString()) as IReqModel;

                        const res = {} as IResModel
                        if (d.command == EMACHINE_COMMAND.login) {
                            res.command = d.command;
                            res.message = EMessage.loginok;
                            res.status = 1;
                            if (d.data) {
                                const x = d.data as string;
                                ws['machineId'] = x;
                                console.log('online machine', this.ssocket.listOnlineMachine());

                                if (!this.ssocket.findOnlneMachine(x)) throw new Error('machine is not online');

                            } else throw new Error(EMessage.MachineIdNotFound)
                            ws['clientId'] = uuid4();
                            res.data = { machineId: d.data, clientId: ws['clientId'] };
                        }

                        ws.send(JSON.stringify(PrintSucceeded(d.command, res, EMessage.succeeded)));

                    } catch (error: any) {
                        console.log('error', error);
                        ws.send(JSON.stringify(PrintError(d.command, [], error.message)));
                    }
                }
            }

        });
    }

}


