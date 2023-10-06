import * as net from 'net';
import { EM102_COMMAND, EMACHINE_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js'

import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// import helmet from 'helmet';
import express, { Router } from 'express';
import axios from 'axios';
import tls from 'tls';
export class SocketClientMe {
    //---------------------client----------------------

    // creating a custom socket client and connecting it....
    client: tls.TLSSocket | undefined = undefined;
    // port = 51223;// new server
    port = 51223
    host = 'laoapps.com';
    machineid = process.env.machineId || '11111111';
    otp = '111111';
    token = '';
    t: any;

    maxRetryReboot = 5 * 60 * 1000;/// 5 minutes
    constructor() {
        this.init();
        this.initWebServer();
        this.token = cryptojs.SHA256(this.machineid + this.otp).toString(cryptojs.enc.Hex)
    }
    processorder(transactionID: number) {
        return axios.post('https://endingservicezdm8.laoapps.com/zdm8', { data: { transactionID, token: cryptojs.SHA256(this.machineid + this.otp).toString(cryptojs.enc.Hex) }, command: 'processorder' });
    }
    initWebServer() {
        const app = express();
        const router = express.Router();
        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 5000 }));
        app.use(cors());
        app.use(cookieParser());
        app.disable('x-powered-by');
        // app.use(helmet.hidePoweredBy());

        app.post('/', (req, res) => {
            const d = req.body as IResModel;
            try {
                console.log('HTTP REQUEST BODY', d);

                // { slot: position };
                const command = d.command;
                const param = d.data;
                if (command == 'test') {


                }
                else if (command == 'process') {

                    this.processorder(d.transactionID).then(r => {
                        if (r.data.transactionID == d.transactionID) {

                            console.log('DATA response', d.command, d);
                            res.send({ status: 1, message: 'transactionID OK' });
                        } else {
                            res.send({ status: 0, message: 'transactionID not found' });
                        }

                    })

                }
                else if (command == 'enable') {
                    res.send({ status: 0, message: 'machine status' });
                }
                else if (command == 'temp') {
                }
                else if (command == 'machinestatus') {
                }
                //19006
                else if (command == 'setting') {
                }

                else {
                    res.send({ status: 0, message: 'command not found' });
                }
            } catch (error) {
                console.log('web service error', error);

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
                key: process.env.clientkey,
                cert: process.env.clientcert,
                ca: process.env.ca
            }
        );
        if (this.t) {
            clearInterval(this.t);
            this.t = null;
        }
        this.client.on('secureConnect', function () {
            // console.log('Client: connection established with server');

            // console.log('---------client details -----------------');
            // var address =this. client.address();
            // var port = address.port;
            // var family = address.family;
            // var ipaddr = address.address;
            // console.log('Client is listening at port' + port);
            // console.log('Client ip :' + ipaddr);

            // console.log('Client is IP4/IP6 : ' + family);


            // writing data to server
            if (that.client?.authorized) {
                console.log("Connection authorized by a Certificate Authority.");
                // writing data to server
                that.send({}, -11, EMACHINE_COMMAND.login);
            } else {
                console.log("Connection not authorized: " + that.client?.authorizationError)
            }
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



            console.log('DATA response', d.command, d);
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
            that.send({}, -13, EMACHINE_COMMAND.ping)
        }, 5000);
    }
    send(data: any, transactionID: number, command = EMACHINE_COMMAND.status) {
        try {
            const req = {} as IReqModel;
            req.command = command;
            req.time = new Date().toString();
            req.token = this.token;
            req.data = data;
            req.transactionID = transactionID
            this.client?.write(JSON.stringify(req) + '\n', e => {
                if (e)
                    console.log('SEND error on send', e);
            });
        } catch (error) {
            console.log('send error', error);

        }

    }
    close() {
        this.client?.end();
    }

}