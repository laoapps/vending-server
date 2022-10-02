import axios from 'axios';
import {Response} from 'express'
import express, { Router } from 'express';
import { EMessage, IReqModel, IResModel } from '../entities/syste.model';
import ModbusRTU from 'modbus-serial';
import { SerialPort } from 'serialport'
import * as WebSocketServer from 'ws';
import { setWsHeartbeat } from "ws-heartbeat/server";
import { broadCast, chk8xor, initWs, PrintError, PrintSucceeded, wsSendToClient } from '../services/service';
import xor from 'buffer-xor'

export class VendingM102Server {
    wss: WebSocketServer.Server;
    port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 57600 }, function (err) {
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
            const params = req.query['params'] as unknown as Array<number>;
            const series = Number(req.query['series']);
            try {
                this.command(Number(command),series,params,res)
            } catch (error) {
                console.log(error);
                res.send(PrintError(command, error, EMessage.error));
            }
        })




    }
    command(command: number,series:number,params:Array<number>,res:Response) {
        //STX
        //Command
        // Length
        // PackNO+Text
        //XOR
        const p =[0xfa,0xfb];
        // POLL command
        if(command==0x41){ 
            p.push(command);
            p.push(0x00);
            // p.push(parseInt(p.length+'', 16));
            p.push(chk8xor(p))
        }
        // Upper computer selects to buy
        else if(command==0x03){ 
            p.push(command);
            p.push(0x03);//length
            // p.push(parseInt(p.length+'', 16));
            p.push(series);// default communication number
            p.push(...params);// slot 
            p.push(chk8xor(p))
        }
        /// dispensing
        else if(command==0x06){ 
            p.push(command);
            p.push(0x05);//length
            // p.push(parseInt(p.length+'', 16));
            p.push(series);// default communication number
            p.push(0x01);// text communication number 
            p.push(0x01) // enable drop sensor
            p.push(0x00) // disable elavator
            p.push(...params) ;// select slot
            p.push(chk8xor(p))
        }
        // check drop sensor
        else if(command==0x24){ 
            p.push(command);
            p.push(0x05);//length
            // p.push(parseInt(p.length+'', 16));
            p.push(series);// default communication number
            p.push(0x00);// read drop sensor
            p.push(...params) // enable drop sensor
            p.push(chk8xor(p))
        }
        /// set drop sensor
        else if(command==0x24){ 
            p.push(command);
            p.push(0x05);//length
            // p.push(parseInt(p.length+'', 16));
            p.push(series);// default communication number
            p.push(0x01);// read drop sensor
            p.push(...params) // enable drop sensor [0x00,0x00,0x01] 
            // disable drop sensor [0x00,0x00,0x00] 
            p.push(chk8xor(p))
        }
        //temperature
        else if(command==0x28){ 
            p.push(command);
            p.push(0x02);//length
            // p.push(parseInt(p.length+'', 16));
            p.push(series);// default communication number
            p.push(0x01);// read drop sensor
            p.push(...params) 
            // enable drop sensor [0x00,0x00,0x01] 
            // disable drop sensor [0x00,0x00,0x00] 
            p.push(chk8xor(p))
        }
        //temperature
        else if(command==0x51){ // 0x36
            p.push(command);
            p.push(0x01);//length
            p.push(series);// default communication number
            // enable drop sensor [0x00,0x00,0x01] 
            // disable drop sensor [0x00,0x00,0x00] 
            p.push(chk8xor(p))
        }
                // else if(command==0x21){ 
        //     p.push(command);
        //     p.push(0x06);//length
        //     // p.push(parseInt(p.length+'', 16));
        //     p.push(series);// default communication number
        //     p.push(0x01);// default mode : 01 bill
        //     p.push(...[0x00,0x01]) // amount 1
        //     p.push(chk8xor(p))
        // }
        // else if(command==0x24){ 
        //     p.push(command);
        //     p.push(0x13);//length
        //     // p.push(parseInt(p.length+'', 16));
        //     p.push(series);// default communication number
        //     p.push(0x01);// default mode : 01 bill
        //     p.push(...[0x00,0x01]) // amount 1
        //     p.push(chk8xor(p))
        // }
       
        this.port.write(p, 'hex', (e) => {
            if (e) {
                return console.log('Error: ', e.message)
            }
            res.send(PrintSucceeded(p+'',p,EMessage.succeeded));

        })
    }




  

}
