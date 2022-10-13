import net from 'net';
import { EZDM8_COMMAND, EMACHINE_COMMAND, EMessage, IMachineClientID as IMachineClientID, IReqModel, IResModel } from '../entities/syste.model';
import cryptojs from 'crypto-js';
// console.log(cryptojs.SHA256('11111111111111').toString(cryptojs.enc.Hex));
export class SocketServerZDM8 {
    server = net.createServer();
    sclients = Array<net.Socket>();
    ports = 2222;

    private machineIds: Array<IMachineClientID> = [{ machineId: '12345678', otp: '111111' }, { machineId: '11111111', otp: '111111' }];

    constructor() {
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
                    console.log('Bytes read : ' + bread);
                    console.log('Bytes written : ' + bwrite);
                    // console.log('Data sent to server : ' + data);
                    console.log('Data sent to server : ' + data.toString());

                    const d = JSON.parse(data.toString()) as IReqModel;

                    console.log('total connection',that.sclients.length);
                    if (d.command == EMACHINE_COMMAND.login) {
                        const token = d.token;
                        const x = that.findMachineIdToken(token);
                        if (x) {
                            console.log('found machine id');
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
                                console.log('machine exist and accepted');
                            } else if(mx.length) {
                                console.log('duplicated connection',mx.length);
                                mx.forEach(v=>v.end())
                                socket.end();
                                // allow new connection only
                                console.log('terminate all connection and restart');
                               return;
                            }
                            return;
                        } else {
                            console.log(' not exist machine id ');
                            socket.end();
                            return;
                        }
                   
                    } else if(d.command == EMACHINE_COMMAND.ping){
                        console.log('command ping');
                        const token = d.token;
                        const x = that.findMachineIdToken(token);
                        if (!x) {
                            console.log('ping not found token');
                            socket.end();
                            
                        } else {
                            console.log('ping found token');
                            const mx = that.sclients.filter(v => {
                                const m = v['machineId'] as IMachineClientID;
                                if (m) {
                                    if (m.machineId == x.machineId) return true;
                                }
                                return false;
                            });
                            if (mx.length>1) {
                                mx.forEach(v=>v.end());
                                socket.end();
                                console.log('ping duplicated !');
                                return;
                            }else if(!mx.length){
                                socket.end();
                                console.log('re-login PLEASE!');
                                return;
                            }
                            return;
                        }
                    }else if(d.command == EMACHINE_COMMAND.status){
                        console.log('show status here',d.command,d.token,d.data);
                        const token = d.token;
                        const x = that.findMachineIdToken(token);
                        if (x) {
                            console.log('ping found token');
                            const mx = that.sclients.filter(v => {
                                const m = v['machineId'] as IMachineClientID;
                                if (m) {
                                    return m.machineId == x.machineId
                                }
                                return false;
                            });
                            if (mx.length>1) {
                                mx.forEach(v=>v.end());
                                socket.end();
                                console.log('duplicated !');
                                return;
                            }else if(!mx.length){
                                socket.end();
                                console.log('re-login PLEASE!');
                                return;
                            }
                            console.log(' Update status here ');
                            
                            return;
                        } else {
                            socket.end();
                            
                            console.log(' not exist machine id ');
                            return;
                        }
                    }
                    
                } catch (e) {
                    console.log('wrong data', data, e);
                }
            });

            socket.on('drain', function () {
                console.log('write buffer is empty now .. u can resume the writable stream');
                socket.resume();
            });

            socket.on('error', function (error) {
                console.log('Error : ' + error);
                if (!socket.closed)
                    socket.end();
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
                    console.log('Bytes read : ' + bread);
                    console.log('Bytes written : ' + bwrite);
                    console.log('Socket closed!');
                    if (error) {
                        console.log('Socket was closed coz of transmission error');
                    }
                    const x = that.sclients.findIndex(v => {
                        if (v) {
                            const x = v['machineId'] as IMachineClientID;
                            console.log(' machineId', socket['machineId'],x);
                            
                            if (x.machineId+'' == socket['machineId'].machineId+'') return true;
                        }
                        return false;
                    });
                    console.log('delete x +',x, that.sclients.length);
                    if(x>-1){
                        that.sclients.splice(x, 1);
                    }
                    
                    console.log('delete x -',x, that.sclients.length);
                } catch (error) {
                    console.log('Close error',error);
                    
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
    }
    findMachineId(machineId: string) {
        return this.machineIds.find(v => v.machineId == machineId);
    }
    findMachineIdToken(token:string){
        return this.machineIds.find(v => cryptojs.SHA256(v.machineId + v.otp).toString(cryptojs.enc.Hex) == token);
    }
    listOnlineMachine() {
        console.log('count online machine', this.sclients.length);

        return this.sclients.map(v => {
            const x = v['machineId'] as IMachineClientID;
            return x;
        });
    }
    findOnlneMachine(machineId: string) {
        const x = this.sclients.find(v => {
            const x = v['machineId'] as IMachineClientID;
            if (x) {
                return x.machineId == machineId;
            }
            return false;
        });
        return x;
    }
    processOrder(machineId: string, position: number,transactionID:number) {
        try {
            const x = this.sclients.find(v => {
                const x = v['machineId'] as IMachineClientID;
                if (x) {
                    return x.machineId == machineId;
                }
                return false;
            });
            if(position<0||position>99||Number(position)==NaN)
                return { position, status: false };
            if (x) {
                const res = {} as IResModel;
                res.command = EZDM8_COMMAND.shippingcontrol
                res.message = EMessage.processingorder;
                res.transactionID = transactionID;
                res.status = 1;
                res.data = { slot: position };
                console.log('writing...', x['machineId']);
                return { position, status: x.write(JSON.stringify(res)) };
            } else {
                console.log('client id socket not found');
                return { position, status: false };
            }
        } catch (error) {
            console.log('client id socket not found');
            return { position, status: false };
        }

    }


}