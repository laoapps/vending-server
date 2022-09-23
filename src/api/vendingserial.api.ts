import axios from 'axios';
import express, { Router } from 'express';
import { EMessage, IReqModel, IResModel } from '../entities/syste.model';
import ModbusRTU from 'modbus-serial';
import { SerialPort } from 'serialport'
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from "ws-heartbeat/server";
import { PrintError, PrintSucceeded } from '../sevices/service';

export class VendingServer {
    wss: WebSocketServer.Server;
    port = new SerialPort({ path: '/dev/tty-usbserial1', baudRate: 9600 }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
    })
    constructor(router: Router, wss: WebSocketServer.Server) {

        this.initWs(wss);
        this.wss = wss;
    

        // Read data that is available but keep the stream in "paused mode"
        // this.port.on('readable', function () {
        //     console.log('Data:', this.port.read())
        // })

        // Switches the port into "flowing mode"
        // this.port.on('data', function (data) {
        //     console.log('Data:', data)
        // })
        let buffer ='';
        const that = this;
        this.port.on("open", function () {
            console.log('open serial communication');
                  // Listens to incoming data
              this.port.on('data', function(data:any) {
                console.log('data',data);
                
                buffer += new String(data);
                console.log('buffer',buffer);
                
                var lines = buffer.split("\n");
                while ( lines.length > 1 )
                  that.broadCast(that.wss, lines.shift() );
                buffer = lines.join("\n");
          
            });  
          });  

        // Pipe the data into another stream (like a parser or standard out)
        // const lineStream = this.port.pipe(new Readline())
        router.post('/command', async (req, res) => {
            const command = req.query['command'] + '';
            try {
                this.command(command)
            } catch (error) {
                console.log(error);
                res.send(PrintError(command, error, EMessage.error));
            }
        })




    }
    command(command: string) {

        this.port.write(command, 'hex', (e) => {
            if (e) {
                return console.log('Error: ', e.message)
            }

        })
    }



    initWs(wss: WebSocketServer.Server) {
        setWsHeartbeat(wss, (ws, data, binary) => {
            if (data === '{"kind":"ping"}') { // send pong if recieved a ping.
                ws.send('{"kind":"pong"}');
            }
        }, 30000);

        wss.on('connection', (ws: WebSocket) => {
            console.log('new connection ', ws.url);

            console.log('current connection is alive', ws['isAlive']);
            const that = this;


            ws.onopen = (ev: Event) => {
                console.log('open', ev);
                // ws['isAlive'] = true;
            }
            ws.onclose = (ev: CloseEvent) => {

            }
            ws.onerror = (ev: Event) => {
                console.log('error', ev);
            }

            //connection is up, let's add a simple simple event
            ws.onmessage = async (ev: MessageEvent) => {
                let d: IReqModel = {} as IReqModel;
                // ws['isAlive'] = true;
                try {
                    console.log('comming', ev.data);

                    d = JSON.parse(ev.data) as IReqModel;

                } catch (error) {
                    console.log('message', error);
                    ws.send(JSON.stringify(d));
                }
            }
        });
    }

    broadCast(wss: WebSocketServer.WebSocketServer, r: any, delay: boolean = false) {
        const d = {} as IResModel;
        d.data = r;
        console.log('send ws to client ', d);
        this.wsSendToClient(wss, EMessage.all, d, delay);
    }

    wsSendToClient(wss: WebSocketServer.Server, uuid: string, d: any, delay: boolean = false) {
        setTimeout(() => {
            wss.clients.forEach(ws => {
                if (ws) {
                    if (ws.readyState === 1) {
                        if (ws['ownerUuid'] + '' == uuid || uuid == EMessage.all) {
                            //d.data = x;
                            console.log('sending to ', uuid);

                            ws.send(JSON.stringify(d));
                            return;
                        }
                    }
                    else {
                        console.log('client ', ws['ownerUuid'], ws.readyState);

                    }
                }

            });
        }, delay ? 1000 : 0);

    }

}
