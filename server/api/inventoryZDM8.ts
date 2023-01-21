import axios from 'axios';
import { NextFunction, Request, Response, Router } from 'express';
import * as WebSocketServer from 'ws';
import { randomUUID } from 'crypto';

import { broadCast, findRealDB, PrintError, PrintSucceeded } from '../services/service';
import { EClientCommand, EZDM8_COMMAND, EMACHINE_COMMAND, EMessage, IMachineID, IMMoneyQRRes, IReqModel, IResModel, IStock, IVendingMachineBill, IVendingMachineSale, IMMoneyLogInRes, IMMoneyGenerateQR, IMMoneyGenerateQRRes, IMMoneyConfirm, IBillProcess, IBaseClass, EEntity, IMachineClientID } from '../entities/system.model';
import moment from 'moment';
import { v4 as uuid4 } from 'uuid';
import { setWsHeartbeat } from 'ws-heartbeat/server';
import { SocketServerZDM8 } from './socketServerZDM8';
import { MachineIDFactory } from '../entities/machineid.entity';
import { dbConnection, stockEntity } from '../entities';
import { MachineClientIDFactory } from '../entities/machineclientid.entity';
import { StockFactory } from '../entities/stock.entity';
import { VendingMachineSaleFactory } from '../entities/vendingmachinesale.entity';
export class InventoryZDM8 implements IBaseClass {
    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket: SocketServerZDM8 = {} as SocketServerZDM8;

    stock = new Array<IStock>();
    vendingOnSale = new Array<IVendingMachineSale>();
    vendingBill = new Array<IVendingMachineBill>();
    vendingBillPaid = new Array<IVendingMachineBill>();
    // clients = new Array<IMachineID>();

    delayTime = 3000;
    path = '/zdm8';
    production = true;
    disabled = false; //
    public phonenumber = this.production ? '2058623333' : '2054445447'; //LTC. 2058623333 //2052899515
    public walletId = this.production ? '2599087166' : '2843759248';// LTC
    mmoneyusername = 'dbk';
    mmoneypassword = 'dbk@2022';


    machineClientlist = MachineClientIDFactory(EEntity.machineclientid, dbConnection);

    checkDisabled(req, res, next) {
        if (this.disabled) {
            return res.send(PrintError('Disabled', [], EMessage.error));
        } else next();
    }

    constructor(router: Router, wss: WebSocketServer.Server) {
        this.machineClientlist.sync();
        this.ssocket = new SocketServerZDM8();

        this.wss = wss;
        this.initWs(wss);
        try {
            // load machine Id
            this.ssocket.initMachineId([]);
            // load production for each machine id
            this.init();
            router.get(this.path + '/', async (req, res) => {
                console.log('TEST IS WORKING');
                res.send({ data: 'test is working' })
            });
            router.post(this.path + '/', async (req, res) => {
                const d = req.body as IReqModel;
                try {
                    console.log('POST Data', d);

                    if (d.command == EClientCommand.confirmMMoney) {
                        console.log('CB COMFIRM', d);
                        const c = d.data as IMMoneyConfirm;
                        // c.wallet_ids
                        this.callBackConfirm(c.tranid_client, Number(c.amount)).then(r => {
                            res.send(PrintSucceeded(d.command, { bill: r, transactionID: c.tranid_client }, EMessage.succeeded));
                        }).catch(e => {
                            console.log('error confirmMMoney');
                            res.send(PrintError(d.command, e, EMessage.error));
                        })
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
                    else {
                        const clientId = d.data.clientId;
                        let loggedin = false;
                        // console.log(' WS client length', this.wss.clients);

                        this.wss.clients.forEach(v => {
                            console.log('WS CLIENT ID', v['clientId'], '==>' + clientId);

                            if (v['clientId'] == clientId)
                                loggedin = true;
                        })
                        // if(this.disabled) throw new Error(EMessage.Disabled);
                        // else
                        if (!loggedin) throw new Error(EMessage.notloggedinyet);
                        else if (d.command == EClientCommand.list) {
                            return res.send(PrintSucceeded(d.command, this.vendingOnSale, EMessage.succeeded));
                        } else if (d.command == EClientCommand.buyMMoney) {
                            const sale = d.data.ids as Array<IVendingMachineSale>; // item id
                            const machineId = this.ssocket.findMachineIdToken(d.token);
                            // const position = d.data.position;
                            if (!machineId) throw new Error('Invalid token');
                            if (!Array.isArray(sale)) throw new Error('Invalid array id');
                            // console.log('this.vendingOnSale', this.vendingOnSale);
                            const checkIds = Array<IVendingMachineSale>();
                            sale.forEach(v => {
                                // v.stock.qtty=1;
                                // const x = this.vendingOnSale.find(vx => {
                                //     if (
                                //         // !checkIds.length &&
                                //         vx.stock.id + '' == v.stock.id + '' &&
                                //         vx.position == v.position
                                //         // && vx.stock.qtty >= v.stock.qtty // base on machine stock
                                //         // && vx.stock.qtty > 0
                                //     ) {
                                //         return true;
                                //     }
                                //     // else if (vx.stock.qtty > 0
                                //     //     && vx.stock.id + '' == v.stock.id + ''
                                //     //     && vx.position == v.position
                                //     //     // && vx.stock.qtty >= v.stock.qtty // base on machine stock
                                //     //     // && vx.stock.qtty > 0
                                //     //     // && checkIds.filter(vy => vy.stock.id + '' == v.stock.id + '').reduce((a, b) => {
                                //     //     //     return a + b.stock.qtty;
                                //     //     // }, 0) <= vx.stock.qtty
                                //     //     ) {
                                //     //     return true;
                                //     // }
                                //     return false;
                                // });
                                // if (x) {
                                v.stock.qtty = 1;
                                const y = JSON.parse(JSON.stringify(v)) as IVendingMachineSale;
                                y.stock.qtty = 1;
                                checkIds.push(y);
                                // }

                                // return false;
                            })

                            // console.log('checkIds', checkIds, 'ids', sale);

                            // if (checkIds.length < sale.length) throw new Error('some array id not exist or wrong qtty');

                            const value = checkIds.reduce((a, b) => {
                                return a + (b.stock.price * b.stock.qtty);
                            }, 0);
                            // console.log('qtty', checkIds);
                            // console.log('ids', sale.length);

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

                            res.send(PrintSucceeded(d.command, bill, EMessage.succeeded));
                        } else {
                            res.send(PrintError(d.command, [], EMessage.notsupport));
                        }
                    }


                } catch (error: any) {
                    console.log(error);
                    res.send(PrintError(d.command, error, error.message));
                }
            });



            /// 0. init for demo 

            router.get(this.path + '/init', async (req, res) => {
                try {
                    const machineId = req.query['machineId'];
                    if (!this.ssocket.findOnlneMachine(machineId + '') && this.production) throw new Error(EMessage.MachineIsNotOnline);
                    this.initDemo(machineId + '');

                    res.send(PrintSucceeded('init', this.vendingOnSale, EMessage.succeeded));
                } catch (error: any) {
                    console.log(error);
                    res.send(PrintError('init', error, error.message));
                }
            });
            router.get(this.path + '/refresh', async (req, res) => {
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
            router.get(this.path + '/getPaidBills', async (req, res) => {
                try {
                    res.send(PrintSucceeded('init', this.vendingBillPaid, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });
            router.get(this.path + '/getBills', async (req, res) => {
                try {
                    res.send(PrintSucceeded('init', this.vendingBill, EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });
            router.get(this.path + '/getOnlineMachines', async (req, res) => {
                try {
                    console.log(' WS getOnlineMachines');
                    res.send(PrintSucceeded('init', this.ssocket.listOnlineMachine(), EMessage.succeeded));
                } catch (error) {
                    console.log(error);
                    res.send(PrintError('init', error, EMessage.error));
                }
            });


            // router.get(this.path + '/submit_command', async (req, res) => {
            //     try {
            //         const machineId = req.query['machineId'] + '';
            //         const position = Number(req.query['position']) ? Number(req.query['position']) : 0;
            //         console.log(' WS submit command', machineId, position);

            //         res.send(PrintSucceeded('submit command', this.ssocket.processOrder(machineId, position, new Date().getTime()), EMessage.succeeded));
            //     } catch (error) {
            //         console.log(error);
            //         res.send(PrintError('init', error, EMessage.error));
            //     }
            // });


            router.post(this.path + '/getFreeProduct',
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        // return res.send(PrintError('getFreeProduct', [], EMessage.error));


                        const { token, data: { id, position, clientId } } = req.body;
                        const machineId = this.ssocket.findMachineIdToken(token);
                        const s = this.stock.find(v => v.id == id);
                        console.log('s', s);
                        console.log('token', token, 'data,data');

                        if (s?.price !== 0) throw new Error(EMessage.getFreeProductFailed);
                        const m = this.vendingOnSale.find(v => v.machineId == machineId?.machineId && v.stock.id == s?.id);
                        if (!m) throw new Error(EMessage.freeProductNotFoundInThisMachine);
                        const x = this.ssocket.processOrder(machineId?.machineId + '', position, new Date().getTime());

                        console.log(' WS submit command', machineId, position, x);

                        res.send(PrintSucceeded('submit command', x, EMessage.succeeded));
                    } catch (error) {
                        console.log(error);
                        res.send(PrintError('getFreeProduct', error, EMessage.error));
                    }
                });

            router.post(this.path + '/addProduct',
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        try {
                            const ownerUuid = res.locals['ownerUuid'];
                            const sEnt = StockFactory(EEntity.product + '_' + ownerUuid, dbConnection);
                            await sEnt.sync()
                            const o = req.body as IStock;
                            if (!o.name || !o.price) return res.send(PrintError('addProduct', [], EMessage.bodyIsEmpty));
                            sEnt.create(o).then(r => {
                                res.send(PrintSucceeded('addProduct', r, EMessage.succeeded));
                            }).catch(e => {
                                res.send(PrintError('addProduct', e, EMessage.error));
                            })
                        }
                        catch (error) {
                            console.log(error);
                            res.send(PrintError('addProduct', error, EMessage.error));
                        }
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('addProduct', error, EMessage.error));
                    }
                });
            router.post(this.path + '/disableProduct',
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid'];
                        const id = Number(req.query['id']);
                        const isActive =req.query['isActive']==''?null:Boolean(req.query['isActive']);
                        const sEnt = StockFactory(EEntity.product + '_' + ownerUuid, dbConnection);
                        await sEnt.sync()
                        sEnt.findByPk(id).then(async r => {
                            if (!r) return res.send(PrintError('disableProduct', [], EMessage.error));
                            if(isActive!=null)
                            r.isActive = isActive;
                            res.send(PrintSucceeded('disableProduct', await r.save(), EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('disableProduct', e, EMessage.error));
                        })
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('disableProduct', error, EMessage.error));
                    }
                });
            router.post(this.path + '/listProduct',
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid'];
                        const sEnt = StockFactory(EEntity.product + '_' + ownerUuid, dbConnection);
                        await sEnt.sync();
                        sEnt.findAll().then(r => {
                            res.send(PrintSucceeded('listProduct', r, EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('listProduct', e, EMessage.error));
                        })
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('listProduct', error, EMessage.error));
                    }
                });

            router.post(this.path + '/addSale',
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    const ownerUuid = res.locals['ownerUuid'];
                    const o = req.body as IVendingMachineSale;
                    const sEnt = VendingMachineSaleFactory(EEntity.vendingmachinesale + '_' + ownerUuid, dbConnection);
                    await sEnt.sync()
                    this.machineClientlist.findOne({ where: { machineId: o.machineId } }).then(r => {
                        if (!r) return res.send(PrintError('addSale', [], EMessage.notfound));
                        if (!o.machineId || Number(o.position) == Number.NaN) return res.send(PrintError('addSale', [], EMessage.bodyIsEmpty));
                        const pEnt = StockFactory(EEntity.product + '_' + ownerUuid, dbConnection);
                        pEnt.findByPk(o.id).then(p => {
                            if (!p) return res.send(PrintError('addSale', [], EMessage.productNotFound));
                            o.stock = p;
                            sEnt.findOne({ where: { position: o.position } }).then(rx => {
                                if (rx) return res.send(PrintError('addSale', [], EMessage.duplicatedPosition));
                                sEnt.create(o).then(r => {
                                    res.send(PrintSucceeded('addSale', r, EMessage.succeeded));
                                }).catch(e => {
                                    console.log(e);
                                    res.send(PrintError('addSale', e, EMessage.error));
                                })
                            }).catch(e => {
                                console.log(e);

                                res.send(PrintError('addSale', e, EMessage.error));
                            })

                        })

                    })


                });
            router.post(this.path + '/updateSale',
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid'];
                        const o = req.body as IVendingMachineSale;
                        const sEnt = VendingMachineSaleFactory(EEntity.vendingmachinesale + '_' + ownerUuid, dbConnection);
                        await sEnt.sync();

                        sEnt.findByPk(o.id).then(async r => {
                            if (!r) return res.send(PrintError('updateSale', [], EMessage.notfound));
                            const pEnt = StockFactory(EEntity.product + '_' + ownerUuid, dbConnection);
                            pEnt.findByPk(o.id).then(async p => {
                                if (!p) return res.send(PrintError('updateSale', [], EMessage.productNotFound));
                                r.stock = p;
                                r.changed('stock', true);
                                res.send(PrintSucceeded('updateSale', await r.save(), EMessage.succeeded));
                            }).catch(e => {
                                console.log(e);
                                res.send(PrintError('updateSale', e, EMessage.error));
                            });

                        }).catch(e => {
                            res.send(PrintError('updateSale', e, EMessage.error));
                        })

                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('updateSale', error, EMessage.error));
                    }
                });


            router.post(this.path + '/listSale',
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid'];
                        const sEnt = VendingMachineSaleFactory(EEntity.vendingmachinesale + '_' + ownerUuid, dbConnection);
                        await sEnt.sync()
                        sEnt.findAll().then(r => {
                            res.send(PrintSucceeded('listSale', r, EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('listSale', e, EMessage.error));
                        })
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('listSale', error, EMessage.error));
                    }
                });
            router.post(this.path + '/listSaleByMachine',
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid'];
                        const machineId = req.query['machineId'] + '';
                        const sEnt = VendingMachineSaleFactory(EEntity.vendingmachinesale + '_' + ownerUuid, dbConnection);
                        await sEnt.sync()
                        sEnt.findAll({ where: { machineId } }).then(r => {
                            res.send(PrintSucceeded('listSale', r, EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('listSale', e, EMessage.error));
                        })
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('listSale', error, EMessage.error));
                    }
                });
            router.post(this.path + '/reportStock',
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('reportStock', error, EMessage.error));
                    }
                });


            router.post(this.path + '/addMachine',
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid'];
                        const o = req.body as IMachineClientID;
                        if (!o.otp || !o.machineId) return res.send(PrintError('addMachine', [], EMessage.bodyIsEmpty));

                        // r.changed('isActive',true);
                        res.send(PrintSucceeded('addMachine', await this.machineClientlist.create(), EMessage.succeeded));

                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('addProduct', error, EMessage.error));
                    }
                });
            router.post(this.path + '/updateMachine',
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid'];
                        const id = req.query['id'] + '';
                        const o = req.body as IMachineClientID;
                        this.machineClientlist.findOne({ where: { ownerUuid, id } }).then(async r => {
                            if (!r) return res.send(PrintError('disableMachine', [], EMessage.notfound));
                            r.otp = o.otp ? o.otp : r.otp;
                            // r.machineId = o.machineId ? o.machineId : r.machineId;
                            r.photo = o.photo ? o.photo : r.photo;
                            // r.changed('isActive',true);
                            res.send(PrintSucceeded('disableMachine', await r?.save(), EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('disableMachine', e, EMessage.error));
                        })
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('updateMachine', error, EMessage.error));
                    }
                });
            router.post(this.path + '/disableMachine',
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid'];
                        const isActive = Boolean(req.query['isActive']);
                        const id = req.query['id'] + '';
                        this.machineClientlist.findOne({ where: { ownerUuid, id } }).then(async r => {
                            if (!r) return res.send(PrintError('disableMachine', [], EMessage.notfound));
                            r.isActive = isActive;
                            // r.changed('isActive',true);
                            res.send(PrintSucceeded('disableMachine', await r?.save(), EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('disableMachine', e, EMessage.error));
                        })
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('disableMachine', error, EMessage.error));
                    }
                });
            router.post(this.path + '/listMachine',
                // this.checkToken.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        const ownerUuid = res.locals['ownerUuid']
                        this.machineClientlist.findAll({ where: { ownerUuid } }).then(r => {
                            res.send(PrintSucceeded('listMachine', r, EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('listMachine', e, EMessage.error));
                        })
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('listMachine', error, EMessage.error));
                    }
                });
            router.post(this.path + '/super_listMachine',
                // this.checkToken.bind(this),
                // this.isSuper.bind(this),
                // this.checkDisabled.bind(this),
                async (req, res) => {
                    try {
                        this.machineClientlist.findAll().then(r => {
                            res.send(PrintSucceeded('listMachine', r, EMessage.succeeded));
                        }).catch(e => {
                            res.send(PrintError('listMachine', e, EMessage.error));
                        })
                    }
                    catch (error) {
                        console.log(error);
                        res.send(PrintError('listMachine', error, EMessage.error));
                    }
                });


        } catch (error) {
            console.log(error);

        }
    }


    checkToken(req: Request, res: Response, next: NextFunction) {
        try {
            const o = req.body as IReqModel;
            if (!o.token) throw new Error(EMessage.tokenNotFound)
            findRealDB(o.token).then(r => {
                const ownerUuid = r;
                if (!ownerUuid) throw new Error(EMessage.notfound);
                // req['gamerUuid'] = gamerUuid;
                res.locals['ownerUuid'] = ownerUuid;
                next();
            }).catch(e => {
                console.log(e);
                res.status(400).end();
            });
        } catch (error) {
            console.log(error);

            res.status(400).end();
        }




    }
    init() {
        // load machines

        // load products from all machines
        // const stock = new Array<IStock>();

        // let x = stock.length;
        // let y = 0;
        // const exception = new Array<number>();
        // new Array(60).fill(0).forEach((v, i) => {
        //     const c = x > i ? i : (i - (x * y) - 1);
        //     !(i % x) && i >= x ? y++ : '';
        //     if (!exception.includes(i))
        //         this.vendingOnSale.push({
        //             machineId,
        //             stock: this.stock[c],
        //             position: i, // for ZDM8 only
        //             hashP: '',
        //             hashM: '',
        //             max: 5
        //         })
        // });
    }
    initDemo(machineId: string) {
        this.stock = [];
        this.vendingOnSale = [];
        try {
            this.stock.push(...[
                {
                    id: 0,
                    name: 'Coke can 330ml',
                    image: 'cokecan.jpg',
                    price: 1000,
                    qtty: 1,
                    hashP: '',
                    hashM: '',
                    isActive: true
                }, {
                    id: 1,
                    name: 'Pepsi can 330ml',
                    image: 'pepsican.jpeg'
                    ,
                    price: 1000,
                    qtty: 1,
                    hashP: '',
                    hashM: '',
                    isActive: true

                }, {
                    id: 2,
                    name: 'Oishi green tea 450ml',
                    image: 'oishiteabottle.png'
                    ,
                    price: 1000,
                    qtty: 1,
                    hashP: '',
                    hashM: '',
                    isActive: true
                }
                , {
                    id: 3,
                    name: 'Chinese tea 330ml',
                    image: 'chineseteacan.jpg',
                    price: 1000,
                    qtty: 1,
                    hashP: '',
                    hashM: '',
                    isActive: true

                }
                , {
                    id: 4,
                    name: 'Water tiger head 380ml',
                    image: 'tigerheadbottle.png',
                    price: 1000,
                    qtty: 1,
                    hashP: '',
                    hashM: '',
                    isActive: true
                },
                {
                    id: 5,
                    name: 'LTC water',
                    image: 'ltc_water.png',
                    price: 0,
                    qtty: 1,
                    hashP: '',
                    hashM: '',
                    isActive: false
                },
                {
                    id: 6,
                    name: 'LTC water (MMoney)',
                    image: 'ltc_water_m.png',
                    price: 500,
                    qtty: 1,
                    hashP: '',
                    hashM: '',
                    isActive: true
                }
            ]
            );
            let x = 7;
            let y = 0;
            const exception = new Array<number>();
            new Array(60).fill(0).forEach((v, i) => {
                const c = x > i ? i : (i - (x * y) - 1);
                !(i % x) && i >= x ? y++ : '';
                if (!exception.includes(i))
                    this.vendingOnSale.push({
                        machineId,
                        stock: this.stock[c],
                        position: i, // for ZDM8 only
                        hashP: '',
                        hashM: '',
                        max: 5
                    })
            });
        } catch (error) {
            console.log(error);
        }
    }
    confirmMMoneyOder(c: IMMoneyConfirm) {
        return new Promise<any>((resolve, reject) => {
            // c.wallet_ids
            this.callBackConfirm(c.tranid_client, Number(c.amount)).then(r => {
                return { bill: r, transactionID: c.tranid_client };
            }).catch(e => {
                console.log('error confirmMMoney');
                return e;
            })
        })

    }


    generateBillMMoney(value: number, transactionID: string) {
        return new Promise<IMMoneyGenerateQRRes>((resolve, reject) => {
            // generate QR from MMoney
            this.loginMmoney().then(r => {
                if (r) {
                    const qr = {
                        amount: value + '',
                        phonenumber: this.phonenumber,// '2055220199',
                        transactionID
                    } as IMMoneyGenerateQR;
                    console.log('QR', qr);

                    axios.post<IMMoneyGenerateQRRes>('https://qr.mmoney.la/test/generateQR',
                        qr,
                        { headers: { 'mmoney-token': this.mMoneyLoginRes.token } }).then(rx => {
                            console.log('generateBillMMoney', rx);
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
        const username = this.production ? this.mmoneyusername : 'test';
        const password = this.production ? this.mmoneypassword : '12345';
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
                // bill.vendingsales.forEach(v => {
                //     const x = this.vendingOnSale.find(vx => vx.stock.id == v.stock.id && v.position == vx.position);
                //     if (x)
                //         x.stock.qtty--;
                // });
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

            setWsHeartbeat(wss, (ws, data, binary) => {
                console.log('WS HEART BEAT');

                if (data === '{"command":"ping"}') { // send pong if recieved a ping.
                    ws.send(JSON.stringify(PrintSucceeded('pong', { command: 'ping', production: this.production }, EMessage.succeeded)));
                }
            }, 15000);

            wss.on('connection', (ws: WebSocket) => {
                console.log('WS ZDM8');
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
    close() {
        this.wss.close();
        this.ssocket.server.close();
        this.ssocket.sclients.forEach(v => {
            v.destroy();
        });
    }
}


