import * as net from 'net';
import { EM102_COMMAND, EMACHINE_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js'
import { VendingVMC } from './vendingVMC';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import express, { Router } from 'express';
import axios from 'axios';
import tls from 'tls';
import fs from 'fs';
import constants from 'constants';
export class SocketClientVMC {
    //---------------------client----------------------

    // creating a custom socket client and connecting it....
    client:tls.TLSSocket|undefined=undefined;
    // options = {
    //     key: process.env.privateKeys,
    //     cert: process.env.publicKeys,
    //     rejectUnauthorized: false
    // };
    port = 51223;
    host = 'laoapps.com';
    machineid = '11111111';
    otp = '111111';
    token = '';
    t: any;
    m: VendingVMC;

    maxRetryReboot = 5 * 60 * 1000;/// 5 minutes
    constructor() {
        this.m = new VendingVMC(this);
        this.init();
        this.initWebServer();
        this.token = cryptojs.SHA256(this.machineid + this.otp).toString(cryptojs.enc.Hex)
    }
    processorder(transactionID: number) {
        return axios.post('http://laoapps.com:9006/zdm8', { data: { transactionID, token: cryptojs.SHA256(this.machineid + this.otp).toString(cryptojs.enc.Hex) }, command: 'processorder' });
    }
    initWebServer() {
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

            // { slot: position };
            const command = req.query['command'];
            const param = d.data;
            if (command == 'process') {

                this.processorder(d.transactionID).then(r => {
                    if (r.data.transactionID == d.transactionID) {
                        this.m.command(d.command as any, param, d.transactionID).then(r => {
                            console.log('DATA command completed');

                            this.send(r, d.transactionID, d.command as any,()=>{

                            });
                        }).catch(e => {
                            if (e) {
                                console.log('DATA command error', e);

                                this.send(e, d.transactionID, d.command as any);
                            }

                        })
                        console.log('DATA response', d.command, d);
                        res.send({ status: 1, message: 'transactionID OK' });
                    } else {
                        res.send({ status: 0, message: 'transactionID not found' });
                    }

                })

            }
            else if (command == 'enable') {
                this.m.setting.allowVending = Boolean(req.query['enable']) || true;
                res.send({ status: 0, message: 'machine status', data: this.m.setting });
            }
            else if (command == 'temp') {
                this.m.setting.highTemp = Number(req.query['highTemp'] + '') || 15;
                this.m.setting.lowTemp = Number(req.query['lowTemp'] + '') || 7;
                res.send({ status: 0, message: 'machine status', data: this.m.setting });
            }
            else if (command == 'machinestatus') {
                res.send({ status: 0, message: 'machine status', data: this.m.machinestatus });
            }
            //19006
            else if (command == 'setting') {
                res.send({ status: 0, message: 'machine status', data: this.m.setting });
            }

            else {
                res.send({ status: 0, message: 'command not found' });
            }



        })
        const server = http.createServer(app);
        server.listen(19006, async function () {
            console.log('HTTP listening on port ' + 19006);
        });
    }
    init() {
        const that = this;
        this.client = tls.connect(
            this.port,
            this.host,
            {
                secureOptions: constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
                maxVersion:'TLSv1.2',
                key: process.env.privateKeys,
                cert: process.env.publicKeys,
                rejectUnauthorized: false
            }
        );
        if (this.t) {
            clearInterval(this.t);
            this.t = null;
        }
        this.client.on('connect', function () {
            // console.log('Client: connection established with server');

            // console.log('---------client details -----------------');
            // var address =this. client.address();
            // var port = address.port;
            // var family = address.family;
            // var ipaddr = address.address;
            // console.log('Client is listening at port' + port);
            // console.log('Client ip :' + ipaddr);

            // console.log('Client is IP4/IP6 : ' + family);

            if (that.client?.authorized) {
                console.log("Connection authorized by a Certificate Authority.");
                } else {
                console.log("Connection not authorized: " + that.client?.authorizationError)
                }
            // writing data to server
            that.client?.write(JSON.stringify({ command: EMACHINE_COMMAND.login, token: that.token }) + '\n');

        });

        this.client.setEncoding('utf8');

        this.client.on('data', async (data) => {


            // if (d.command == 'ping') {
            //     that.send([], d.command as any);
            // }
            // else {
            //     const param = d.data;
            //     const c = await that.m.command(d.command as any, param)
            //     this.send(c, d.command as any);
            // }
            // console.log(d.command, d);
            console.log('DATA from server:' + data);
            const l = data.toString().substring(0, data.toString().length - 1)
            const d = JSON.parse(l) as IResModel;



            const param = d.data;

            that.m.command(d.command as any, param, d.transactionID).then(r => {
                // console.log('DATA command completed');
                if (d.command == 'balance') {
                    this.send(r, d.transactionID, EMACHINE_COMMAND.status);
                } else {
                    this.send(r, d.transactionID, d.command as any);
                }

            }).catch(e => {
                if (e) {
                    console.log('DATA command error', e);

                    this.send(e, d.transactionID, d.command as any);
                }

            })

            // console.log('DATA response', d.command, d);
        });
        this.client.on('error', function (e) {
            if (e)
                console.log('ERROR error:' + e);
        });
        // this.client.on('end', function (data) {
        //     console.log('Data from server:' + data);
        //     setTimeout(() => {
        //         that.init();
        //     }, 3000);
        // });
        this.client.on('close', function (data) {
            console.log('CLOSE on close:' + data);
            setTimeout(() => {
                that.client?.destroy();
                // that.client = new net.Socket();
                that.init();
            }, 3000);
        });


        this.t = setInterval(function () {
            // this.client.end('Bye bye server');
            const req = {} as IReqModel;
            req.token = that.token;
            req.time = new Date().getTime() + '';
            req.command = EMACHINE_COMMAND.ping;
            that.client?.write(JSON.stringify(req) + '\n');
        }, 5000);
    }
    sendingCount=1;
    send(data: any, transactionID: number, command = EMACHINE_COMMAND.status,cbe=()=>{}) {
        const req = {} as IReqModel;
        req.command = command;
        req.time = new Date().toString();
        req.token = this.token;
        req.data = data;
        req.transactionID = transactionID;
        
        setTimeout(() => {
            this.client?.write(JSON.stringify(req) + '\n', e => {
                if (e)
                   {
                    console.log('SEND error on send', e);
                    if(cbe)cbe();
                   } 
                else
                    this.sendingCount=1;
            });
        }, 100*this.sendingCount++);
        
    }
    close() {
        this.client?.end();
        this.m.close();
    }

}