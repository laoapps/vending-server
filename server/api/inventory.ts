import axios from 'axios';
import express, { Router } from 'express';
import * as WebSocketServer from 'ws';
import { randomUUID } from 'crypto';
import net from 'net';
import { broadCast, initWs, PrintError, PrintSucceeded } from '../services/service';
import { EMessage, IMachineClientID, IMachineID, IResModel, IStock, IVendingMachineBill, IVendingMachineSale } from '../entities/syste.model';
import { chineseteacan, imagecokecan, imagpepsican, oishitea, tigerheadwater } from '../services/demo';
import { SocketServer } from '../services/socketServer';

export class InventoryServer {
    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket: SocketServer = {} as SocketServer;

    stock = new Array<IStock>();
    vendingOnSale = new Array<IVendingMachineSale>();
    vendingBill = new Array<IVendingMachineBill>();

    clients = new Array<IMachineID>();


    constructor(router: Router, wss: WebSocketServer.Server, socket: SocketServer) {
        this.ssocket = socket;
        initWs(wss);
        this.wss = wss;

        router.post('/', async (req, res) => {
            const { limit, skip, data, command } = req.body;
            try {
                const clientId = data.clientId;
                let loggedin = false;
                this.wss.clients.forEach(v => {
                    loggedin = v['clientId'] == clientId;
                })


                if (!loggedin) throw new Error(EMessage.notloggedinyet);
                if(command =='confirm'){
                    this.callBackConfirm(data.uuid,data.ids,data.value,data.machineId,data.ref,data.others).then(r=>{
                        res.send(PrintSucceeded(command, {uuid: data.uuid,ids:data.ids,value:data.value,machineId:data.machineId,ref:data.ref,others:data.others}, EMessage.succeeded));
                    }).catch(e=>{
                        res.send(PrintError(command, e, EMessage.error));
                    })
                }
                else if (command == 'list') {
                    res.send(PrintSucceeded(command, this.vendingOnSale, EMessage.succeeded));
                } else if (command == 'buyMMoney') {
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
                        vendingsales:ids.map(v=>{
                            const stock =this.vendingOnSale.find(x=>x.id+''==v)?.stock|| {} as IStock;
                            const position =this.vendingOnSale.find(x=>ids.includes(x.id+''))?.position||{}as -1;
                            return {stock,position} as IVendingMachineSale;
                        })
                    });
                    res.send(PrintSucceeded(command, { qr, ids, value, uuid }, EMessage.succeeded));
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

        router.post('/init', async (req, res) => {
            this.stock = [];
            this.vendingOnSale = [];
            try {
                this.stock.push(...[{
                    id: 0,
                    name: 'Coke can 330ml',
                    image: imagecokecan
                    ,
                    price: 9000,
                    qtty: 1000,
                    hashP: '',
                    hashM: ''
                }, {
                    id: 1,
                    name: 'Pepsi can 330ml',
                    image: imagpepsican
                    ,
                    price: 9000,
                    qtty: 1000,
                    hashP: '',
                    hashM: ''

                }, {
                    id: 2,
                    name: 'Oishi green tea 450ml',
                    image: oishitea
                    ,
                    price: 12000,
                    qtty: 1000,
                    hashP: '',
                    hashM: ''
                }
                    , {
                    id: 3,
                    name: 'Chinese tea 330ml',
                    image: chineseteacan,
                    price: 8000,
                    qtty: 100,
                    hashP: '',
                    hashM: ''

                }
                    , {
                    id: 4,
                    name: 'Water tiger head 380ml',
                    image: tigerheadwater,
                    price: 9000,
                    qtty: 100,
                    hashP: '',
                    hashM: ''
                }]
                )
                new Array(60).fill(0).forEach((v, i) => {
                    const c = Math.floor(Math.random() * this.stock.length);
                    this.vendingOnSale.push({
                        stock: this.stock[c], position: i,
                        hashP: '',
                        hashM: ''
                    })
                })

                res.send(PrintSucceeded('init', this.vendingOnSale, EMessage.succeeded));
            } catch (error) {
                console.log(error);
                res.send(PrintError('init', error, EMessage.error));
            }
        });





    }


    generateBillMMoney(ids: Array<string>, value: number, machineId: string) {
        return new Promise<any>((resolve, reject) => {
            const uuid = randomUUID();
            // generate QR from MMoney
            axios.post('https://', { ids, value, machineId }).then(r => {
                console.log(r);
                resolve({ uuid, qr: r.data.qr, machineId });
            }).catch(e => {
                reject(e)
            })
        })
    }
    callBackConfirm(uuid:string,ids: Array<string>, value: number, machineId: string,ref:string, others: any) {
        return new Promise<any>((resolve, reject) => {
            try {
                const c = this.checkMachineId(machineId);
                if (!c) throw new Error(EMessage.MachineIdNotFound);
                this.ssocket.processOrder(machineId, ids);
                // this.wss.
                const x = this.vendingBill.find(v=>{
                    v.uuid==uuid
                });
                if(!x)throw new Error(EMessage.billnotfound)
                x.paymentstatus='paid';
                x.paymentref = ref;
                x.paymenttime = new Date();
                
                const y = this.vendingBill.find(v=>v.uuid==uuid);
                this.wss.clients.forEach(v=>{
                    const x = v['clientId'] as string;
                    if (x) {
                         if(x == y?.clientId){
                            const res = {} as IResModel;
                            res.command ='confirm';
                            res.message = EMessage.confirmsucceeded;
                            res.status=1;
                            res.data=y;
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
        const x = this.ssocket.clients.find(v => {
            const x = v['clientId'] as IMachineClientID;
            if (x) {
                return x.machineId == machineId;
            }
            return false;
        });
        if (x) x['clientId'] as IMachineClientID;
        return null;

    }


}


