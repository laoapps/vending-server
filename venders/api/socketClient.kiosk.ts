import * as net from 'net';
import { EM102_COMMAND, EMACHINE_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js'
import { KiosESSP } from './kios.essp';
import { KiosESSP2 } from './kios.essp2';
export class SocketKiosClient {
    //---------------------client----------------------

    // creating a custom socket client and connecting it....
    client = new net.Socket();
    port = 51224;
    host = 'laoapps.com';
    machineId = '111111111';
    otp = '111111';
    token = '';
    t: any;
    m: KiosESSP;
    constructor(serverPort=51225,port='/dev/ttyS4') {
        this.port = serverPort;
        this.m = new KiosESSP2(this,port);
        this.init();
        this.token = cryptojs.SHA256(this.machineId + this.otp).toString(cryptojs.enc.Hex)
    }
    init() {
        try {
            if (this.t) {
                clearInterval(this.t)
                this.t = null;
            }
            const that = this;
            this.client = new net.Socket();
            this.client.connect({
                port: this.port,
                host: this.host
            });

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


                // writing data to server
                that.send({}, EMACHINE_COMMAND.login);

            });

            this.client.setEncoding('utf8');

            this.client.on('data', function (data) {
                try {
                    console.log('Data from server:' + data);
                    const l = data.toString().substring(0, data.toString().length - 1)
                    const d = JSON.parse(l) as IResModel;

                    const req = {} as IReqModel;
                    if (d.command == 'ping') {
                        req.command = 'ping';
                        req.token = that.token;
                        req.time = new Date().getTime() + '';
                    } else if (d.command == EMACHINE_COMMAND.start) {
                        that.m.setTransactionID(d.transactionID);
                    }
                    else if (d.command == EMACHINE_COMMAND.stop) {
                        that.m.setTransactionID(d.transactionID, 0);
                    }
                    else if (d.command == EMACHINE_COMMAND.setcounter) {
                        that.m.setCounter(d.data.t);
                    }
                    else if (d.command == EMACHINE_COMMAND.restart) {
                        process.exit(0);
                    }
                    console.log(d.command, d);
                } catch (e) {
                    console.log(e);

                }


            });
            this.client.on('error', function (data) {
                console.log('Data from server:' + data);
                setTimeout(() => {
                    that.client.end();
                    that.client.destroy();
                    that.init();
                }, 100)
            });
            this.client.on('end', function (data) {
                console.log('Data from server:' + data);
                that.client.destroy();
                setTimeout(() => {
                    that.init();
                }, 100)
            });

            this.t = setInterval(function () {
                // this.client.end('Bye bye server');
                console.log('PING from vender');

                that.send(null, EMACHINE_COMMAND.ping)
            }, 5000);
        } catch (error) {
            console.log(error);

        }


    }
    send(data: any, command: any) {
        const req = {} as IReqModel;
        req.command = command || EMACHINE_COMMAND.status;
        req.time = new Date().toString();
        req.token = this.token;
        req.data = data;
        this.client.write(JSON.stringify(req) + '\n');
    }
    close() {
        this.client.end();
        this.m.close();
    }


}