import { Injectable } from '@angular/core';

import crc from 'crc';
import { SerialServiceService } from './services/serialservice.service';
import { IlogSerial, IreadingData } from './vending-index-service.service';
enum EZDM8_COMMAND {
  hwversion = 'hwversion',
  swversion = 'swversion',
  status = 'status',
  hutemp = 'hutemp',
  statusgrid = 'statusgrid',
  dropdetectstatus = 'dropdetectstatus',
  arrayoutputstatus = 'arrayoutputstatus',
  arrayinputstatus = 'arrayinputstatus',
  shippingcontrol = 'shippingcontrol',
  relaycommand = 'relaycommand'
  // Add more as needed below
}

interface IResModel {
  command: string;
  params: any;
  result: string;
}
@Injectable({
  providedIn: 'root'
})
export class Zdm8Service {
  pcbarray = '01';

  constructor(private serialService: SerialServiceService) { }
  async command(command: string, params: any): Promise<IResModel> {
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
            const dropdetect = params.dropdetect || '00'; // Default off
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
            reject({ command, params, result: 'Unknown command' });
            return;
        }

        const x = buff.join('') + check;
        console.log('Command sent:', x);

        this.serialService.write(x).then(() => {
          console.log('Command succeeded:', x);
          resolve({ command, params, result: 'Command sent successfully' });
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
  initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, reading: IreadingData = null, isNative: boolean): Promise<void> {
    return this.serialService.initializeSerialPort(portName, baudRate, log, reading, isNative);
  }
  getSerialEvents(){
    return this.serialService.getSerialEvents();
  }
  
}
