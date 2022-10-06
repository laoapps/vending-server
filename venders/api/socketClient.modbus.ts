import net from 'net';
import { EM102_COMMAND, EMACHINE_COMMAND, EMODBUS_COMMAND, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js'
import { VendingModBus } from './vendingmodbus';
export class SocketModBusClient {
    //---------------------client----------------------

    // creating a custom socket client and connecting it....
    client = new net.Socket();
    port = 22222;
    host = 'laoapps.com';
    machineid = '123456';
    otp = '111111';
    token = '';
    t: any;
    m: VendingModBus;
    constructor() {
        this.m = new VendingModBus(this);
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

        this.client.on('data', async (data)=> {
            console.log('Data from server:' + data);
            const d = JSON.parse(data.toString()) as IResModel;

            if (d.command == 'ping') {
                that.send([],d.command as any);
            } 
             else  {
                const param = d.data;
              const c = await that.m.command(d.command as any, param)
                this.send(c,d.command as any);
            }
            console.log(d.command, d);

        });
        this.client.on('error', function (data) {
            console.log('Data from server:' + data);
            that.client.end(()=>{
                setTimeout(() => {
                    that.init();
                }, 1000);
                
            });
           
        });
        this.client.on('end', function (data) {
            console.log('Data from server:' + data);
            setTimeout(() => {
                that.init();
            }, 1000);
        });

        this.t = setInterval(function () {
            // this.client.end('Bye bye server');
            const req = {} as IReqModel;
            req.token = that.token;
            req.time = new Date().getTime() + '';
            that.client.write(JSON.stringify(req));
        }, 10000 );
    }
    send(data: any, command=EM102_COMMAND.status) {
        const req = {} as IReqModel;
        req.command = command;
        req.time = new Date().toString();
        req.token = this.token;
        req.data = data;
        this.client.write(JSON.stringify(req));
    }
    close() {
        this.close();
        this.m.close();
    }

}