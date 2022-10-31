import axios from 'axios';

import { EMessage, EVMC_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';

import { SerialPort } from 'serialport'


import { broadCast, chk8xor, initWs, int2hex, PrintError, PrintSucceeded, wsSendToClient } from '../services/service';
import xor from 'buffer-xor'
import { SocketClientVMC } from './socketClient.vmc';
import { resolve } from 'path';

export class VendingVMC {

    // port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 57600 }, function (err) {
    port:SerialPort;
    sock: SocketClientVMC | null = null
    transactionID=new Array<number>();
    path = '/dev/ttyS1';
    commands = Array<Array<string>>();
    isACK=false;
     retry=5;
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
     
     
        this.port =new SerialPort({ path: this.path, baudRate: 57600 }, function (err) {
            if (err) {
                return console.log('Error: ', err.message)
            }
            console.log(`port ${that.path} accessed`);
        
            var b = '';
            that.sycnVMC();
            that.port.on('data', function (data: any) {
                b = data.toString('hex');
                console.log('===>BUFFER', b);
                let buff = that.checkCommandsForSubmission()||Array<string>();
                if (b == 'fafb410040'&&buff.length) {// POLL and submit command
        
                        let x = buff.join('');
                        console.log('X command',new Date().getTime(), x,(Buffer.from(x, 'hex')));
                        that.port.write(Buffer.from(x, 'hex'), (e) => {
                            if (e) {
                                console.log('Error command', e.message);
                                that.sock?.send(x,that.transactionID[0]);
                            } else {
                                console.log('WRITE COMMAND succeeded',new Date().getTime());
                                that.sock?.send(x,that.transactionID[0]);
                                // confirm by socket
                            }
                        })
                        that.retry--;
                    if(that.retry<=0){
                        that.commands.shift();
                        that.sock?.send(b, that.clearTransactionID());
                    }
                }
                else if(b=='fafb420043'){// ACK 
                    that.retry=5;
                    console.log('ACK COMMAND FROM VMC and it has to send to the server with current transactionID');
                    console.log('shift the current command and add new command for demo');
                    that.commands.shift();
                    that.sock?.send(b, that.clearTransactionID());
                    // that.commands.push(['fa', 'fb', '06', '05',int2hex(getNextNo()),'01','00','00','01']);
                }
                // else if(b == 'fafb410040') {// POLL only with no commands in the queue
                //     buff = that.getACK();
                //     let x = buff.join('')
                //     console.log('X ACK', x,(Buffer.from(x, 'hex')));
                //     that.port.write(Buffer.from(x, 'hex'), (e) => {
                //         if (e) {
                //             console.log('Error: ACK ', e.message);
                //         } else {
                //             console.log('write ACK succeeded');
                //         }
                //     })
                // }
                else{
                    // update status to the server
                    buff = that.getACK();
                    let x = buff.join('')
                    console.log('X ACK', x,(Buffer.from(x, 'hex')));
                    that.port.write(Buffer.from(x, 'hex'), (e) => {
                        if (e) {
                            console.log('Error: ACK ', e.message);
                        } else {
                            console.log('write ACK succeeded');
                        }
                    })
                    that.sock?.send(b,-1);
                }
                b='';
            });
        });
        // setInterval(() => {
        //     this.coolingSystemTask();
        // }, 30000)

    }
    sycnVMC(){
        let buff = ['fa', 'fb'];
        buff.push('31');
        buff.push('01'); // default length 00
        buff.push('01'); 
        buff.push('00'); 
        buff[buff.length-1]=chk8xor(buff)
        let x = buff.join('')
        this.port.write(Buffer.from(x, 'hex'), (e) => {
            if (e) {
                console.log('Error: ACK ', e.message);
            } else {
                console.log('write ACK succeeded');
            }
        })
        ;
    }
    clearTransactionID(){
        const x = this.transactionID.length?this.transactionID.shift():-1;
        return x!=undefined?x:-1;
    }
    getTransactionID(){
        return this.transactionID.length?this.transactionID[0]:-1
    }
     getACK() {
      
        let buff = ['fa', 'fb'];
        buff.push('42');
        buff.push('00'); // default length 00
        buff.push('00'); 
        buff[buff.length-1]=chk8xor(buff)
        return buff;
    }
     no=0;
     getNextNo(){
        this.no++;
        if(this.no>=255){
            this.no=0;
        }
        return this.no;
    }

  
     checkCommandsForSubmission() {
        let x =Array<string>();
        try {
            x= JSON.parse(JSON.stringify(this.commands[0]))as Array<string>;
            x.push('00')
            x[x.length-1]=chk8xor(x)
        } catch (error) {
            console.log('ERROR NO COMMAND FOUND');
            
        }
       
        return x;
    }
     int2hex(i: number) {
        const str = Number(i).toString(16);
        return str.length === 1 ? '0' + str : str;
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
         switch (command) {
            case EZDM8_COMMAND.shippingcontrol:
                this.commandVMC(EVMC_COMMAND._06,params,transactionID,this.getNextNo()).then(r=>{
                    resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                }).catch(e=>{
                    reject(PrintError(command as any, params,e.message));
                })
                break;
         
            default:
                reject(PrintError(command as any, params,EMessage.commandnotfound));
                break;
         }
        })
       
    }
    commandVMC(command: EVMC_COMMAND, params: any, transactionID: number, series = 1) {
        this.transactionID.push(transactionID);
        return new Promise<IResModel>((resolve, reject) => {
            const slot = params.slot;
            //STX
            //Command
            // Length
            // PackNO+Text
            //XOR
            const buff = ['fa', 'fb'];
            // fafb
            // 06 // command
            // 05 // length
            // 04 // series
            // 01 // enable drop sensor
            // 00 // enable elevator
            // 00 // selection
            // 01 // selection
            // 0701 // chk
            // fafb0605040100000106
            // fafb0605020100000100
            // fafb0605020100000100
            // PackNO+
            // Text Communication number+
            // Enable drop sensor or not(1 byte) +
            //  Enable elevator or not (1 byte) 
            //  selection number (2 byte)
             if (command == EVMC_COMMAND._06) {
                buff.push(command);
                buff.push(int2hex(5));//length
                // p.push(parseInt(p.length+'', 16));
                buff.push(int2hex(series));// 
                buff.push(int2hex(1));// enable drop sensor
                buff.push(int2hex(0));// enable elevator
                buff.push(int2hex(0));// slot 
                buff.push(int2hex(slot));// slot 
                buff.push(int2hex(0));// checksum
                buff[buff.length-1]=chk8xor(buff);// update checksum
                // that.commands.push(['fa', 'fb', '06', '05',int2hex(getNextNo()),'01','00','00','01']);
            }
            // //temperature
            // else if (command == EVMC_COMMAND._28) {// 0x28
            //     buff.push(command);
            //     const x = [series].concat(params.map(v => int2hex(v)))
            //     buff.push(int2hex(x.length));//length
            //     buff.push('01');// read drop sensor
            //     buff.push(...params)
            //     // enable drop sensor [0x00,0x00,0x01] 
            //     // disable drop sensor [0x00,0x00,0x00] 
            //     buff.push(chk8xor(buff))
            // }
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

