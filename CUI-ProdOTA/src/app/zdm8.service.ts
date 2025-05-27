import { Injectable } from '@angular/core';

import crc from 'crc';
import { SerialServiceService, } from './services/serialservice.service';

import { IResModel, ESerialPortType, ISerialService, EZDM8_COMMAND, EMACHINE_COMMAND, IlogSerial, addLogMessage } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import { Buffer } from 'buffer';



@Injectable({
  providedIn: 'root'
})
export class Zdm8Service implements ISerialService {
  // pcbarray = '01';
  machineId: string = '11111111';
  otp = '111111';
  portName = '/dev/ttyS1';
  baudRate = 9600;
  log: IlogSerial;
  machinestatus = {data:''};
  constructor(private serialService: SerialServiceService) { }
  initZDM8() {
    const that = this;
    that.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const rawData = event.data; // Assuming event.data contains the raw hex string
        that.addLogMessage(that.log, `Raw data: ${rawData}`);
        console.log('zdm service Received from device:', rawData);

        // Process the Modbus response
        const response = that.processModbusResponse(rawData);
        if (response) {
          that.addLogMessage(that.log, `Processed response: ${JSON.stringify(response)}`);
          console.log('Processed Modbus response:', response);
        }
      }
    });
  }

  // Process incoming Modbus RTU response
  public processModbusResponse(rawData: string): any {
    try {
      // Ensure rawData is a valid hex string without spaces
      const hexData = rawData.replace(/\s/g, '').toLowerCase();
      if (hexData.length < 8) { // Minimum length: Slave Address (1) + Function Code (1) + Data + CRC (2 bytes = 4 chars)
        this.addLogMessage(this.log, 'Invalid response: Too short');
        return null;
      }

      // Extract components
      const slaveAddress = hexData.slice(0, 2);
      const functionCode = hexData.slice(2, 4);
      const crcReceived = hexData.slice(-4); // Last 2 bytes (4 hex chars)
      const data = hexData.slice(4, -4); // Data portion between function code and CRC

      // Verify CRC
      const frameWithoutCrc = hexData.slice(0, -4);
      const calculatedCrc = this.calculateCrc16(frameWithoutCrc);
      if (calculatedCrc !== crcReceived) {
        this.addLogMessage(this.log, `CRC mismatch: Expected ${calculatedCrc}, Received ${crcReceived}`);
        return null;
      }

      // Handle based on function code
      switch (functionCode) {
        case '03': // Read Holding Registers
          return this.handleReadResponse(slaveAddress, data);
        case '06': // Write Single Holding Register
          return this.handleWriteSingleResponse(slaveAddress, data);
        case '10': // Write Multiple Holding Registers
          return this.handleWriteMultipleResponse(slaveAddress, data);
        case '83': // Exception for 0x03
        case '86': // Exception for 0x06
        case '90': // Exception for 0x10
          return this.handleExceptionResponse(slaveAddress, functionCode, data);
        default:
          this.addLogMessage(this.log, `Unsupported function code: ${functionCode}`);
          return null;
      }
    } catch (error) {
      this.addLogMessage(this.log, `Error processing response: ${error.message}`);
      return null;
    }
  }

  // Calculate CRC16 (Modbus RTU)
  private calculateCrc16(hexString: string): string {
    const buffer = Buffer.from(hexString, 'hex');
    const crcValue = crc.crc16modbus(buffer);
    return crcValue.toString(16).padStart(4, '0'); // Return as 4-character hex string
  }

  // Handle 0x03 Read Holding Registers Response
  private handleReadResponse(slaveAddress: string, data: string): any {
    const byteCount = parseInt(data.slice(0, 2), 16);
    const registerData = data.slice(2);
    if (registerData.length !== byteCount * 2) {
      this.addLogMessage(this.log, 'Invalid byte count in 0x03 response');
      return null;
    }

    const address = parseInt(registerData.slice(0, 4), 16); // Assume starting address from command context
    switch (address) {
      case 0x0001: // Hardware version
        return {
          command: EZDM8_COMMAND.hwversion,
          hardwareVersion: `${parseInt(registerData.slice(0, 2), 16)}.${parseInt(registerData.slice(2, 4), 16)}`,
          layers: parseInt(registerData.slice(4, 6), 16),
          columns: parseInt(registerData.slice(6, 8), 16)
        };
      case 0x0002: // Software version
        return {
          command: EZDM8_COMMAND.swversion,
          softwareVersion: `${parseInt(registerData.slice(0, 2), 16)}.${parseInt(registerData.slice(2, 4), 16)}`
        };
      case 0x0003: // Driver board status
        return {
          command: EZDM8_COMMAND.status,
          status: parseInt(registerData.slice(0, 2), 16), // Refer to SYSCTRL_STAT enum
          errorCode: parseInt(registerData.slice(2, 4), 16) // Refer to error code enum
        };
      case 0x0004: // Temperature and humidity
        return {
          command: EZDM8_COMMAND.hutemp,
          temperature: parseInt(registerData.slice(0, 4), 16) / 10, // Assuming scaling factor
          humidity: parseInt(registerData.slice(4, 8), 16) / 10
        };
      case 0x0005: // Grid cabinet status
        return {
          command: EZDM8_COMMAND.statusgrid,
          cabinetStatus: parseInt(registerData.slice(0, 2), 16) === 0 ? 'open' : 'closed'
        };
      case 0x0008: // Drop detection status
        return {
          command: EZDM8_COMMAND.dropdetectstatus,
          dropDetected: parseInt(registerData.slice(0, 2), 16) === 1
        };
      case 0x0009: // Array output status
        return {
          command: EZDM8_COMMAND.arrayoutputstatus,
          positivePole: parseInt(registerData.slice(0, 2), 16),
          negativePole: parseInt(registerData.slice(2, 4), 16)
        };
      case 0x000a: // Driver board input status
        return {
          command: EZDM8_COMMAND.arrayinputstatus,
          inputStatus: parseInt(registerData.slice(0, 2), 16)
        };
      default:
        this.addLogMessage(this.log, `Unknown register address in 0x03 response: ${address}`);
        return null;
    }
  }

  // Handle 0x06 Write Single Holding Register Response
  private handleWriteSingleResponse(slaveAddress: string, data: string): any {
    const address = parseInt(data.slice(0, 4), 16);
    const value = parseInt(data.slice(4, 8), 16);
    return {
      command: EZDM8_COMMAND.relaycommand, // Assuming relay command uses 0x06
      address,
      value: value === 1 ? 'on' : 'off'
    };
  }

  // Handle 0x10 Write Multiple Holding Registers Response
  private handleWriteMultipleResponse(slaveAddress: string, data: string): any {
    const startAddress = parseInt(data.slice(0, 4), 16);
    const wordLength = parseInt(data.slice(4, 8), 16);
    if (startAddress === 0x2001) {
      return {
        command: EZDM8_COMMAND.shippingcontrol,
        message: `Shipping control initiated for ${wordLength} registers`
      };
    }
    return { startAddress, wordLength };
  }

  // Handle Exception Response
  private handleExceptionResponse(slaveAddress: string, functionCode: string, data: string): any {
    const exceptionCode = parseInt(data.slice(0, 2), 16);
    const errorMessages: { [key: number]: string } = {
      1: 'Illegal function code',
      2: 'Illegal data address',
      3: 'Illegal data',
      4: 'Calibration error',
      6: 'Slave equipment busy',
      7: 'Slave equipment failure',
      8: 'Confirmation (processing)'
    };
    return {
      error: true,
      functionCode,
      exceptionCode,
      message: errorMessages[exceptionCode] || 'Unknown exception'
    };
  }
  async commandZDM8(command: EZDM8_COMMAND, params: any): Promise<IResModel> {
    return new Promise<IResModel>((resolve, reject) => {
      let buff: string[] = [];
      let check = '';
      const slaveAddress = '01'; // Default slave address

      try {
        switch (command) {
          case EZDM8_COMMAND.hwversion:
            buff = [slaveAddress, '03', '00', '01', '00', '02']; // Read hardware version
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.swversion:
            buff = [slaveAddress, '03', '00', '02', '00', '02']; // Read software version
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.status:
            buff = [slaveAddress, '03', '00', '03', '00', '01']; // Read driver board status
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.hutemp:
            buff = [slaveAddress, '03', '00', '04', '00', '02']; // Read temperature and humidity
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.statusgrid:
            buff = [slaveAddress, '03', '00', '05', '00', '01']; // Read grid cabinet status
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.dropdetectstatus:
            buff = [slaveAddress, '03', '00', '08', '00', '01']; // Read drop detection status
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.arrayoutputstatus:
            buff = [slaveAddress, '03', '00', '09', '00', '02']; // Read array output status
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.arrayinputstatus:
            buff = [slaveAddress, '03', '00', '0A', '00', '01']; // Read array input status
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.shippingcontrol:
            const slot = this.serialService.int2hex(params.slot - 1); // 0-99
            const isspring = params.isspring || '01'; // Default spring motor
            // const dropdetect = params.dropdetect || '00'; // Default off  bug and nothing happen
            const dropdetect = '00'; // Default off  bug and nothing happen

            const liftsystem = params.liftsystem || '00'; // Default off
            buff = [slaveAddress, '10', '20', '01', '00', '02', '04', slot, isspring, dropdetect, liftsystem];
            check = this.serialService.checkSumCRC(buff);
            break;
          case EZDM8_COMMAND.relaycommand:
            const relayNum = this.serialService.int2hex(params.slot); // 01-10
            const relayState = params.state === 'on' ? '01' : '00'; // 01-on, 00-off
            buff = [slaveAddress, '06', relayNum, relayState];
            check = this.serialService.checkSumCRC(buff);
            break;

          default:
            reject({ command, data: params, message: 'Unknown command' });
            return;
        }

        const x = buff.join('') + check;
        console.log('zdm service  Command sent:', x);

        this.serialService.write(x).then(() => {
          console.log('zdm service  Command succeeded:', x);
          params.x = x;
          resolve({ command, data: params, message: 'Command sent successfully' } as IResModel);
        }).catch(e => {
          console.log('zdm service  Command failed:', e);
          reject({ command, params, result: e.message });
        });
      } catch (error: any) {
        reject({ command, params, result: error.message });
      }
    });
  }
  command = async (command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> => {
    return new Promise<IResModel>((resolve, reject) => {
      switch (command) {
        case EMACHINE_COMMAND.version:
          this.commandZDM8(EZDM8_COMMAND.hwversion, params).then(resolve).catch(reject);

          break;
        case EMACHINE_COMMAND.status:
          this.commandZDM8(EZDM8_COMMAND.status, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.dropdetectstatus:
          this.commandZDM8(EZDM8_COMMAND.dropdetectstatus, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.arrayoutputstatus:
          this.commandZDM8(EZDM8_COMMAND.arrayoutputstatus, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.arrayinputstatus:
          this.commandZDM8(EZDM8_COMMAND.arrayinputstatus, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.shippingcontrol:
          this.commandZDM8(EZDM8_COMMAND.shippingcontrol, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.relaycommand:
          this.commandZDM8(EZDM8_COMMAND.relaycommand, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.swversion:
          this.commandZDM8(EZDM8_COMMAND.swversion, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.hutemp:
          this.commandZDM8(EZDM8_COMMAND.hutemp, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.statusgrid:
          this.commandZDM8(EZDM8_COMMAND.statusgrid, params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.hwversion:
          this.commandZDM8(EZDM8_COMMAND.hwversion, params).then(resolve).catch(reject);
          break;
        default:
          break;
      }
    });
  }
    public shipItem(slot = 1, dropSensor = 1) {
      return new Promise<void>(async (resolve, reject) => {
        await this.command(EMACHINE_COMMAND.shippingcontrol, { slot, dropSensor },-1);
        // this.serialService.writeVMC(EVMC_COMMAND.ENABLE, { read:false,value: '0000' });
        resolve();
      });
    }
    
  checkSum(buff: string[]): string {
    const x = buff.join('') + this.serialService.checkSumCRC(buff);
    return x;
  }
  initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, machineId: string, otp: string, isNative = ESerialPortType.Serial): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      this.machineId = machineId;
      this.otp = otp;
      this.portName = portName || this.portName;
      this.baudRate = baudRate || this.baudRate;
      this.log = log;


      const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      this.serialService.startReading();
      if (init == this.portName) {
        this.initZDM8();
        resolve(init);
      }
      else reject(init);

    });

  }
  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }
  close(): Promise<void> {

    return this.serialService.close();
  }
  public async listPorts(): Promise<SerialPortListResult> {
    return  this.serialService.listPorts();
  }
  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }
}


/// BAK
// import { Injectable } from '@angular/core';


// import { SerialServiceService, } from './services/serialservice.service';

// import { IResModel,ESerialPortType,ISerialService,EZDM8_COMMAND,EMACHINE_COMMAND ,IlogSerial, addLogMessage} from './services/syste.model';
// import {  SerialPortListResult } from 'SerialConnectionCapacitor';




// @Injectable({
//   providedIn: 'root'
// })
// export class Zdm8Service  implements ISerialService {
//   // pcbarray = '01';
//   machineId:string='11111111';
//   otp='111111';
//   portName = '/dev/ttyS1';
//   baudRate=9600;
//   log: IlogSerial;

//   constructor(private serialService: SerialServiceService) { }
//   initZDM8(){
//     const that = this;
//       that.getSerialEvents().subscribe(function (event) {
//           if (event.event === 'dataReceived') {
//             that.addLogMessage(that.log, `Raw data: ${event}`);
//             console.log('Received from device:', event);
//             // Process MODBUS response in TypeScript
//           }
//         });
//   }
//   async commandZDM8(command: EZDM8_COMMAND, params: any): Promise<IResModel> {
//     return new Promise<IResModel>((resolve, reject) => {
//       let buff: string[] = [];
//       let check = '';
//       const slaveAddress = '01'; // Default slave address

//       try {
//         switch (command) {
//           case EZDM8_COMMAND.hwversion:
//             buff = [slaveAddress, '03', '00', '01', '00', '02']; // Read hardware version
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.swversion:
//             buff = [slaveAddress, '03', '00', '02', '00', '02']; // Read software version
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.status:
//             buff = [slaveAddress, '03', '00', '03', '00', '01']; // Read driver board status
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.hutemp:
//             buff = [slaveAddress, '03', '00', '04', '00', '02']; // Read temperature and humidity
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.statusgrid:
//             buff = [slaveAddress, '03', '00', '05', '00', '01']; // Read grid cabinet status
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.dropdetectstatus:
//             buff = [slaveAddress, '03', '00', '08', '00', '01']; // Read drop detection status
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.arrayoutputstatus:
//             buff = [slaveAddress, '03', '00', '09', '00', '02']; // Read array output status
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.arrayinputstatus:
//             buff = [slaveAddress, '03', '00', '0A', '00', '01']; // Read array input status
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.shippingcontrol:
//             const slot = this.serialService.int2hex(params.slot - 1); // 0-99
//             const isspring = params.isspring || '01'; // Default spring motor
//             const dropdetect = params.dropdetect || '00'; // Default off  bug and nothing happen
//             const liftsystem = params.liftsystem || '00'; // Default off
//             buff = [slaveAddress, '10', '20', '01', '00', '02', '04', slot, isspring, dropdetect, liftsystem];
//             check = this.serialService.checkSumCRC(buff);
//             break;
//           case EZDM8_COMMAND.relaycommand:
//             const relayNum = this.serialService.int2hex(params.slot); // 01-10
//             const relayState = params.state === 'on' ? '01' : '00'; // 01-on, 00-off
//             buff = [slaveAddress, '06', relayNum, relayState];
//             check = this.serialService.checkSumCRC(buff);
//             break;

//           default:
//             reject({ command, data:params, message: 'Unknown command' });
//             return;
//         }

//         const x = buff.join('') + check;
//         console.log('Command sent:', x);

//         this.serialService.write(x).then(() => {
//           console.log('Command succeeded:', x);
//           params.x=x;
//           resolve({ command, data:params, message: 'Command sent successfully' }as IResModel);
//         }).catch(e => {
//           console.error('Command failed:', e);
//           reject({ command, params, result: e.message });
//         });

//         // Timeout mechanism (2s as per protocol)
//         setTimeout(() => {
//           reject({ command, params, result: 'Timeout: No response within 2s' });
//         }, 2000);
//       } catch (error: any) {
//         reject({ command, params, result: error.message });
//       }
//     });
//   }
//   command = async (command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> => {
//     return new Promise<IResModel>((resolve, reject) => {
//       switch (command) {
//         case EMACHINE_COMMAND.version:
//           this.commandZDM8(EZDM8_COMMAND.hwversion, params).then(resolve).catch(reject);
          
//           break;
//         case EMACHINE_COMMAND.status:
//           this.commandZDM8(EZDM8_COMMAND.status, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.dropdetectstatus:
//           this.commandZDM8(EZDM8_COMMAND.dropdetectstatus, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.arrayoutputstatus:
//           this.commandZDM8(EZDM8_COMMAND.arrayoutputstatus, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.arrayinputstatus:
//           this.commandZDM8(EZDM8_COMMAND.arrayinputstatus, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.shippingcontrol:
//           this.commandZDM8(EZDM8_COMMAND.shippingcontrol, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.relaycommand:
//           this.commandZDM8(EZDM8_COMMAND.relaycommand, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.swversion:
//           this.commandZDM8(EZDM8_COMMAND.swversion, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.hutemp:
//           this.commandZDM8(EZDM8_COMMAND.hutemp, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.statusgrid:
//           this.commandZDM8(EZDM8_COMMAND.statusgrid, params).then(resolve).catch(reject);
//           break;
//         case EMACHINE_COMMAND.hwversion:
//           this.commandZDM8(EZDM8_COMMAND.hwversion, params).then(resolve).catch(reject);
//           break;
//         default:
//           break;
//       } 
//     });
//   }
//   checkSum(buff: string[]): string {
//     const x = buff.join('') + this.serialService.checkSumCRC(buff);
//     return x;
//   }
//   initializeSerialPort(portName: string, baudRate: number, log: IlogSerial,machineId:string,otp:string, isNative=ESerialPortType.Serial): Promise<string> {
//     return new Promise<string>(async (resolve, reject) => {
//       this.machineId = machineId;
//       this.otp = otp;
//       this.portName = portName || this.portName;
//       this.baudRate = baudRate || this.baudRate;
//       this.log = log;


//       const init =await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
//       if(init==this.portName){
//       this.initZDM8();
//       resolve(init);
//       }
//       else  reject(init);

//     });
 
//   }
//   getSerialEvents(){
//     return this.serialService.getSerialEvents();
//   }
//   close(): Promise<void> {
    
//     return this.serialService.close();
//   }
//   public async listPorts(): Promise<SerialPortListResult> { 
//     return await this.serialService.listPorts();
//    }
//   private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
//     addLogMessage(log, message, consoleMessage);
//   }
// }
