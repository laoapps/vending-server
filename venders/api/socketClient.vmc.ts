import net from 'net';
import { EM102_COMMAND, EMACHINE_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js'
import { VendingVMC } from './vendingVMC';
export class SocketClientVMC {
    //---------------------client----------------------

    // creating a custom socket client and connecting it....
    client = new net.Socket();
    port = 2222;
    host = 'laoapps.com';
    machineid = '123456';
    otp = '111111';
    token = '';
    t:any;
    m: VendingVMC;
    constructor() {
        this.m = new VendingVMC(this);
        this.init();
        this.token = cryptojs.SHA256(this.machineid + this.otp).toString(CryptoJS.enc.Hex)
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
            that.client.write(JSON.stringify({ command: EMACHINE_COMMAND.login, token: that.token }));

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
            } else if (d.command == EZDM8_COMMAND.shippingcontrol || d.command == EM102_COMMAND.release) {

            } else if (d.command == EZDM8_COMMAND.status || d.command == EM102_COMMAND.readtemperature) {

            } else if (d.command == EZDM8_COMMAND.statusgrid || d.command == EM102_COMMAND.scan) {

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
            const req = {} as IReqModel;
            req.token = that.token;
            req.time = new Date().getTime() + '';
            that.client.write(JSON.stringify(req));
        }, 60000 * 5);

    }
   
    send(data: any,transactionID:number,command=EMACHINE_COMMAND.status) {
        const req = {} as IReqModel;
        req.command = command;
        req.time = new Date().toString();
        req.token = this.token;
        req.data = data;
        req.transactionID = transactionID;
        this.client.write(JSON.stringify(req));
    }
    close() {
        this.client.end();
        this.m.close();
    }

}
