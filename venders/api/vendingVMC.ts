import axios from 'axios';

import { EMACHINE_COMMAND, EMessage, EVMC_COMMAND, EZDM8_COMMAND, IReqModel, IResModel } from '../entities/syste.model';

import { SerialPort } from 'serialport'


import { broadCast, chk8xor, clearLogsDays, initWs, int2hex, loadLogsDays, PrintError, PrintSucceeded, writeErrorLogs, writeLogs, wsSendToClient } from '../services/service';
import xor from 'buffer-xor'
import { SocketClientVMC } from './socketClient.vmc';
import { resolve } from 'path';
import moment, { duration } from 'moment';
import cryptojs from 'crypto-js'
export class VendingVMC {

    // port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 57600 }, function (err) {
    port: SerialPort;
    sock: SocketClientVMC | null = null
    path = '/dev/ttyS1';
    commands = Array<{ b: Buffer, transactionID: number }>();
    retry = 5;
    enable = true;
    limiter = 100000;
    balance = 0;
    lastupdate = 0;
    setting = { settingName: 'setting', allowCashIn: false, allowVending: true, lowTemp: 5, highTemp: 10, light: true };//{settingName:string,allowCashIn:boolean,allowVending:boolean}
    logduration = 15;
    countProcessClearLog = 60 * 60 * 24;

    constructor(sock: SocketClientVMC) {
        this.sock = sock;

        const that = this;


        this.port = new SerialPort({ path: this.path, baudRate: 57600 }, function (err) {
            if (err) {
                return console.log('Error: ', err.message)
            }
            console.log(`port ${that.path} accessed`);
            that.sycnVMC();
            that.setPoll(10);
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
                console.log('INIT accept banknote');
                that.commandVMC(EVMC_COMMAND._28, {}, -28, that.getNextNo());
                // setTimeout(() => {
                //     console.log('INIT disable');
                //     that.commandVMC(EVMC_COMMAND.disable, {}, -701800, that.getNextNo());
                // }, 30000);
                // console.log('INIT disable');
                // that.commandVMC(EVMC_COMMAND.disable, {}, -701800, that.getNextNo());
            }, 2000);
            var b = '';

            setTimeout(() => {
                setInterval(() => {
                    console.log('check last update ', moment.now(), that.lastupdate, moment().diff(that.lastupdate));

                    if (moment().diff(that.lastupdate) >= 7000 || !that.setting?.allowCashIn) {
                        if (!that.enable) return;
                        that.commandVMC(EVMC_COMMAND.disable, {}, -118);
                        that.enable = false;
                        return;
                    }
                    if (that.countProcessClearLog <= 0) {
                        that.countProcessClearLog = 60 * 60 * 24;
                    } else {
                        clearLogsDays();
                        that.countProcessClearLog -= 2;
                    }

                }, 2000);
            }, 7000);

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
                    const t = that.clearTransactionID();
                    that.sock?.send(b, t?.transactionID || -2);
                }
                else if (b.startsWith('fafb04')) {// drop sensor
                    //FA FB 04 05 packNo 03 00 19
                    console.log('drop detect', b);
                    that.sock?.send(b, -9);
                    writeLogs(b, -1);
                }
                else if (b.startsWith('fafb21')) {// receive banknotes
                    console.log('receive banknotes 21', b);
                    // fafb2106ee01 00000002 cb
                    // fafb2106f501 00000002 d0
                    // fafb21061008 00000002 3c
                    // fafb2106d501 000186a0 d5 == 100000 == 1000,00
                    // fafb21069101 000186a0 91 == 100000 == 1000,00
                    // fafb2106c301 00030d40 aa == 200000 == 2000,00
                    // fafb21065401 0007a120 f5 == 500000 == 5000,00
                    // fafb21065701 000f4240 7d == 1000000 == 10000,00
                    // fafb21064a01 000f4240 60
                    // fafb21060701 001e8480 3a == 2000000 == 20000,00
                    // fafb2106bf01 001e8480 82
                    // fafb21066001 004c4b40 00 == 5000000 == 50000,00
                    // new 50k not working
                    // fafb21067c01 00989680 d5 == 10000000 == 100000,00
                    // new 100k not working
                    that.sock?.send(cryptojs.SHA256(that.sock.machineid + that.getNoteValue(b)).toString(cryptojs.enc.Hex), -11, EMACHINE_COMMAND.CREDIT_NOTE);
                    writeLogs(b, -1);

                }
                else if (b.startsWith('fafb23')) {// receive banknotes
                    console.log('receive banknotes 23-----------------------------------------------------------------------------', b);
                    // fafb23052e
                    // 0098968087 100k
                    // fafb2305d0
                    // 00e4e1c032 50k
                    // fafb230529
                    // 00e4e1c0cb 20k
                    // fafb2305b1
                    // 00e4e1c053 10k
                    // fafb2305f9
                    // 00e4e1c01b 5k
                    // fafb23056f
                    // 00e4e1c08d 2k
                    // fafb2305bc
                    // 00e6686075 1k 
                    // fafb23055c
                    // 00e7ef0073 

                    // that.sock?.send(b, -23, EMACHINE_COMMAND.CREDIT_NOTE);
                    writeLogs(b, -1);


                }
                else if (b.startsWith('fafb71')) {
                    //FA FB 70 len packNO 18 01 00 crc 
                    // FA FB 70 len packNO 18 01 C8 crc 
                    // writeLogs(b, -1);

                }
                else if (b.startsWith('fafb52')) {
                    // report status to the server
                    console.log('SEND REPORT',b);
                    
                    that.sock?.send(b, -52);

                }


                if (b != 'fafb410040' && b != 'fafb420043') {// POLL only with no commands in the queue

                    let x = that.getACK().join('')
                    console.log('X ACK', x, (Buffer.from(x, 'hex')));
                    that.port.write(Buffer.from(x, 'hex'), (e) => {
                        if (e) {
                            console.log('Error: ACK ', e.message);
                            // writeErrorLogs(b, e);
                        } else {
                            console.log('write ACK succeeded');
                            // writeLogs(b, -1);
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
    getNoteValue(b: string) {
        try {
            return this.hex2dec(b?.substring(12, 20));
        } catch (error) {
            return -1;
        }

    }
    hex2dec(hex: string) {
        try {
            return parseInt(hex, 16);
        } catch (error) {
            return -1;
        }

    }
    
    sycnVMC() {
        //FA FB 31 01 02 33
        this.commandVMC(EVMC_COMMAND.sync, {}, -31);
    }
    setPoll(ms: number = 3) {
        this.commandVMC(EVMC_COMMAND.setpoll, { ms }, -16);
    }
    clearTransactionID() {
        return this.commands.length ? this.commands.shift() : null;
    }
    // getCashACK() {

    //     let buff = ['fa', 'fb'];
    //     buff.push('23');
    //     buff.push(this.int2hex(1));
    //     buff.push(this.int2hex(this.getNextNo())); // default length 00
    //     buff.push(this.int2hex(0));
    //     buff[buff.length - 1] = chk8xor(buff)
    //     // fa fb 23 01 pckno crc
    //     return buff;
    // }
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
                    
                    if (this.balance < this.limiter||!this.setting.allowCashIn) {
                        this.lastupdate = moment().add(-360, 'days').milliseconds();
                        if (!this.enable) return resolve(PrintSucceeded(command as any, params, ''));
                        this.enable = false;
                        this.commandVMC(EVMC_COMMAND.disable, params, transactionID, this.getNextNo()).then(r => {
                            resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                        }).catch(e => {
                            reject(PrintError(command as any, params, e.message));
                        })
                    } else {
                        if (this.enable) return resolve(PrintSucceeded(command as any, params, ''));
                        this.enable = true;
                        this.commandVMC(EVMC_COMMAND.enable, params, transactionID, this.getNextNo()).then(r => {
                            resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                        }).catch(e => {
                            reject(PrintError(command as any, params, e.message));
                        })
                    }

                    if (Array.isArray(params?.setting)) {
                        try {
                            //temp 
                        const setting = params.setting.find(v=>v.settingName=='setting');
                        if (setting.lowTemp != this.setting.lowTemp || setting.highTemp != this.setting.highTemp||setting.allowCashIn!=this.setting.allowCashIn) {
                            this.setting =setting;
                            // this.setting.allowCashIn=false;
                            console.log('new setting',this.setting);
                            
                            this.commandVMC(EVMC_COMMAND._7036, params, transactionID, this.getNextNo()).then(r => {
                                resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                            }).catch(e => {
                                reject(PrintError(command as any, params, e.message));
                            })
                        }
                        // light

                        // if (setting.light != this.setting.light) {

                        //     this.setting.light == setting.light;
                        //     this.commandVMC(EVMC_COMMAND._7016, params, transactionID, this.getNextNo()).then(r => {
                        //         resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                        //     }).catch(e => {
                        //         reject(PrintError(command as any, params, e.message));
                        //     })
                        // }
                        } catch (error) {
                            console.log(error);
                            
                        }
                        


                    }

                    break;
                case EZDM8_COMMAND.logs:
                    const duration = params?.duration || 15;

                    for (let index = 0; index < duration; index++) {
                        setTimeout(() => {
                            const i = loadLogsDays();
                            this.sock?.send(i, -3600, EMACHINE_COMMAND.logs);
                        }, index * 5000);

                    }


                    break;
                case EZDM8_COMMAND.hutemp:

                    break;

                case EZDM8_COMMAND.status:

                    break;

                case EZDM8_COMMAND.dropdetectstatus:

                    break;

                case EZDM8_COMMAND.relaycommand:

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
                buff.push('18');// 
                buff.push(int2hex(1));// 
                buff.push(int2hex(200));//?
                buff.push(int2hex(0));// checksum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            else if (command == EVMC_COMMAND.disable) {
                //FA FB 70 len packNO 18 01 00 crc 
                buff.push('70');
                buff.push(int2hex(4));//length
                buff.push(int2hex(series));// 
                buff.push('18');// 
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
                buff.push('01');//// coin system setting
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
                buff.push('17');//// 17  Enable Unionpay/POS
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
                buff.push('18');//// 18  
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
                buff.push('19');//// 19 
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
                buff.push('20');//// 20 
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
                buff.push('23');//// 23
                buff.push(int2hex(0));// 00  read 01 set value
                // buff.push(int2hex(1));// 01 holding , 02 return change 03 change first holding later
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // set sync
            else if (command == EVMC_COMMAND.sync) {
                buff.push('31');
                buff.push(this.int2hex(1)); // default length 01
                this.no = 0;
                buff.push(this.int2hex(this.getNextNo()));
                buff.push(this.int2hex(0));
                buff[buff.length - 1] = chk8xor(buff)
            }
            // set poll
            else if (command == EVMC_COMMAND.setpoll) {
                buff.push('16');
                buff.push(this.int2hex(2)); // default length 01
                buff.push(this.int2hex(series));
                buff.push(this.int2hex(params.ms));
                buff.push(this.int2hex(0));
                buff[buff.length - 1] = chk8xor(buff)
            }
            else if (command == EVMC_COMMAND._28) {
                buff.push('28');
                buff.push(this.int2hex(6)); //? 6
                buff.push(this.int2hex(series));
                buff.push(this.int2hex(0));
                buff.push('ff');
                buff.push('ff');
                buff.push(this.int2hex(0));
                buff[buff.length - 1] = chk8xor(buff)
            }
            // // 0x70
            // 0x36
            // 0x01+Machine number+Temperature controller parameters
            // Temperature controller parameters:
            // Lowest temperature(Range 0-60) 
            // Highest temperature (Range 0-60) 
            // Return difference value (Range 2-8) 
            // Delay Starting time (Range 0-8)
            // Sensor correction (Range -10-10) 
            // Defrosting period (Range 0-24 Hours) 
            // Defrosting time (Range 1-40 Minutes)
            // Protect (1-ON, 0-OFF)
            else if (command == EVMC_COMMAND._7036) {
                buff.push('70');// 70 
                buff.push(int2hex(12));// 04 len
                buff.push(int2hex(series));// // 47 series
                buff.push('36');//// temp setting
                buff.push(int2hex(1));// setting 1 or read 0
                buff.push(int2hex(0));// 0 as master 
                buff.push(int2hex(this.setting?.lowTemp)); // low temp (Range 0-60) 
                buff.push(int2hex(this.setting?.highTemp)); // Highest temperature (Range 0-60) 
                buff.push(int2hex(5)); // Return difference value (Range 2-8) 
                buff.push(int2hex(0)); // Delay Starting time (Range 0-8)
                buff.push(int2hex(0)); // Sensor correction (Range -10-10) 
                buff.push(int2hex(1)); // Defrosting period (Range 0-24 Hours) 
                buff.push(int2hex(10)); // Defrosting time (Range 1-40 Minutes)
                buff.push(int2hex(0)); // Protect (1-ON, 0-OFF)
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
            }
            // 0x70
            // 0x16
            // 0x01+ Start time+End time
            // Start time: Hour End time: Hour (For example.: 20-7, set the lights on from 20:00pm to 7:00am.)
            else if (command == EVMC_COMMAND._7016) {
                buff.push('70');// 70 
                buff.push(int2hex(5));// 04 len
                buff.push(int2hex(series));// // 47 series
                buff.push('16');//// light setting
                buff.push(int2hex(1));// 00 read coin system type, 01 set coin system type
                buff.push(int2hex(params.start||15));// 01  coin acceptor 02  hopper
                buff.push(int2hex(params.end||10));
                buff.push(int2hex(0));// 27 check sum
                buff[buff.length - 1] = chk8xor(buff);// update checksum
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
            console.log('X', x, transactionID);
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

