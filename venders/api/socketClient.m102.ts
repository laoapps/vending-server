import net from 'net';
import { EM102_COMMAND, EMACHINE_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js'
import { VendingM102 } from './VendingM102';
export class SocketClientM102 {
    //---------------------client----------------------

    // creating a custom socket client and connecting it....
    client = new net.Socket();
    port = 31224;
    host = 'laoapps.com';
    machineid = '99999999';
    otp = '111111';
    token = '';
    t: any;
    m: VendingM102;
    constructor() {
        this.m = new VendingM102(this);
        this.init();
        this.token = cryptojs.SHA256(this.machineid + this.otp).toString(cryptojs.enc.Hex)
    }
    init() {
        const that = this;
        this.client.connect({
            port: this.port,
            host: this.host
        });
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


            // writing data to server

            that.send([], EMACHINE_COMMAND.login as any);

        });
        this.client.setEncoding('utf8');
        this.client.on('data', async (data) => {
            console.log('Data from server:' + data);
            const l=data.toString().substring(0,data.toString().length-1)
            const d = JSON.parse(l) as IResModel;

            const param = d.data;

            that.m.command(d.command as any, param,d.transactionID).then(r=>{
                console.log('DATA command completed');
                
                this.send(r,d.transactionID, d.command as any);
            }).catch(e=>{
                if(e){
                    console.log('DATA command error',e);
                
                    this.send(e,d.transactionID, d.command as any);
                }
                
            })
        });
        this.client.on('error', function (data) {
            console.log('on error:' + data);
            // 

        });

        // this.client.on('end', function (data) {
        //     console.log('Data from server:' + data);
        //     setTimeout(() => {
        //         that.init();
        //     }, 3000);
        // });
        this.client.on('close', function (data) {
            console.log('on close:' + data);
            setTimeout(() => {
                that.client.destroy();
                that.client = new net.Socket();
                that.init();
            }, 3000);
        });

        this.t = setInterval(function () {
            // this.client.end('Bye bye server');
            const req = {} as IReqModel;
            req.token = that.token;
            req.time = new Date().getTime() + '';
            req.command = EM102_COMMAND.ping;
            that.client.write(JSON.stringify(req));
        }, 5000);
    }
    send(data: any,transactionID:number, command = EMACHINE_COMMAND.status) {
        const req = {} as IReqModel;
        req.command = command;
        req.time = new Date().toString();
        req.token = this.token;
        req.data = data;
        req.transactionID =transactionID;
        this.client.write(JSON.stringify(req));
    }
    close() {
        this.client.end();
        this.m.close();
    }

}