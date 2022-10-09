import axios from 'axios';
import express, { Router } from 'express';
import * as WebSocketServer from 'ws';
import { randomUUID } from 'crypto';
import net from 'net';
import { broadCast, PrintError, PrintSucceeded } from '../services/service';
import { EMessage } from '../entities/syste.model';
import { SocketServerM102 } from './socketServerM102';

export class KiosServer {
    wss: WebSocketServer.Server;
    ssocket:SocketServerM102 ={} as SocketServerM102;
    stock = new Array<IStock>();
    vendingOnSale = new Array<{ stock: IStock, position: number }>();
    vendingBill = new Array<{ ids: Array<string>, value: number, qr: string, uuid: string }>();
    constructor(router: Router, wss: WebSocketServer.Server,socket:SocketServerM102) {
        this.ssocket=socket;
        // initWs(wss);
        this.wss = wss;
        
        router.post('/', async (req, res) => {
            const { limit, skip, data, command,token } = req.body;
            try {
                if (command == 'list') {

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



}
export interface IStock {
    id: number;
    name: string;
    image: string;
    price: number;
    qtty: number;
}

