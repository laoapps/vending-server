import axios from 'axios';
import { Response } from 'express'
import express, { Router } from 'express';
import { EM102_COMMAND, EMessage, IReqModel, IResModel } from '../entities/syste.model';
import ModbusRTU from 'modbus-serial';
import { SerialPort } from 'serialport'
import * as WebSocketServer from 'ws';
import { broadCast, initWs, PrintError, PrintSucceeded, wsSendToClient } from '../sevices/service';
import crc16, { checkSum } from 'node-crc16';

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
        let buffer = '';
        const that = this;
        this.port.on("open", function () {
            console.log('open serial communication');
            // Listens to incoming data
            that.port.on('data', function (data: any) {
                console.log('data', data);
                buffer += new String(data);
                console.log('buffer', buffer);
                var lines = buffer.split("\n");
                while (lines.length > 1)
                    wsSendToClient(that.wss, 'data', EMessage.all, lines.shift());
                buffer = lines.join("\n");

            });
        });

        // Pipe the data into another stream (like a parser or standard out)
        // const lineStream = this.port.pipe(new Readline())
        router.post('/command', async (req, res) => {
            const command = req.query['command'] as EM102_COMMAND;
            const { param } = req.body;
            try {
                if (!Object.keys(EM102_COMMAND).find(v => v == command)) throw new Error(EMessage.commandnotfound);

                this.command(command, param, res)
            } catch (error) {
                console.log(error);
                res.send(PrintError(command, error, EMessage.error));
            }
        })
    }
    command(command: EM102_COMMAND, param: number, res: Response) {
        let buffer = Array<any>();
        let check = '';
        switch (command) {
            case EM102_COMMAND.getid:
                buffer = [0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x71, 0x88];

                break;
            case EM102_COMMAND.getresult:
                buffer = [0x01, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xD0, 0xE8];

                break;
            case EM102_COMMAND.scan:
                buffer = [0x01, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
                check = checkSum(Buffer.from(buffer), { retType: 'hex' });
                console.log('checksum', check);
                buffer.push(check);
                break;
            case EM102_COMMAND.release:
                buffer = [0x01, 0x05, 0x00, param, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
                check = checkSum(Buffer.from(buffer), { retType: 'hex' });
                console.log('checksum', check);
                buffer.push(check);
                break;

            case EM102_COMMAND.readtemperature:
                buffer = [0x01, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x92, 0x29]
                check = checkSum(Buffer.from(buffer), { retType: 'hex' });
                console.log('checksum', check);
                buffer.push(check);
                break;
            case EM102_COMMAND.DO:
                buffer = [0x01, 0x08, param, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
                check = checkSum(Buffer.from(buffer), { retType: 'hex' });
                console.log('checksum', check);
                buffer.push(check);
                break;
            case EM102_COMMAND.DI:
                buffer = [0x01, 0x09, param, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
                check = checkSum(Buffer.from(buffer), { retType: 'hex' });
                console.log('checksum', check);
                buffer.push(check);
                break;
            case EM102_COMMAND.modify:
                buffer = [0xFF, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x50]
                // buffer=[0xFF,0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0xD0,0xA0]
                // buffer=[0xFF,0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x81,0x30]
                // buffer=[0xFF,0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x33,0x01]
                // buffer=[0xFF,0x05,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x62,0x91]
                // buffer=[0xFF,0x06,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x92,0x61]
                // buffer=[0xFF,0x07,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0xC3,0xF1]
                // buffer=[0xFF,0x08,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0xF6,0x02]
                break;

            default:

                break;
        }
        this.port.write(buffer, 'hex', (e) => {
            if (e) {
                res.send(PrintError(command, param, e.message));
                return console.log('Error: ', e.message)
            } else {
                res.send(PrintSucceeded(command, param, EMessage.commandsucceeded));
            }

        })
    }






}
