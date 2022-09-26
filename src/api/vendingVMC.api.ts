import axios from 'axios';
import {Response} from 'express'
import express, { Router } from 'express';
import { EMessage, IReqModel, IResModel } from '../entities/syste.model';
import ModbusRTU from 'modbus-serial';
import { SerialPort } from 'serialport'
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from "ws-heartbeat/server";
import { broadCast, initWs, PrintError, PrintSucceeded, wsSendToClient } from '../sevices/service';

export class VendingM102Server {
    wss: WebSocketServer.Server;
    port = new SerialPort({ path: '/dev/tty-usbserial1', baudRate: 9600 }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
    })
    constructor(router: Router, wss: WebSocketServer.Server) {

        initWs(wss);
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
              that.port.on('data', function(data:any) {
                console.log('data',data);
                
                buffer += new String(data);
                console.log('buffer',buffer);
                
                var lines = buffer.split("\n");
                while ( lines.length > 1 )
                  wsSendToClient(that.wss,'data',EMessage.all, lines.shift() );
                buffer = lines.join("\n");
          
            });  
          });  

        // Pipe the data into another stream (like a parser or standard out)
        // const lineStream = this.port.pipe(new Readline())
        router.post('/command', async (req, res) => {
            const command = req.query['command'] + '';
            try {
                this.command(command,res)
            } catch (error) {
                console.log(error);
                res.send(PrintError(command, error, EMessage.error));
            }
        })




    }
    command(command: string,res:Response) {

        this.port.write(command, 'hex', (e) => {
            if (e) {
                return console.log('Error: ', e.message)
            }

        })
    }




  

}
