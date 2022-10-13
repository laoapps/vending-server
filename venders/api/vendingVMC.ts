import axios from 'axios';

import { EMessage, EVMC_COMMAND, IReqModel, IResModel } from '../entities/syste.model';

import { SerialPort } from 'serialport'


import { broadCast, chk8xor, initWs, PrintError, PrintSucceeded, wsSendToClient } from '../services/service';
import xor from 'buffer-xor'
import { SocketClientVMC } from './socketClient.vmc';

export class VendingVMC {

    port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 57600 }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
    });
    sock: SocketClientVMC|null=null
    transactionID=-1;;
    constructor(sock: SocketClientVMC) {
        this.sock = sock;
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
                // if (buffer.length == 4) {
                    sock.send(buffer,that.transactionID)
                    buffer = '';
                    that.transactionID=-1;
                   
                // }

            });
        });

    }

    command(command: EVMC_COMMAND, params: any,transactionID:number) {
        this.transactionID=transactionID;
        return new Promise<IResModel>((resolve, reject) => {
            const series = params.series;
            //STX
            //Command
            // Length
            // PackNO+Text
            //XOR
            const buff = [0xfa, 0xfb];
            // POLL command
            if (command == 0x41) {
                buff.push(command);
                buff.push(0x00);
                // p.push(parseInt(p.length+'', 16));
                buff.push(chk8xor(buff))
            }
            // Upper computer selects to buy
            else if (command == 0x03) {
                buff.push(command);
                buff.push(0x03);//length
                // p.push(parseInt(p.length+'', 16));
                buff.push(series);// default communication number
                buff.push(...params);// slot 
                buff.push(chk8xor(buff))
            }
            /// dispensing
            else if (command == 0x06) {
                buff.push(command);
                buff.push(0x05);//length
                // p.push(parseInt(p.length+'', 16));
                buff.push(series);// default communication number
                buff.push(0x01);// text communication number 
                buff.push(0x01) // enable drop sensor
                buff.push(0x00) // disable elavator
                buff.push(...params);// select slot
                buff.push(chk8xor(buff))
            }
            // check drop sensor
            else if (command == 0x24) {
                buff.push(command);
                buff.push(0x05);//length
                // p.push(parseInt(p.length+'', 16));
                buff.push(series);// default communication number
                buff.push(0x00);// read drop sensor
                buff.push(...params) // enable drop sensor
                buff.push(chk8xor(buff))
            }
            /// set drop sensor
            else if (command == 0x24) {
                buff.push(command);
                buff.push(0x05);//length
                // p.push(parseInt(p.length+'', 16));
                buff.push(series);// default communication number
                buff.push(0x01);// read drop sensor
                buff.push(...params) // enable drop sensor [0x00,0x00,0x01] 
                // disable drop sensor [0x00,0x00,0x00] 
                buff.push(chk8xor(buff))
            }
            //temperature
            else if (command == 0x28) {
                buff.push(command);
                buff.push(0x02);//length
                // p.push(parseInt(p.length+'', 16));
                buff.push(series);// default communication number
                buff.push(0x01);// read drop sensor
                buff.push(...params)
                // enable drop sensor [0x00,0x00,0x01] 
                // disable drop sensor [0x00,0x00,0x00] 
                buff.push(chk8xor(buff))
            }
            //temperature
            else if (command == 0x51) { // 0x36
                buff.push(command);
                buff.push(0x01);//length
                buff.push(series);// default communication number
                // enable drop sensor [0x00,0x00,0x01] 
                // disable drop sensor [0x00,0x00,0x00] 
                buff.push(chk8xor(buff))
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
            const x = buff.join('')
            this.port.write(Buffer.from(x, 'hex'), (e) => {
                if (e) {
                    reject(PrintError(command as any, params, e.message));
                    return console.log('Error: ', e.message)
                } else {
                    resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                }
            })
        })

    }
    close() {
        this.port.close((e) => {
            console.log('closing', e);
        })
    }






}
