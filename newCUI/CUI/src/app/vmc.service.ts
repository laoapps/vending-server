import { Injectable } from '@angular/core';
import { IlogSerial, IreadingData } from './vending-index-service.service';
import { SerialServiceService, } from './services/serialservice.service';
import { IResModel, ESerialPortType, ISerialService, EMACHINE_COMMAND, ICreditData, ICreditDataDetails,EVMC_COMMAND, PrintSucceeded, PrintError, EMessage } from './services/syste.model';
import * as moment from 'moment-timezone';
import { LoggingService } from './logging-service.service';
import { DatabaseService } from './database.service';
import cryptojs from 'crypto-js';
import {  SerialPortListResult } from 'SerialConnectionCapacitor';



@Injectable({
  providedIn: 'root'
})
export class VmcService implements ISerialService {
  machineId: string = '11111111';
  otp = '111111';
  commands = Array<{ b: string, transactionID: number }>();
  retry = 5;
  enable = true;
  limiter = 100000;
  balance = 0;
  lastupdate = 0;
  setting = { settingName: 'setting', allowCashIn: false, allowVending: true, lowTemp: 5, highTemp: 10, light: true };//{settingName:string,allowCashIn:boolean,allowVending:boolean}
  logduration = 15;
  countProcessClearLog = 60 * 60 * 24;
  machinestatus = '';
  creditPending = new Array<ICreditData>();
  no = 0;
  pendingRetry = 10;// 10s

  portName = '/dev/ttyS0';
  braudRate = 57600;
  sock = {
    send: (b: string, t: number, c: EMACHINE_COMMAND = EMACHINE_COMMAND.status) => { console.log('send', b, t, c) }, machineId: '', otp: ''
  };


  constructor(private serialService: SerialServiceService, private loggingService: LoggingService, private dbService: DatabaseService) { }
  public async commandVMC(command: EVMC_COMMAND, params: any, transactionID: number, series = 1): Promise<IResModel> {
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
        buff.push(this.serialService.int2hex(5));//length
        // p.push(parseInt(p.length+'', 16));
        buff.push(this.serialService.int2hex(series));// 
        buff.push(this.serialService.int2hex(1));// enable drop sensor
        buff.push(this.serialService.int2hex(0));// enable elevator
        buff.push(this.serialService.int2hex(0));// slot 
        buff.push(this.serialService.int2hex(slot));// slot 
        buff.push(this.serialService.int2hex(0));// checksum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
        // that.commands.push(['fa', 'fb', '06', '05',int2hex(getNextNo()),'01','00','00','01']);
      }
      else if (command == EVMC_COMMAND.enable) {
        // FA FB 70 len packNO 18 01 C8 crc 
        // FA FB 70 03 44 19 00 2F
        // FA FB 70 04 47 01 00 00 33
        buff.push('70');
        buff.push(this.serialService.int2hex(4));//length
        // p.push(parseInt(p.length+'', 16));
        buff.push(this.serialService.int2hex(series));// 
        buff.push('18');// 
        buff.push(this.serialService.int2hex(1));// 
        buff.push(this.serialService.int2hex(200));//?
        buff.push(this.serialService.int2hex(0));// checksum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      else if (command == EVMC_COMMAND.disable) {
        //FA FB 70 len packNO 18 01 00 crc 
        buff.push('70');
        buff.push(this.serialService.int2hex(4));//length
        buff.push(this.serialService.int2hex(series));// 
        buff.push('18');// 
        buff.push(this.serialService.int2hex(1));// ?
        buff.push(this.serialService.int2hex(0));// ?
        buff.push(this.serialService.int2hex(0));// checksum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // //temperature
      // else if (command == EVMC_COMMAND._28) {// 0x28
      //     buff.push(command);
      //     const x = [series].concat(params.map(v => int2hex(v)))
      //     buff.push(this.serialService.int2hex(x.length));//length
      //     buff.push('01');// read drop sensor
      //     buff.push(...params)
      //     // enable drop sensor [0x00,0x00,0x01] 
      //     // disable drop sensor [0x00,0x00,0x00] 
      //     buff.push(chk8xor(buff))
      // }
      /// check machine status
      else if (command == EVMC_COMMAND._51) {
        buff.push(command);
        buff.push(this.serialService.int2hex(1));//length
        buff.push(this.serialService.int2hex(series));// 
        buff.push(this.serialService.int2hex(0));// checksum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // // c

      else if (command == EVMC_COMMAND._61) {
        buff.push(command);
        buff.push(this.serialService.int2hex(1));
        buff.push(this.serialService.int2hex(series));// 
        buff.push(this.serialService.int2hex(0));// checksum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // coin system setting
      else if (command == EVMC_COMMAND._7001) {
        //FA FB 70 04 47 01 00 00 33
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(4));// 04 len
        buff.push(this.serialService.int2hex(series));// // 47 series
        buff.push('01');//// coin system setting
        buff.push(this.serialService.int2hex(0));// 00 read coin system type, 01 set coin system type
        buff.push(this.serialService.int2hex(0));// 01  coin acceptor 02  hopper
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // Enable Unionpay/POS
      else if (command == EVMC_COMMAND._7017) {
        //FA FB 70 03 42 17 00 27 
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(3));// 03 len
        buff.push(this.serialService.int2hex(series));// // 42 series
        buff.push('17');//// 17  Enable Unionpay/POS
        buff.push(this.serialService.int2hex(0));// 00  read 01  set
        // buff.push(this.serialService.int2hex(2));// 00  enable 02  disable
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // Bill Value Accepted Setting
      else if (command == EVMC_COMMAND._7018) {
        //FA FB 70 03 45 18 00 2F 
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(3));// 03 len
        buff.push(this.serialService.int2hex(series));// // 45 series
        buff.push('18');//// 18  
        buff.push(this.serialService.int2hex(0));// 00  read bill value 01 set value
        // buff.push(this.serialService.int2hex(100));//01-100 set bill value accepted
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // Bill accepting mode
      else if (command == EVMC_COMMAND._7019) {
        //FA FB 70 03 44 19 00 2F 
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(3));// 03 len
        buff.push(this.serialService.int2hex(series));// // 44 series
        buff.push('19');//// 19 
        buff.push(this.serialService.int2hex(0));// 00  read Bill accepting mode 
        // buff.push(this.serialService.int2hex(1));// 01 always accept , 02 hold credit temperary, 03 force vend
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // Bill Low-change Setting
      else if (command == EVMC_COMMAND._7020) {
        //FA FB 70 03 46 20 00 14
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(3));// 03 len
        buff.push(this.serialService.int2hex(series));// // 46 series
        buff.push('20');//// 20 
        buff.push(this.serialService.int2hex(0));// 00  read 01 set value
        // buff.push(this.serialService.int2hex(1));// Low change: Range 0-100
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // Bill Low-change Setting
      else if (command == EVMC_COMMAND._7023) {
        //FA FB 70 03 43 23 00 12 
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(3));// 03 len
        buff.push(this.serialService.int2hex(series));// // 46 series
        buff.push('23');//// 23
        buff.push(this.serialService.int2hex(0));// 00  read 01 set value
        // buff.push(this.serialService.int2hex(1));// 01 holding , 02 return change 03 change first holding later
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      // set sync
      else if (command == EVMC_COMMAND.sync) {
        buff.push('31');
        buff.push(this.serialService.int2hex(1)); // default length 01
        this.no = 0;
        buff.push(this.serialService.int2hex(this.getNextNo()));
        buff.push(this.serialService.int2hex(0));
        buff[buff.length - 1] = this.serialService.chk8xor(buff)
      }
      // set poll
      else if (command == EVMC_COMMAND.setpoll) {
        buff.push('16');
        buff.push(this.serialService.int2hex(2)); // default length 01
        buff.push(this.serialService.int2hex(series));
        buff.push(this.serialService.int2hex(params.ms));
        buff.push(this.serialService.int2hex(0));
        buff[buff.length - 1] = this.serialService.chk8xor(buff)
      }
      else if (command == EVMC_COMMAND._28) {
        buff.push('28');
        buff.push(this.serialService.int2hex(6)); //? 6
        buff.push(this.serialService.int2hex(series));
        buff.push(this.serialService.int2hex(0));
        buff.push('ff');
        buff.push('ff');
        buff.push(this.serialService.int2hex(0));
        buff[buff.length - 1] = this.serialService.chk8xor(buff)
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
      else if (command == EVMC_COMMAND._7037) {
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(12));// 04 len
        buff.push(this.serialService.int2hex(series));// // 47 series
        buff.push('37');//// temp setting
        buff.push(this.serialService.int2hex(1));// setting 1 or read 0
        buff.push(this.serialService.int2hex(0));// 0 as master 
        buff.push(this.serialService.int2hex(this.setting?.lowTemp || 5)); // low temp (Range 0-60) 
        buff.push(this.serialService.int2hex(this.setting?.highTemp || 10)); // Highest temperature (Range 0-60) 
        buff.push(this.serialService.int2hex(5)); // Return difference value (Range 2-8) 
        buff.push(this.serialService.int2hex(0)); // Delay Starting time (Range 0-8)
        buff.push(this.serialService.int2hex(0)); // Sensor correction (Range -10-10) 
        buff.push(this.serialService.int2hex(1)); // Defrosting period (Range 0-24 Hours) 
        buff.push(this.serialService.int2hex(10)); // Defrosting time (Range 1-40 Minutes)
        buff.push(this.serialService.int2hex(0)); // Protect (1-ON, 0-OFF)
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
      }
      else if (command == EVMC_COMMAND._7028) {
        //FA FB 70 len packNo 28 01 00 02 05 crc
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(6));// 04 len
        buff.push(this.serialService.int2hex(series));// // 47 series
        buff.push('28');//// temp setting
        buff.push(this.serialService.int2hex(1));// setting 1 or read 0
        buff.push(this.serialService.int2hex(0));// 0 as master 
        buff.push(this.serialService.int2hex(2)); // refridgerator mode 1 heat , 2 refrigerator 3 constant 4 off
        buff.push(this.serialService.int2hex(this.setting?.lowTemp || 5)); // temperature
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
        // 0x01+Machine number+ Temperature controller working mode+ Temperature
      }
      // 0x70
      // 0x16
      // 0x01+ Start time+End time
      // Start time: Hour End time: Hour (For example.: 20-7, set the lights on from 20:00pm to 7:00am.)
      else if (command == EVMC_COMMAND._7016) {
        buff.push('70');// 70 
        buff.push(this.serialService.int2hex(5));// 04 len
        buff.push(this.serialService.int2hex(series));// // 47 series
        buff.push('16');//// light setting
        buff.push(this.serialService.int2hex(1));// 00 read coin system type, 01 set coin system type
        buff.push(this.serialService.int2hex(params.start || 15));// 01  coin acceptor 02  hopper
        buff.push(this.serialService.int2hex(params.end || 10));
        buff.push(this.serialService.int2hex(0));// 27 check sum
        buff[buff.length - 1] = this.serialService.chk8xor(buff);// update checksum
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
      this.commands.push({ b: x, transactionID })
      console.log('X', x, transactionID);
      resolve({ command, data: params, message: 'Command sent successfully' } as IResModel);

    })
  }
  command(command: EMACHINE_COMMAND, params: any, transactionID: number) {
    return new Promise<any>((resolve, reject) => {
      const that = this;
      switch (command) {
        case EMACHINE_COMMAND.shippingcontrol:
          this.commandVMC(EVMC_COMMAND._06, params, transactionID, this.getNextNo()).then(r => {
            resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
          }).catch(e => {
            reject(PrintError(command as any, params, e.message));
          })
          break;
        case EMACHINE_COMMAND.sync:
          this.commandVMC(EVMC_COMMAND.sync, params, transactionID, this.getNextNo()).then(r => {
            resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
          }).catch(e => {
            reject(PrintError(command as any, params, e.message));
          })
          break;
        case EMACHINE_COMMAND.enable:
          this.commandVMC(EVMC_COMMAND.enable, params, transactionID, this.getNextNo()).then(r => {
            resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
          }).catch(e => {
            reject(PrintError(command as any, params, e.message));
          })
          break;
        case EMACHINE_COMMAND.disable:
          this.commandVMC(EVMC_COMMAND.disable, params, transactionID, this.getNextNo()).then(r => {
            resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
          }).catch(e => {
            reject(PrintError(command as any, params, e.message));
          })
          break;
        case EMACHINE_COMMAND.balance:
          this.balance = params?.balance || 0;
          this.limiter = params?.limiter || 100000;
          this.lastupdate = moment.now();
          if (params?.confirmCredit) {
            const transactionID = params.transactionID;
            console.log('RECONFIRM BALANCE---------- WITH REMOVING CREDIT PENDING', params);
            const x = this.creditPending.find(v => v.transactionID == transactionID)
            if (x) {
              this.deleteCredit(x.id)
              this.creditPending = this.creditPending.filter(v => v.transactionID != transactionID);

            }
          }



          if (Array.isArray(params?.setting)) {
            try {
              //temp 
              const setting = params.setting.find(v => v.settingName == 'setting');
              if (setting.lowTemp != this.setting.lowTemp || setting.highTemp != this.setting.highTemp) {
                this.setting.lowTemp = setting.lowTemp;
                this.setting.highTemp = setting.highTemp;
                // this.setting.allowCashIn=false;
                console.log('new setting', this.setting);
                // that.command(EVMC_COMMAND._7037, {}, -7037, that.getNextNo());
                this.commandVMC(EVMC_COMMAND._7028, params, -7028, this.getNextNo()).then(r => {
                  resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                }).catch(e => {
                  reject(PrintError(command as any, params, e.message));
                })
              }
              // light

              // if (setting.light != this.setting.light) {

              //     this.setting.light == setting.light;
              //     this.command(EVMC_COMMAND._7016, params, transactionID, this.getNextNo()).then(r => {
              //         resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
              //     }).catch(e => {
              //         reject(PrintError(command as any, params, e.message));
              //     })
              // }
              // disable 
              if (setting.allowCashIn != this.setting.allowCashIn)
                this.setting.allowCashIn = setting.allowCashIn;

              if (this.balance < this.limiter || !setting.allowCashIn) {
                console.log('DISABLE', this.setting.allowCashIn);

                if (!this.enable) return resolve(PrintSucceeded(command as any, params, ''));
                this.enable = false;
                this.commandVMC(EVMC_COMMAND.disable, params, transactionID, this.getNextNo()).then(r => {
                  resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                }).catch(e => {
                  reject(PrintError(command as any, params, e.message));
                })
              } else {
                console.log('ENABLE', this.setting.allowCashIn);
                if (this.enable) return resolve(PrintSucceeded(command as any, params, ''));
                this.enable = true;
                this.commandVMC(EVMC_COMMAND.enable, params, transactionID, this.getNextNo()).then(r => {
                  resolve(PrintSucceeded(command as any, params, EMessage.commandsucceeded));
                }).catch(e => {
                  reject(PrintError(command as any, params, e.message));
                })
              }


            } catch (error) {
              console.log(error);

            }



          }
          // that.firstInit=false;
          break;
        case EMACHINE_COMMAND.logs:
          // const duration = params?.duration || 15;

          // for (let index = 0; index < duration; index++) {
          //     setTimeout(() => {
          //         const i = loadLogsDays();
          //         this.sock?.send(i, -3600, EMACHINE_COMMAND.logs);
          //     }, index * 5000);

          // }


          break;

        case EMACHINE_COMMAND.restart:
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
            console.log('INIT temperature');
            that.commandVMC(EVMC_COMMAND._7037, {}, -7037, that.getNextNo());
            console.log('INIT temperature');
            that.commandVMC(EVMC_COMMAND._7028, {}, -7028, that.getNextNo());
            // setTimeout(() => {
            //     console.log('INIT disable');
            //     that.command(EVMC_COMMAND.disable, {}, -701800, that.getNextNo());
            // }, 30000);
            // console.log('INIT disable');
            // that.command(EVMC_COMMAND.disable, {}, -701800, that.getNextNo());
          }, 2000);
          break;

        default:
          reject(PrintError(command as any, params, EMessage.commandnotfound));
          break;
      }
    })

  }
  checkSum(data?: any[]) {
    data[data.length - 1] = this.serialService.chk8xor(data);
    return data.join('');
  }

  async initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, reading: IreadingData = null, machineId: string, otp: string, isNative = ESerialPortType.Serial): Promise<void> {
    this.machineId = machineId;
    this.otp = otp;
    this.serialService.initializeSerialPort(portName, baudRate, log, reading, isNative).then(() => this.vmcInitilize());
  }
  public getSerialEvents() {
    return this.serialService.getSerialEvents();
  }
  close(): Promise<void> {
    return this.serialService.close();
  }
  public async listPorts(): Promise<SerialPortListResult> { 
    return await this.serialService.listPorts();
   }
  // public write(data: string): Promise<void> { return this.serialService.write(data); }
  private async vmcInitilize() {
    const that = this;

    try {
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
        // console.log('INIT temperature');
        that.commandVMC(EVMC_COMMAND._7037, {}, -7037, that.getNextNo());
        console.log('INIT temperature 2');
        that.commandVMC(EVMC_COMMAND._7028, {}, -7028, that.getNextNo());
        // setTimeout(() => {
        //     console.log('INIT disable');
        //     that.command(EVMC_COMMAND.disable, {}, -701800, that.getNextNo());
        // }, 30000);
        // console.log('INIT disable');
        // that.command(EVMC_COMMAND.disable, {}, -701800, that.getNextNo());
      }, 2000);


      try {
        const creditdata = await this.loadCredits() as Array<ICreditData>;
        console.log('readCreditRecord', creditdata);
        that.creditPending = creditdata;

      } catch (error) {
        console.log('readCreditRecord');
        this.createNewLogFile('credit', 'error readCreditRecord' + error)
        that.creditPending = [];
      }

    } catch (error) {
      console.log('ERROR', error);
      this.createNewLogFile('vmcInitilize', 'error readCreditRecord' + error)
    }

    var b = '';

    setTimeout(() => {
      setInterval(() => {
        try {
          console.log('check last update ', moment.now(), that.lastupdate, moment().diff(that.lastupdate), that.setting?.allowCashIn);

          if (moment().diff(that.lastupdate) >= 7000 || !that.setting?.allowCashIn) {
            if (!that.enable) return;
            that.command(EMACHINE_COMMAND.disable, {}, -118);
            that.enable = false;
            return;
          }
          if (that.countProcessClearLog <= 0) {
            that.countProcessClearLog = 60 * 60 * 24;
          } else {
            that.countProcessClearLog -= 2;
          }
          console.log('pending retry======= ', that.pendingRetry, 'credit pending------', that.creditPending);
          const cpx = that.creditPending[0];
          const cp = cpx.data;
          if (cp) {
            if (that.pendingRetry <= 0) {
              const t = cp?.transactionID;
              const b = cp?.data
              that.sock?.send(b, Number(t), EMACHINE_COMMAND.CREDIT_NOTE);
              that.pendingRetry = 10;
            } else {
              that.pendingRetry -= 2;
            }
          } else {
            that.pendingRetry = 10;
          }
        } catch (error) {
          console.log(error);
        }

      }, 2000);
    }, 7000);

    that.getSerialEvents().subscribe(function (event) {
      if (event.event === 'dataReceived') {
        console.log('Received from device:', event);
        // Process MODBUS response in TypeScript
        const hex = event.data.data;
        b = event.data.data;
        console.log('===>BUFFER', b);
        let buff = that.checkCommandsForSubmission();
        if (b == 'fafb410040' && buff != null) {// POLL and submit command

          console.log('X command', buff);
          that.serialService.write(buff?.b).then((e) => {
            if (e) {
              console.log('Error command', e.message);
              that.sock?.send(buff?.b, -5);
            } else {
              console.log('WRITE COMMAND succeeded', new Date().getTime());
              that.sock?.send(buff?.b, -6);
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
          that.createNewLogFile('dropdetect', b);
        }
        else if (b.startsWith('fafb21')) {// receive banknotes
          console.log('receive banknotes 21', b);
          //FAFB2106C608000186A0CF.  // if it is 08 then ignore
          if (b.substring(10, 12) == '08') {//fafb21068308000186a08a
            // ignore because it is a report that it was swallowed

          } else if (b.substring(10, 12) == '01') {
            // accept for banknote only 
            //1: Bill 2: Coin 3: IC card 4: Bank card 5: Wechat payment 6: Alipay 7: Jingdong Pay 8: Swallowing money 9: Union scan pay


            // fafb2106ee01 00000002 cb
            // fafb2106f501 00000002 d0
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
            // if(that.firstInit){
            //     that.firstInit=false;
            //     return;
            // }

            const t = Number('-21' + moment.now());
            const v = that.getNoteValue(b);
            const pending: ICreditDataDetails = { raw: b, data: cryptojs.SHA256(that.sock?.machineId + '' + v).toString(cryptojs.enc.Hex), t: moment.now(), transactionID: t + '', command: EMACHINE_COMMAND.CREDIT_NOTE };
            // const data = JSON.stringify(pending);
            const c = { data: pending, name: 'credit', transactionID: '', description: '' } as ICreditData;
            that.creditPending.push(c);
            that.addOrUpdateCredit(c);

            that.sock?.send(cryptojs.SHA256(that.sock?.machineId + v).toString(cryptojs.enc.Hex), t, EMACHINE_COMMAND.CREDIT_NOTE);

          } else {

          }



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
          that.createNewLogFile('receive banknotes 23', b);


        }
        else if (b.startsWith('fafb71')) {
          //FA FB 70 len packNO 18 01 00 crc 
          // FA FB 70 len packNO 18 01 C8 crc 
          // writeLogs(b, -1);

        }
        else if (b.startsWith('fafb52')) {
          // report status to the server
          console.log('SEND REPORT', b);
          that.machinestatus = b;
          that.sock?.send(b, -52);

        }


        if (b != 'fafb410040' && b != 'fafb420043') {// POLL only with no commands in the queue

          let x = that.getACK().join('')
          console.log('X ACK', x, (Buffer.from(x, 'hex')));
          that.serialService.write(x).then((e) => {
            console.log('WRITE ACK succeeded', e);

            that.sock?.send(b, -3);
          })
        }

        b = '';
      }
    });

  }
  private getNoteValue(b: string) {
    try {
      return this.hex2dec(b?.substring(12, 20));
    } catch (error) {
      return -1;
    }

  }
  private hex2dec(hex: string) {
    try {
      return parseInt(hex, 16);
    } catch (error) {
      return -1;
    }

  }

  private sycnVMC() {
    //FA FB 31 01 02 33
    this.command(EMACHINE_COMMAND.sync, {}, -31);
  }
  private setPoll(ms: number = 3) {
    this.command(EMACHINE_COMMAND.setpoll, { ms }, -16);
  }
  private clearTransactionID() {
    return this.commands.length ? this.commands.shift() : null;
  }
  // getCashACK() {

  //     let buff = ['fa', 'fb'];
  //     buff.push('23');
  //     buff.push(this.serialService.int2hex(1));
  //     buff.push(this.serialService.int2hex(this.getNextNo())); // default length 00
  //     buff.push(this.serialService.int2hex(0));
  //     buff[buff.length - 1] =this.serialService.chk8xor(buff)
  //     // fa fb 23 01 pckno crc
  //     return buff;
  // }
  private getACK() {

    let buff = ['fa', 'fb'];
    buff.push('42');
    buff.push('00'); // default length 00
    buff.push('00');
    buff[buff.length - 1] = this.serialService.chk8xor(buff)
    return buff;
  }

  private getNextNo() {
    this.no++;
    if (this.no >= 255) {
      this.no = 0;
    }

    return this.no;
  }
  private writeConfig() {

  }

  private checkCommandsForSubmission() {
    try {
      return this.commands[0];
    } catch (error) {
      console.log('ERROR NO COMMAND FOUND');

    }

    return null;
  }

  /**Logging file service */
  logFiles: string[] = [];



  private async loadLogFiles() {
    this.logFiles = await this.loggingService.getLogFiles();
  }

  private async writeLog(selectedFile: string, logMessage: string) {
    if (selectedFile && logMessage) {
      await this.loggingService.writeLog(selectedFile, logMessage);

    }
  }

  async readLog(selectedFile: string) {
    if (selectedFile) {
      return await this.loggingService.readLog(selectedFile);
    }
  }

  async deleteLog(selectedFile: string) {
    if (selectedFile) {
      await this.loggingService.deleteLog(selectedFile);
      return await this.loadLogFiles(); // Refresh list
    }
  }

  private async createNewLogFile(newFileName: string, logMessage: string) {
    if (newFileName) {
      await this.loggingService.writeLog(newFileName, logMessage);
      await this.loadLogFiles(); // Refresh list
    }
  }

  //** Database service section */
  async loadCredits() {
    return await this.dbService.getItems();
  }

  async addOrUpdateCredit(data: ICreditData) {


    if (data.id >= 0) {
      // Update existing item
      await this.dbService.updateItem(data.id, data.name, data.data, data.transactionID, data.description);

    } else {
      // Create new item
      await this.dbService.createItem(data.name, data.data, data.transactionID, data.description);
    }

    return await this.loadCredits();
  }

  async deleteCredit(id: number) {
    await this.dbService.deleteItem(id);
    return await this.loadCredits();
  }
}






