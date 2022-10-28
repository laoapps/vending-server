import * as net from 'net';
import { EM102_COMMAND, EMACHINE_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js'
import { KiosESSP } from './kios.essp';
export class SocketKiosClient {
    //---------------------client----------------------

    // creating a custom socket client and connecting it....
    client = new net.Socket();
    port = 31225;
    host = 'localhost';
    machineId = '88888888';
    otp = '111111';
    token = '';
    t:any;
    m: KiosESSP;
    constructor() {
        this.m = new KiosESSP(this);
        this.init();
        this.token = cryptojs.SHA256(this.machineId + this.otp).toString(cryptojs.enc.Hex)
    }
    init() {
        const that = this;
        this.client.connect({
            port: this.port,
            host: this.host
        });
        if(this.t)this.t=null;
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
            that.send({},EMACHINE_COMMAND.login);

        });

        this.client.setEncoding('utf8');

        this.client.on('data', function (data) {
            console.log('Data from server:' + data);
            const d = JSON.parse(data.toString()) as IResModel;

            const req = {} as IReqModel;
            if (d.command == 'ping') {
                req.command = 'ping';
                req.token = that.token;
                req.time = new Date().getTime() + '';
            } else if (d.command == EMACHINE_COMMAND.start ) {
                that.m.setTransactionID(d.transactionID);
            } 
            console.log(d.command, d);

        });
        this.client.on('error', function (data) {
            console.log('Data from server:' + data);
            that.client.end();
            that.init();
        });
        this.client.on('end', function (data) {
            console.log('Data from server:' + data);
            that.init();
        });

       this.t= setInterval(function () {
            // this.client.end('Bye bye server');
            that.send(null,EMACHINE_COMMAND.ping)
        }, 10000);

    }
    send(data: any,command:any) {
        const req = {} as IReqModel;
        req.command = command||EMACHINE_COMMAND.status;
        req.time = new Date().toString();
        req.token = this.token;
        req.data = data;
        this.client.write(JSON.stringify(req)+'\n');
    }

}