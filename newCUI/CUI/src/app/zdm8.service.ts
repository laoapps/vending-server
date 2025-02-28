import { Injectable } from '@angular/core';

import crc from 'crc';
import { SerialServiceService, } from './services/serialservice.service';
import { IlogSerial, IreadingData } from './vending-index-service.service';
import { IResModel,ESerialPortType,ISerialService,EZDM8_COMMAND,EMACHINE_COMMAND } from './services/syste.model';
import {  SerialPortListResult } from 'SerialConnectionCapacitor';




@Injectable({
  providedIn: 'root'
})
export class Zdm8Service  implements ISerialService {
  // pcbarray = '01';
  machineId:string='11111111';
  otp='111111';
  portName = '/dev/ttyS1';
  braudRate=9600;
  log: { data: string; };
  readingData: { data: string; len: number; };
  constructor(private serialService: SerialServiceService) { }
  async commandZDM8(command: EZDM8_COMMAND, params: any, transactionID: number): Promise<IResModel> {
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
            const dropdetect = params.dropdetect || '00'; // Default off  bug and nothing happen
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
            reject({ command, data:params, message: 'Unknown command' });
            return;
        }

        const x = buff.join('') + check;
        console.log('Command sent:', x);

        this.serialService.write(x).then(() => {
          console.log('Command succeeded:', x);
          params.x=x;
          resolve({ command, data:params, message: 'Command sent successfully' }as IResModel);
        }).catch(e => {
          console.error('Command failed:', e);
          reject({ command, params, result: e.message });
        });

        // Timeout mechanism (2s as per protocol)
        setTimeout(() => {
          reject({ command, params, result: 'Timeout: No response within 2s' });
        }, 2000);
      } catch (error: any) {
        reject({ command, params, result: error.message });
      }
    });
  }
  command = async (command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> => {
    return new Promise<IResModel>((resolve, reject) => {
      switch (command) {
        case EMACHINE_COMMAND.version:
          this.commandZDM8(EZDM8_COMMAND.hwversion, params, transactionID).then(resolve).catch(reject);
          
          break;
        case EMACHINE_COMMAND.status:
          this.commandZDM8(EZDM8_COMMAND.status, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.dropdetectstatus:
          this.commandZDM8(EZDM8_COMMAND.dropdetectstatus, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.arrayoutputstatus:
          this.commandZDM8(EZDM8_COMMAND.arrayoutputstatus, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.arrayinputstatus:
          this.commandZDM8(EZDM8_COMMAND.arrayinputstatus, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.shippingcontrol:
          this.commandZDM8(EZDM8_COMMAND.shippingcontrol, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.relaycommand:
          this.commandZDM8(EZDM8_COMMAND.relaycommand, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.swversion:
          this.commandZDM8(EZDM8_COMMAND.swversion, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.hutemp:
          this.commandZDM8(EZDM8_COMMAND.hutemp, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.statusgrid:
          this.commandZDM8(EZDM8_COMMAND.statusgrid, params, transactionID).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.hwversion:
          this.commandZDM8(EZDM8_COMMAND.hwversion, params, transactionID).then(resolve).catch(reject);
          break;
        default:
          break;
      } 
    });
  }
  checkSum(buff: string[]): string {
    const x = buff.join('') + this.serialService.checkSumCRC(buff);
    return x;
  }
  initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, reading: IreadingData = null,machineId:string,otp:string, isNative=ESerialPortType.Serial): Promise<void> {
    this.machineId=machineId;
    this.otp=otp;
    return this.serialService.initializeSerialPort(portName||this.portName, baudRate||this.braudRate, log, reading, isNative);
  }
  getSerialEvents(){
    return this.serialService.getSerialEvents();
  }
  close(): Promise<void> {
    return this.serialService.close();
  }
  public async listPorts(): Promise<SerialPortListResult> { 
    return await this.serialService.listPorts();
   }

}
