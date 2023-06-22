import axios from 'axios';

import { EMACHINE_COMMAND, EMessage, EVMC_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';

import { SerialPort } from 'serialport'


import { broadCast, chk8xor, initWs, int2hex, PrintError, PrintSucceeded, writeErrorLogs, writeSucceededRecordLog, wsSendToClient } from '../services/service';
import xor from 'buffer-xor'
import { SocketClientVMC } from './socketClient.vmc';
import { resolve } from 'path';
import moment from 'moment';

export class VendingVMC {

    // port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 57600 }, function (err) {
    port: SerialPort;
    sock: SocketClientVMC | null = null
    path = '/dev/ttyS1';
    commands = Array<{ b: Buffer, transactionID: number }>();
    retry = 5;
    enable = false;
    limiter = 100000;
    balance = 0;
    lastupdate = 0;
    constructor(sock: SocketClientVMC) {
        this.sock = sock;

        const that = this;


        this.port = new SerialPort({ path: this.path, baudRate: 57600 }, function (err) {
            if (err) {
                return console.log('Error: ', err.message)
            }
            console.log(`port ${that.path} accessed`);
            that.sycnVMC();
            that.setPoll();
            setTimeout(() => {
                console.log('INITIALIZE.............................................................!');
                console.log('INIT 51');
                that.commandVMC(EVMC_COMMAND._51, {}, -51, that.getNextNo());
                console.log('INIT 7001');
                that.commandVMC(EVMC_COMMAND._7001, {}, -7001, that.getNextNo());
                console.log('INIT 7001');
                that.commandVMC(EVMC_COMMAND._7017, {}, -7017, that.getNextNo());
                console.log('INIT 7018');
                that.commandVMC(EVMC_COMMAND._7018, {}, -7018, that.getNextNo());
                console.log('INIT 7019');
                that.commandVMC(EVMC_COMMAND._7019, {}, -7019, that.getNextNo());
                console.log('INIT 7020');
                that.commandVMC(EVMC_COMMAND._7020, {}, -7020, that.getNextNo());
                console.log('INIT 7023');
                that.commandVMC(EVMC_COMMAND._7023, {}, -7023, that.getNextNo());

                console.log('INIT enable');
                that.commandVMC(EVMC_COMMAND.enable, {}, -701801, that.getNextNo());
            }, 2000);
            var b = '';

            setInterval(() => {
                console.log('check last update ', moment.now(), that.lastupdate);

                if (moment().diff(that.lastupdate) >= 7000) {
                    if (!that.enable) return;
                    // that.commandVMC(EVMC_COMMAND.disable,{},-18);
                    that.enable = false;
                    return;
                }
            }, 1000)
            that.port.on('data', function (data: any) {
                b = data.toString('hex');
                console.log('===>BUFFER', b);
                let buff = that.checkCommandsForSubmission();
                if (b == 'fafb410040' && buff != null) {// POLL and submit command

                    console.log('X command', buff);
                    that.port.write(buff.b, (e) => {
                        if (e) {
                            console.log('Error command', e.message);
                            that.sock?.send(buff?.b.toString("hex"), -5);
                        } else {
                            console.log('WRITE COMMAND succeeded', new Date().getTime());
                            that.sock?.send(buff?.b.toString("hex"), -6);
                            // confirm by socket
                        }
                    })
                    that.retry--;
                    if (that.retry <= 0) {
                        const t = that.clearTransactionID();
                        that.sock?.send(b, -1);
                    }


                }
                else if (b == 'fafb420043') {// ACK 
                    that.retry = 5;
                    console.log('ACK COMMAND FROM VMC and it has to send to the server with current transactionID');
                    console.log('shift the current command and add new command for demo');
                    const t = that.clearTransactionID();
                    that.sock?.send(b, t?.transactionID || -2);
                    // that.commands.push(['fa', 'fb', '06', '05',int2hex(getNextNo()),'01','00','00','01']);
                }
                else if (b.startsWith('fafb0405')) {// drop sensor
                    //FA FB 04 05 packNo 03 00 19
                    console.log('drop detect', b);
                    // Command (0x71)
                    // Length (1 byte)
                    // PackNO+Text
                    // Communication number+Command type(0x72)+Operation type(0x01) +Test status(0- Successful, 1-failed)
                    that.sock?.send(b, -9);
                    writeSucceededRecordLog(b, -1);
                }
                else if (b.startsWith('fafb21')) {// receive banknotes
                    console.log('receive banknotes', b);
                    //10RMB :  FA FB 21 06 packNo 01 00 00 03 e8 CRC
                    //20RMB :  FA FB 21 06 packNo 01 00 00 07 d0 CRC

                    console.log('ACK COMMAND FROM VMC and it has to send to the server with current transactionID');
                    console.log('shift the current command and add new command for demo');

                    that.sock?.send(b, -11, EMACHINE_COMMAND.CREDIT_NOTE);
                    writeSucceededRecordLog(b, -1);
                    // 4.1.1 VMC receives money and notifies upper computer (VMC sends out)
                    // Mode: 1: Bill 2: Coin 3: IC card 4: Bank card 5: Wechat payment 6: Alipay 7: Jingdong Pay 8: Swallowing money 9: Union scan pay
                    // If mode is 3 IC card or 4 Bank card, VMC needs to send card number.
                    // Upper computer’s current amount has nothing to do with the VMC money notification. The VMC money notification is used for sending data to background system.
                    // The upper computer returns ACK after it receives the data.
                    // Command (0x21)
                    // Length 6(1 byte)
                    // PackNO+Text
                    // Communication Number (1 byte)+Mode (1 byte)+Amount (4 byte)+Card Number (when Mode is 3 or 4)

                } else if (b.startsWith('fafb71')) {
                    //FA FB 70 len packNO 18 01 00 crc 
                    // FA FB 70 len packNO 18 01 C8 crc 
                    writeSucceededRecordLog(b, -1);
                }
                else if (b != 'fafb410040') {// POLL only with no commands in the queue

                    let x = that.getACK().join('')
                    console.log('X ACK', x, (Buffer.from(x, 'hex')));
                    that.port.write(Buffer.from(x, 'hex'), (e) => {
                        if (e) {
                            console.log('Error: ACK ', e.message);
                            writeErrorLogs(b, e);
                        } else {
                            console.log('write ACK succeeded');
                            writeSucceededRecordLog(b, -1);
                        }
                        that.sock?.send(b, -3);
                    })
                }
                // else{
                //     // update status to the server
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
                //     that.sock?.send(b,-1);
                // }
                b = '';
            });


        });
        // setInterval(() => {
        //     this.coolingSystemTask();
        // }, 30000)

    }

    sycnVMC() {
        //FA FB 31 01 02 33
        this.commandVMC(EVMC_COMMAND.sync, {}, -31);
    }
    setPoll(ms: number = 3) {
        this.commandVMC(EVMC_COMMAND.setpoll, { ms: 3 }, -16);
    }
    clearTransactionID() {
        return this.commands.length ? this.commands.shift() : null;
    }

    getACK() {

        let buff = ['fa', 'fb'];
        buff.push('42');
        buff.push('00'); // default length 00
        buff.push('00');
        buff[buff.length - 1] = chk8xor(buff)
        return buff;
    }
    no = 0;
    getNextNo() {
        this.no++;
        if (this.no >= 255) {
            this.no = 0;
        }

        return this.no;
    }
    writeConfig() {

    }

    checkCommandsForSubmission() {
        try {
            return this.commands[0];
        } catch (error) {
            console.log('ERROR NO COMMAND FOUND');

        }

        return null;
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
        return new Promise<any>((resolve, reject) => {
            switch (command) {
                case EZDM8_COMMAND.shippingcontrol:
                    this.commandVMC(EVMC_COMMAND._06, params, transactionID, this.getNextNo()).then(r => {
                        resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                    }).catch(e => {
                        reject(PrintError(command as any, params, e.message));
                    })
                    break;
                case EZDM8_COMMAND.balance:
                    this.balance = params?.balance || 0;
                    this.limiter = params?.limiter || 100000;
                    this.lastupdate = moment.now();
                    // if(this.balance<this.limiter){
                    //     this.lastupdate = moment().add(-360,'days').milliseconds();
                    //     if(!this.enable) return resolve(PrintSucceeded(command as any, params,''));
                    //     this.enable=false;
                    //     this.commandVMC(EVMC_COMMAND.disable, params, transactionID, this.getNextNo()).then(r => {
                    //         resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                    //     }).catch(e => {
                    //         reject(PrintError(command as any, params, e.message));
                    //     })
                    // }else{
                    //     if(this.enable) return resolve(PrintSucceeded(command as any, params,''));
                    //     this.enable=true;
                    //     this.commandVMC(EVMC_COMMAND.enable, params, transactionID, this.getNextNo()).then(r => {
                    //         resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                    //     }).catch(e => {
                    //         reject(PrintError(command as any, params, e.message));
                    //     })
                    // }

                    break;

                case EZDM8_COMMAND.hutemp:

                    break;

                case EZDM8_COMMAND.status:

                    break;

                case EZDM8_COMMAND.dropdetectstatus:

                    break;

                case EZDM8_COMMAND.relaycommand:

                    break;

                default:
                    reject(PrintError(command as any, params, EMessage.commandnotfound));
                    break;
            }
        })

    }
    commandVMC(command: EVMC_COMMAND, params: any, transactionID: number, series = 1) {

        return new Promise<IResModel>((resolve, reject) => {
            const slot = params?.slot;
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
                buff[buff.length - 1] = chk8xor(buff);// update checksum
                // that.commands.push(['fa', 'fb', '06', '05',int2hex(getNextNo()),'01','00','00','01']);
            }
            else if (command == EVMC_COMMAND.enable) {
                // FA FB 70 len packNO 18 01 C8 crc 
                // FA FB 70 03 44 19 00 2F
                // FA FB 70 04 47 01 00 00 33
                buff.push('70');
                buff.push(int2hex(4));//length
                // p.push(parseInt(p.length+'', 16));
                buff.push(int2hex(series));// 
                buff.push(int2hex(18));// 
                buff.push(int2hex(1));// 
                buff.push(int2hex(100));//?
                buff.push(int2hex(0));// checksum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            else if (command == EVMC_COMMAND.disable) {
                //FA FB 70 len packNO 18 01 00 crc 
                buff.push('70');
                buff.push(int2hex(4));//length
                buff.push(int2hex(series));// 
                buff.push(int2hex(18));// 
                buff.push(int2hex(1));// ?
                buff.push(int2hex(0));// ?
                buff.push(int2hex(0));// checksum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
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
            /// check machine status
            else if (command == EVMC_COMMAND._51) {
                buff.push(command);
                buff.push(int2hex(1));//length
                buff.push(int2hex(series));// 
                buff.push(int2hex(0));// checksum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // // c

            else if (command == EVMC_COMMAND._61) {
                buff.push(command);
                buff.push(int2hex(1));
                buff.push(int2hex(series));// 
                buff.push(int2hex(0));// checksum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // coin system setting
            else if (command == EVMC_COMMAND._7001) {
                //FA FB 70 04 47 01 00 00 33
                buff.push('70');// 70 
                buff.push(int2hex(4));// 04 len
                buff.push(int2hex(series));// // 47 series
                buff.push(int2hex(1));//// coin system setting
                buff.push(int2hex(0));// 00 read coin system type, 01 set coin system type
                buff.push(int2hex(0));// 01  coin acceptor 02  hopper
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // Enable Unionpay/POS
            else if (command == EVMC_COMMAND._7017) {
                //FA FB 70 03 42 17 00 27 
                buff.push('70');// 70 
                buff.push(int2hex(3));// 03 len
                buff.push(int2hex(series));// // 42 series
                buff.push(int2hex(17));//// 17  Enable Unionpay/POS
                buff.push(int2hex(0));// 00  read 01  set
                // buff.push(int2hex(2));// 00  enable 02  disable
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // Bill Value Accepted Setting
            else if (command == EVMC_COMMAND._7018) {
                //FA FB 70 03 45 18 00 2F 
                buff.push('70');// 70 
                buff.push(int2hex(3));// 03 len
                buff.push(int2hex(series));// // 45 series
                buff.push(int2hex(18));//// 18  
                buff.push(int2hex(0));// 00  read bill value 01 set value
                // buff.push(int2hex(100));//01-100 set bill value accepted
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // Bill accepting mode
            else if (command == EVMC_COMMAND._7019) {
                //FA FB 70 03 44 19 00 2F 
                buff.push('70');// 70 
                buff.push(int2hex(3));// 03 len
                buff.push(int2hex(series));// // 44 series
                buff.push(int2hex(19));//// 19 
                buff.push(int2hex(0));// 00  read Bill accepting mode 
                // buff.push(int2hex(1));// 01 always accept , 02 hold credit temperary, 03 force vend
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // Bill Low-change Setting
            else if (command == EVMC_COMMAND._7020) {
                //FA FB 70 03 46 20 00 14
                buff.push('70');// 70 
                buff.push(int2hex(3));// 03 len
                buff.push(int2hex(series));// // 46 series
                buff.push(int2hex(20));//// 20 
                buff.push(int2hex(0));// 00  read 01 set value
                // buff.push(int2hex(1));// Low change: Range 0-100
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // Bill Low-change Setting
            else if (command == EVMC_COMMAND._7023) {
                //FA FB 70 03 43 23 00 12 
                buff.push('70');// 70 
                buff.push(int2hex(3));// 03 len
                buff.push(int2hex(series));// // 46 series
                buff.push(int2hex(23));//// 23
                buff.push(int2hex(0));// 00  read 01 set value
                // buff.push(int2hex(1));// 01 holding , 02 return change 03 change first holding later
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            else if (command == EVMC_COMMAND.sync) {
                buff.push('31');
                buff.push(this.int2hex(1)); // default length 01
                this.no = 0;
                buff.push(this.int2hex(this.getNextNo()));
                buff.push(this.int2hex(0));
                buff[buff.length - 1] = chk8xor(buff)
            }
            else if (command == EVMC_COMMAND.setpoll) {
                buff.push('16');
                buff.push(this.int2hex(2)); // default length 01
                buff.push(this.int2hex(this.getNextNo()));
                buff.push(this.int2hex(params.ms));
                buff.push(this.int2hex(0));
                buff[buff.length - 1] = chk8xor(buff)
            }


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
            this.commands.push({ b: Buffer.from(x, 'hex'), transactionID })
            // const x = buff.join('');
             console.log('X', x,transactionID);
            // this.port.write(Buffer.from(x, 'hex'), (e) => {
            //     if (e) {
            //         reject(PrintError(command as any, params, e.message));
            //         return console.log('Error: ', e.message)
            //     } else {
            //         resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
            //     }
            // })
        })

    }
    close() {
        this.port.close((e) => {
            console.log('closing', e);
        })
    }
}

