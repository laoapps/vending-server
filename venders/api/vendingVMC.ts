import axios from 'axios';

import { EMessage, EVMC_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';

import { SerialPort } from 'serialport'


import { broadCast, chk8xor, initWs, int2hex, PrintError, PrintSucceeded, wsSendToClient } from '../services/service';
import xor from 'buffer-xor'
import { SocketClientVMC } from './socketClient.vmc';
import { resolve } from 'path';

export class VendingVMC {

    // port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 57600 }, function (err) {
    port = new SerialPort({ path: '/dev/ttyS1', baudRate: 9600 }, function (err) {
        if (err) {
            return console.log('Error: ', err.message)
        }
    });
    sock: SocketClientVMC | null = null
    transactionID = -1;
    resM = '';
    commands = Array<{ command: EZDM8_COMMAND, params: any, transactionID: number }>();
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
                if (buffer.startsWith('fafb42')) {
                    if (that.commands.length) {
                        const x = that.commands.splice(0, 1)
                        if (x[0].command == EZDM8_COMMAND.shippingcontrol) {
                            that.commandVMC(EVMC_COMMAND._03, x[0].params, x[0].transactionID).then(r => {
                                sock.send(buffer, that.transactionID)
                                that.transactionID = -1;
                            })
                        }
                        if (x[0].command == EZDM8_COMMAND.hutemp) {
                            that.commandVMC(EVMC_COMMAND._28, x[0].params, x[0].transactionID).then(r => {
                                sock.send(buffer, that.transactionID)
                                that.transactionID = -1;
                            })
                        }
                    }
                }
                if (buffer.startsWith('fafb04')) {
                    that.resM = buffer;
                    sock.send(buffer, that.transactionID)
                }


                // sock.send(buffer, that.transactionID)
                buffer = '';

                // that.processCoolingSystemTask(buffer);
            });
        });
        // setInterval(() => {
        //     this.coolingSystemTask();
        // }, 30000)

    }
    // coolingSystemTask() {
    //     this.command('hutemp', null, -1);
    // }
    // processCoolingSystemTask(resBuffer:any, minTemp = 3, maxTemp = 10) {
    //     console.log('CHECK BUFFER',resBuffer[0],resBuffer[1],resBuffer[1]=='03');

    //     if(resBuffer[1]!='03') return;
    //     const slot = '00'; // relay number;
    //     let state = '00';// on 01 off
    //     const temp = this.getTemp(resBuffer).t;
    //     const hum = this.getTemp(resBuffer).h;
    //     if (temp >= maxTemp)
    //         state = '00';
    //     else if (temp <= minTemp)
    //         state = '01'
    //     this.command('relaycommand', { slot, state }, -1)
    // }
    // getTemp(buff: string) {
    //     return { t: 10, h: 0.5 }
    // }
 
    command(command: EZDM8_COMMAND, params: any, transactionID: number) {
        return new Promise<any>((resolve,reject)=>{
            this.commands.push({
                command,
                params,
                transactionID
            })
            resolve(true)
        })
       
    }
    commandVMC(command: EVMC_COMMAND, params: any, transactionID: number, series = 0) {
        this.transactionID = transactionID;
        return new Promise<IResModel>((resolve, reject) => {
            const series = params.series;
            const slot = params.slot;
            //STX
            //Command
            // Length
            // PackNO+Text
            //XOR
            const buff = ['fa', 'fb'];
            // // POLL command
            if (command == EVMC_COMMAND._41) {
                buff.push(command);
                buff.push('00'); // default length 00
                buff.push(chk8xor(buff))
            }
            //// Upper computer selects to buy
            else if (command == EVMC_COMMAND._03) {
                buff.push(command);
                const x = [series].concat(params.map(v => int2hex(v)))
                buff.push(int2hex(x.length));//length
                // p.push(parseInt(p.length+'', 16));
                buff.push(int2hex(series));// 
                buff.push(slot);// slot 
                buff.push(chk8xor(buff))
            }
            // //temperature
            else if (command == EVMC_COMMAND._28) {// 0x28
                buff.push(command);
                const x = [series].concat(params.map(v => int2hex(v)))
                buff.push(int2hex(x.length));//length
                buff.push('01');// read drop sensor
                buff.push(...params)
                // enable drop sensor [0x00,0x00,0x01] 
                // disable drop sensor [0x00,0x00,0x00] 
                buff.push(chk8xor(buff))
            }
            /// dispensing
            // else if (command == 0x06) {
            //     buff.push(command);
            //     buff.push(0x05);//length
            //     // p.push(parseInt(p.length+'', 16));
            //     buff.push(series);// default communication number
            //     buff.push(0x01);// text communication number 
            //     buff.push(0x01) // enable drop sensor
            //     buff.push(0x00) // disable elavator
            //     buff.push(...params);// select slot
            //     buff.push(chk8xor(buff))
            // }
            // // check drop sensor
            // else if (command == '') {
            //     buff.push(command);
            //     buff.push(0x05);//length
            //     // p.push(parseInt(p.length+'', 16));
            //     buff.push(series);// default communication number
            //     buff.push(0x00);// read drop sensor
            //     buff.push(...params) // enable drop sensor
            //     buff.push(chk8xor(buff))
            // }
            // /// set drop sensor
            // else if (command == '24') {//0x24
            //     buff.push(command);
            //     buff.push(0x05);//length
            //     // p.push(parseInt(p.length+'', 16));
            //     buff.push(series);// default communication number
            //     buff.push(0x01);// read drop sensor
            //     buff.push(...params) // enable drop sensor [0x00,0x00,0x01] 
            //     // disable drop sensor [0x00,0x00,0x00] 
            //     buff.push(chk8xor(buff))
            // }
            // //temperature
            // else if (command =='28') {// 0x28
            //     buff.push(command);
            //     buff.push(0x02);//length
            //     // p.push(parseInt(p.length+'', 16));
            //     buff.push(series);// default communication number
            //     buff.push(0x01);// read drop sensor
            //     buff.push(...params)
            //     // enable drop sensor [0x00,0x00,0x01] 
            //     // disable drop sensor [0x00,0x00,0x00] 
            //     buff.push(chk8xor(buff))
            // }
            // //temperature
            // else if (command == '51') { // 0x51
            //     buff.push(command);
            //     buff.push(0x01);//length
            //     buff.push(series);// default communication number
            //     // enable drop sensor [0x00,0x00,0x01] 
            //     // disable drop sensor [0x00,0x00,0x00] 
            //     buff.push(chk8xor(buff))
            // }
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
            const x = buff.join('');
            console.log('X',x);
            
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
