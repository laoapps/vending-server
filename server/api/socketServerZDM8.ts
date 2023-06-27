import net from 'net';
import { EZDM8_COMMAND, EMACHINE_COMMAND, EMessage, IMachineClientID as IMachineClientID, IReqModel, IResModel, IMachineID, ERedisCommand, IBillProcess, IBillCashIn, EEntity } from '../entities/system.model';
import cryptojs from 'crypto-js';
import { readMachineSetting, redisClient, writeLogs, writeMerchantLimiterBalance, writeMachineLimiter, writeMachineSetting } from '../services/service';
import { EventEmitter } from 'events';
import { CashValidationFunc } from '../laab_service/controllers/vendingwallet_client/funcs/cashValidation.func';
import { v4 as uuid4 } from 'uuid';
import { dbConnection } from '../entities';
import { BillCashInStatic, BillCashInFactory } from '../entities/billcash.entity';
import { MachineIDStatic, MachineIDFactory } from '../entities/machineid.entity';
import { IENMessage } from '../services/laab.service';

// console.log(cryptojs.SHA256('11111111111111').toString(cryptojs.enc.Hex));
export class SocketServerZDM8 {
    server = net.createServer();
    sclients = Array<net.Socket>();
    ports = 31223;

    public machineIds = new Array<IMachineClientID>();
    eventEmitter = new EventEmitter();

    constructor(ports: number) {
        try {
            this.sclients = Array<net.Socket>();
            this.ports = this.ports || ports;
            this.machineIds = new Array<IMachineClientID>();
            //creates the server


            //emitted when server closes ...not emitted until all connections closes.
            this.server.on('close', function () {
                console.log('Server closed !');
            });

            // emitted when new client connects
            const that = this;
            this.server.on('connection', function (socket) {
                //this property shows the number of characters currently buffered to be written. (Number of characters is approximately equal to the number of bytes to be written, but the buffer may contain strings, and the strings are lazily encoded, so the exact number of bytes is not known.)
                //Users who experience large or growing bufferSize should attempt to "throttle" the data flows in their program with pause() and resume().

                console.log('Buffer size : ' + socket.bufferSize);

                console.log('---------server details -----------------');

                var address = that.server.address() as net.AddressInfo;
                var port = address?.port;
                var family = address?.family;
                var ipaddr = address?.address;
                console.log('Server is listening at port' + port);
                console.log('Server ip :' + ipaddr);
                console.log('Server is IP4/IP6 : ' + family);

                var lport = socket.localPort;
                var laddr = socket.localAddress;
                console.log('Server is listening at LOCAL port' + lport);
                console.log('Server LOCAL ip :' + laddr);

                console.log('------------remote client info --------------');

                var rport = socket.remotePort;
                var raddr = socket.remoteAddress;
                var rfamily = socket.remoteFamily;

                console.log('REMOTE Socket is listening at port' + rport);
                console.log('REMOTE Socket ip :' + raddr);
                console.log('REMOTE Socket is IP4/IP6 : ' + rfamily);

                console.log('--------------------------------------------')
                //var no_of_connections =  server.getConnections(); // sychronous version
                that.server.getConnections(function (error, count) {
                    console.log('Number of concurrent connections to the server : ' + count);
                });

                socket.setEncoding('utf8');
                socket.setKeepAlive(true);
                socket.setTimeout(30000, function () {
                    // called after timeout -> same as socket.on('timeout')
                    // it just tells that soket timed out => its ur job to end or destroy the socket.
                    // socket.end() vs socket.destroy() => end allows us to send final data and allows some i/o activity to finish before destroying the socket
                    // whereas destroy kills the socket immediately irrespective of whether any i/o operation is goin on or not...force destry takes place
                    console.log('Socket timed out');
                    socket.end();
                });


                socket.on('data', function (data) {
                    try {
                        var bread = socket.bytesRead;
                        var bwrite = socket.bytesWritten;
                        console.log('DATA Bytes read : ' + bread);
                        console.log('DATA Bytes written : ' + bwrite);
                        // console.log('Data sent to server : ' + data);
                        console.log('DATA  sent to server : ' + data.toString());
                        const l = data.toString().substring(0, data.toString().length - 1)
                        const d = JSON.parse(l) as IReqModel;

                        console.log('DATA  total connection', that.sclients.length);
                        if (d.command == EMACHINE_COMMAND.login) {
                            const token = d.token;
                            const x = that.findMachineIdToken(token);
                            if (x) {
                                console.log('DATA found machine id',x);
                                socket['machineId'] = x;
                                const mx = that.sclients.filter(v => {
                                    const m = v['machineId'] as IMachineClientID;
                                    if (m) {
                                        if (m.machineId == x.machineId) return true;
                                    }
                                    return false;
                                })

                                if (!mx.length) {
                                    that.sclients.push(socket);
                                    console.log('DATA machine exist and accepted');
                                } else if (mx.length) {
                                    console.log('DATA duplicated connection', mx.length);
                                    mx.forEach(v => v.end())
                                    socket.end();
                                    // allow new connection only
                                    console.log('DATA terminate all connection and restart');
                                    return;
                                }
                                return;
                            } else {
                                console.log('DATA  not exist machine id ');
                                socket.end();
                                return;
                            }

                        } else if (d.command == EMACHINE_COMMAND.ping) {
                            console.log('DATA command ping');
                            const token = d.token;
                            const x = that.findMachineIdToken(token);
                            if (!x) {
                                console.log('DATA ping not found token');
                                socket.end();

                            } else {
                                console.log('DATA ping found token');
                                const mx = that.sclients.filter(v => {
                                    const m = v['machineId'] as IMachineClientID;
                                    if (m) {
                                        if (m.machineId == x.machineId) return true;
                                    }
                                    return false;
                                });
                                if (mx.length > 1) {
                                    mx.forEach(v => v.end());
                                    socket.end();
                                    console.log('DATA ping duplicated !');
                                    return;
                                } else if (!mx.length) {
                                    socket.end();
                                    console.log('DATA re-login PLEASE!');
                                    return;
                                }
                                /// update balance
                                const m = mx[0]['machineId'] as IMachineClientID;

                                const func = new CashValidationFunc();
                                const params = {
                                    machineId: m.machineId
                                }
                                console.log(`machine der`, params);
                                const limiter =100000;
                                func.Init(params).then(run => {
                                    const response: any = run;
                                    if (response.message != IENMessage.success) {
                                        console.log(`cash validate fail`, response?.message);
                                        // socket.end();
                                    }
                                    readMachineSetting(m.machineId).then(r=>{
                                        let setting ={} as any
                                        if(r){
                                            try {
                                                setting= JSON.parse(r);
                                            } catch (error) {
                                                console.log('error parsing setting 2',error);
                                                setting.allowVending=true,setting.allowCashIn=true;setting.lowTemp=5;setting.highTemp=10;setting.light=true;
                                            }
                                        }
                                        writeMerchantLimiterBalance(x.ownerUuid,response?.balance+'');
                                        writeMachineLimiter(m.machineId,limiter+'');
                                        that.updateBalance(m.machineId, {balance:response?.balance||0,limiter,setting});
                                    })
                                   

                                }).catch(error => {
                                    console.log(`cash validation error`, error.message);
                                    socket.end();
                                });

                            }
                            return;
                        } 
                        else if(d.command == EMACHINE_COMMAND.CREDIT_NOTE){
                           that.eventEmitter.emit('MachineCredit',d);
                           return;
                        }
                        else if (d.command == EMACHINE_COMMAND.status) {
                            console.log('DATA show status here', d.command, d.token, d.data);
                            const token = d.token;
                            const x = that.findMachineIdToken(token);
                            if (x) {
                                console.log('DATA ping found token');
                                // const mx = that.sclients.filter(v => {
                                //     const m = v['machineId'] as IMachineClientID;
                                //     if (m) {
                                //         return m.machineId == x.machineId
                                //     }
                                //     return false;
                                // });
                                // if (mx.length > 1) {
                                //     mx.forEach(v => v.end());
                                //     socket.end();
                                //     console.log('DATA duplicated !');
                                //     return;
                                // } else if (!mx.length) {
                                //     socket.end();
                                //     console.log('DATA re-login PLEASE!');
                                //     return;
                                // }
                                console.log('DATA  Update status here ');
                                writeLogs(d, d.command);
                                that.eventEmitter.emit('MachineResponse',d)
                                return;
                            } else {
                                socket.end();

                                console.log('DATA  not exist machine id ');
                                return;
                            }
                        } else if (Object.keys(EZDM8_COMMAND).includes(d.command)) {
                            console.log('DATA response from the machine', d);
                            console.log('DATA need to confirm the ORDER has been completed or not, TODO LATER');
                            writeLogs(d, d.command);
                            // that.eventEmitter.emit('MachineResponse',d)
                            return;
                        }
                        socket.end();

                    } catch (e) {
                        console.log('wrong data', data, e);
                    }
                });

                socket.on('drain', function () {
                    try {
                        console.log('write buffer is empty now .. u can resume the writable stream');
                        socket.resume();
                    } catch (error) {
                        console.log(error);

                    }

                });

                socket.on('error', function (error) {
                    try {
                        console.log('Error : ' + error);
                        if (!socket.closed)
                            socket.end();
                    } catch (error) {
                        console.log(error);

                    }

                });

                // socket.on('timeout', function () {
                //     console.log('Socket timed out !');
                //     socket.end('Timed out!');
                //     // can call socket.destroy() here too.
                //     if (!socket.closed)
                //         socket.end();
                // });

                socket.on('end', function (data) {
                    console.log('End data : ' + data);
                });

                socket.on('close', function (error) {
                    try {
                        var bread = socket.bytesRead;
                        var bwrite = socket.bytesWritten;
                        console.log('CLOSING Bytes read : ' + bread);
                        console.log('CLOSING Bytes written : ' + bwrite);
                        console.log(' CLOSING Socket closed!');
                        if (error) {
                            console.log('CLOSING Socket was closed coz of transmission error');
                        }
                        const x = that.sclients.findIndex(v => {
                            if (v) {
                                const x = v['machineId'] as IMachineClientID;
                                console.log(' machineId', socket['machineId'], x);

                                if (x.machineId + '' == socket['machineId'].machineId + '') return true;
                            }
                            return false;
                        });
                        console.log('CLOSING delete x +', x, that.sclients.length);
                        if (x > -1) {
                            that.sclients.splice(x, 1);
                        }

                        console.log('delete x -', x, that.sclients.length);
                    } catch (error) {
                        console.log('Close error', error);

                    }


                });

                // setTimeout(function () {
                //     var isdestroyed = socket.destroyed;
                //     console.log('Socket destroyed:' + isdestroyed);
                //     
                // }, 1200000);

            });

            // emits when any error occurs -> calls closed event immediately after this.
            this.server.on('error', function (error) {
                console.log('Error: ' + error);
            });

            //emits when server is bound with server.listen
            this.server.on('listening', function () {
                console.log('Server is listening!');
            });

            // this. server.maxConnections = 10;
            // for dyanmic port allocation
            this.server.listen(this.ports, function () {
                var address = that.server.address() as net.AddressInfo;
                var port = address.port;
                var family = address.family;
                var ipaddr = address.address;
                console.log('Server is listening at port' + port);
                console.log('Server ip :' + ipaddr);
                console.log('Server is IP4/IP6 : ' + family);
            });



            var islistening = this.server.listening;

            if (islistening) {
                console.log('Server is listening');
            } else {
                console.log('Server is not listening');
            }
        } catch (error) {
            console.log(error);

        }

    }

    onMachineResponse(cb:(r:IReqModel)=>void,removeAll=true){
        // !removeAll||this.eventEmitter.removeAllListeners();
        this.eventEmitter.on('MachineResponse',cb);
    }
    onMachineCredit(cb:(r:IReqModel)=>void){
        this.eventEmitter.on('MachineCredit',cb);
    }
    findMachineId(machineId: string) {
        try {
            return this.machineIds.find(v => v.machineId == machineId);
        } catch (error) {
            console.log(error);

        }

    }
    findMachineIdToken(token: string) {
        try {
            // const list = this.machineIds.map(item => { return { machineid: item.machineId, otp: item.otp } });
            // console.log(`machineIds der`, list);

            // const model = list.filter(item => item.machineid == '11111111' && item.otp == '111111');
            // const hash = cryptojs.SHA256(model[0].machineid + model[0].otp).toString(cryptojs.enc.Hex);
            // console.log(`compare hash`, token == hash, token, hash);
            // const a = this.machineIds.find(v => cryptojs.SHA256(v.machineId + v.otp).toString(cryptojs.enc.Hex) == token);
            // console.log(`a`, a);
            const result = this.machineIds.find(v => cryptojs.SHA256(v.machineId + v.otp).toString(cryptojs.enc.Hex) == token);
            // console.log(`result der`, result);
            return result;

        } catch (error) {
            console.log(error);

        }
    }
    initMachineId(m: Array<IMachineClientID>) {
        this.machineIds.length = 0;
        const data = JSON.parse(JSON.stringify(m));
        console.log(`initMachineId`, data);
        this.machineIds.push(...data)
        this.initMachineSetting(m);
    }
    initMachineSetting(m: Array<IMachineClientID>){
        m.forEach(v=>{
            if(!Array.isArray(v.data))v.data=[];
            
            const x = v.data[0]?.allowVending||true;
            const y = v.data[0]?.allowCashIn||true;
            const w = v.data[0]?.light||true;
            const z = v.data[0]?.highTemp||10;
            const u = v.data[0]?.lowTemp||5;
            const a = v.data.find(v=>v.settingName=='setting');
            if(!a)v.data.push({settingName:'setting',allowVending:x,allowCashIn:y,lowTemp:u,highTemp:z,light:w});
            else{a.allowVending=x;a.allowCashIn=y,a.light=w;a.highTemp=z;a.lowTemp=u}
            writeMachineSetting(v.machineId,v.data);
        })
    }
    listOnlineMachines() {
        try {
            console.log('count online machine', this.sclients.length);

            return this.sclients.map(v => {
                const x = v['machineId'] as IMachineClientID;
                return x;
            });
        } catch (error) {
            console.log(error);

        }

    }
    findOnlneMachine(machineId: string) {
        try {
            const x = this.sclients.find(v => {
                const x = v['machineId'] as IMachineClientID;
                if (x) {
                    return x.machineId == machineId;
                }
                return false;
            });
            return x;
        } catch (error) {
            console.log(error);

        }

    }
    processOrder(machineId: string, position: number, transactionID: number) {
        try {
            const x = this.sclients.find(v => {
                const x = v['machineId'] as IMachineClientID;
                if (x) {
                    return x.machineId == machineId;
                }
                return false;
            });
            if (position < 0 || position > 100 || Number.isNaN(position))
                return { position, status: x };
            if (x) {
                const res = {} as IResModel;
                res.command = EZDM8_COMMAND.shippingcontrol
                res.message = EMessage.processingorder;
                res.transactionID = transactionID;
                res.status = 1;
                res.data = { slot: position };
                console.log('writing...', x['machineId'], 'POSITION', position);
                return { position, status: x.write(JSON.stringify(res) + '\n'),code:1};
            } else {
                console.log('client id socket not found','pos',position,'t',transactionID);
                const data = `${machineId}-${position}-${transactionID}`
                return { position, status: x, message: 'Error machineID not found ' + data + '--' + JSON.stringify(this.sclients),code:0 };
            }
        } catch (error: any) {
            console.log('client id socket not found');
            return { position, status: false, message: error.message };
        }

    }
    updateBalance(machineId: string, balance:any) {
        try {
            const x = this.sclients.find(v => {
                const x = v['machineId'] as IMachineClientID;
                if (x) {
                    return x.machineId == machineId;
                }
                return false;
            });
        
            if (x) {
                const res = {} as IResModel;
                res.command = EZDM8_COMMAND.balance
                res.message = EMessage.updatebalance;
                res.status = 1;
                res.data = balance;
                console.log('writing...', x['machineId'], 'balance', balance);
                return { balance, status: x.write(JSON.stringify(res) + '\n'),code:1};
            } else {
                console.log('client id socket not found','balance',balance);
                const data = `${machineId}-${balance}`
                return { balance, status: x, message: 'Error machineID not found ' + data + '--' + JSON.stringify(this.sclients),code:0 };
            }
        } catch (error: any) {
            console.log('client id socket not found');
            return { balance, status: false, message: error.message };
        }

    }
    setLimiter(machineId: string, limiter:number) {
        try {
            const x = this.sclients.find(v => {
                const x = v['machineId'] as IMachineClientID;
                if (x) {
                    return x.machineId == machineId;
                }
                return false;
            });
            if (x) {
                const res = {} as IResModel;
                res.command = EZDM8_COMMAND.limiter
                res.message = EMessage.updatelimiter;
                res.status = 1;
                res.data = limiter;
                console.log('writing...', x['machineId'], 'limiter', limiter);
                return { limiter, status: x.write(JSON.stringify(res) + '\n'),code:1};
            } else {
                console.log('client id socket not found','limiter',limiter);
                const data = `${machineId}-${limiter}`
                return { limiter, status: x, message: 'Error machineID not found ' + data + '--' + JSON.stringify(this.sclients),code:0 };
            }
        } catch (error: any) {
            console.log('client id socket not found');
            return { limiter, status: false, message: error.message };
        }

    }

    getReports(machineId: string) {
        try {
            const x = this.sclients.find(v => {
                const x = v['machineId'] as IMachineClientID;
                if (x) {
                    return x.machineId == machineId;
                }
                return false;
            });
            if (x) {
                const res = {} as IResModel;
                res.command = EZDM8_COMMAND.reports
                res.message = EMessage.requestReports;
                res.status = 1;
                console.log('writing...', x['machineId'], 'limiter');
                return {  status: x.write(JSON.stringify(res) + '\n'),code:1};
            } else {
                console.log('client id socket not found');
                const data = `${machineId}`
                return {  status: x, message: 'Error machineID not found ' + data + '--' + JSON.stringify(this.sclients),code:0 };
            }
        } catch (error: any) {
            console.log('client id socket not found');
            return {  status: false, message: error.message };
        }

    }
    getLogs(machineId: string) {
        try {
            const x = this.sclients.find(v => {
                const x = v['machineId'] as IMachineClientID;
                if (x) {
                    return x.machineId == machineId;
                }
                return false;
            });
            if (x) {
                const res = {} as IResModel;
                res.command = EZDM8_COMMAND.logs
                res.message = EMessage.requestReports;
                res.status = 1;
                console.log('writing...', x['machineId'], 'limiter');
                return {  status: x.write(JSON.stringify(res) + '\n'),code:1};
            } else {
                console.log('client id socket not found');
                const data = `${machineId}`
                return {  status: x, message: 'Error machineID not found ' + data + '--' + JSON.stringify(this.sclients),code:0 };
            }
        } catch (error: any) {
            console.log('client id socket not found');
            return {  status: false, message: error.message };
        }

    }

    deleteReport(machineId: string,time:Array<string>) { // dd-MM-yy
        try {
            const x = this.sclients.find(v => {
                const x = v['machineId'] as IMachineClientID;
                if (x) {
                    return x.machineId == machineId;
                }
                return false;
            });
            if (x) {
                const res = {} as IResModel;
                res.command = EZDM8_COMMAND.deleteReports
                res.message = EMessage.deleteReport;
                res.status = 1;
                console.log('writing...', x['machineId'], 'limiter');
                return { time, status: x.write(JSON.stringify(res) + '\n'),code:1};
            } else {
                console.log('client id socket not found');
                const data = `${machineId}`
                return {  status: x, message: 'Error machineID not found ' + data + '--' + JSON.stringify(this.sclients),code:0 };
            }
        } catch (error: any) {
            console.log('client id socket not found');
            return {  status: false, message: error.message };
        }

    }






}