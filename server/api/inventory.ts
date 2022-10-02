import axios from 'axios';
import express, { Router } from 'express';
import * as WebSocketServer from 'ws';
import { randomUUID } from 'crypto';
import net from 'net';
import { broadCast, initWs, PrintError, PrintSucceeded } from '../services/service';
import { EMessage, IMachineClient, IStock, IVendingMachineBill, IVendingMachineSale } from '../entities/syste.model';
import { chineseteacan, imagecokecan, imagpepsican, oishitea, tigerheadwater } from '../services/demo';
import { SocketServer } from '../services/socketServer';

export class InventoryServer {
    // websocket server for vending controller only
    wss: WebSocketServer.Server;
    // socket server for vending controller only
    ssocket:SocketServer ={} as SocketServer;

    stock = new Array<IStock>();
    vendingOnSale = new Array<IVendingMachineSale>();
    vendingBill = new Array<IVendingMachineBill>();

    clients = new Array<IMachineClient>();
    tokens = new Array<string>();

    constructor(router: Router, wss: WebSocketServer.Server,socket:SocketServer) {
        this.ssocket=socket;
        initWs(wss);
        this.wss = wss;
        
        router.post('/', async (req, res) => {
            const { limit, skip, data, command,token } = req.body;
            try {
                if(command=='login'){ // using login token
                    //
                    this.tokens.push()
                }
                else if (command == 'list') {

                    res.send(PrintSucceeded(command, this.vendingOnSale, EMessage.succeeded));
                } else if (command == 'buy') {

                    const ids = data.ids as Array<string>;
                    const value = this.vendingOnSale.filter(v => ids.includes(v.stock.id + '')).reduce((a, b) => {
                        return a + b.stock.price;
                    }, 0);
                    const { uuid, qr } = await this.generateBill(ids, value);
                    this.vendingBill.push({ ids, value, qr, uuid });
                    res.send(PrintSucceeded(command, { qr, ids, value, uuid }, EMessage.succeeded));
                } else {
                    res.send(PrintSucceeded(command, [], EMessage.succeeded));
                }
            } catch (error) {
                console.log(error);
                res.send(PrintError(command, error, EMessage.error));
            }
        });
        router.post('/confirm', async (req, res) => {
            try {
                const { uuid, value, ids } = req.body;
                broadCast(this.wss,'confirm',{uuid,value,ids})
            } catch (error) {
                console.log(error);
                res.send(PrintError('confirm', error, EMessage.error));
            }
        })


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
                    hashP:'',
                    hashM:''
                }, {
                    id: 1,
                    name: 'Pepsi can 330ml',
                    image: imagpepsican
                    ,
                    price: 9000,
                    qtty: 1000,
                    hashP:'',
                    hashM:''

                }, {
                    id: 2,
                    name: 'Oishi green tea 450ml',
                    image: oishitea
                    ,
                    price: 12000,
                    qtty: 1000,
                    hashP:'',
                    hashM:''
                }
                    , {
                    id: 3,
                    name: 'Chinese tea 330ml',
                    image: chineseteacan,
                    price: 8000,
                    qtty: 100,
                    hashP:'',
                    hashM:''

                }
                    , {
                    id: 4,
                    name: 'Water tiger head 380ml',
                    image: tigerheadwater,
                    price: 9000,
                    qtty: 100,
                    hashP:'',
                    hashM:''
                }]
                )
                new Array(60).fill(0).forEach((v, i) => {
                    const c = Math.floor(Math.random() * this.stock.length);
                    this.vendingOnSale.push({ stock: this.stock[c], position: i ,
                        hashP:'',
                        hashM:''})
                })

                res.send(PrintSucceeded('init', this.vendingOnSale, EMessage.succeeded));
            } catch (error) {
                console.log(error);
                res.send(PrintError('init', error, EMessage.error));
            }
        });





    }


    process() {

    }
    generateBill(ids: Array<string>, value: number) {
        return new Promise<any>((resolve, reject) => {
            const uuid = randomUUID();
            // generate QR from MMoney
            axios.post('https://', { ids, value }).then(r => {
                console.log(r);
                resolve({ uuid, qr: r.data.qr });
            }).catch(e => {
                reject(e)
            })
        })

    }
    getClientIDFromToken(token:string){
        return new Promise<any>((resolve,reject)=>{
            axios.post('http://',{token}).then(r=>{
                resolve(token);
            }).catch(e=>{
                reject(e)
            })
        })
    }
    checkToken(){
        
    }


}


