import { Injectable } from '@angular/core';
import { IlogSerial, IreadingData } from './vending-index-service.service';
import { SerialServiceService } from './services/serialservice.service';
import { IResModel } from './services/syste.model';

@Injectable({
  providedIn: 'root'
})
export class VmcService {

 
   constructor(private serialService: SerialServiceService) { }
   async command(command: string, params: any): Promise<IResModel> {
     return new Promise<IResModel>((resolve, reject) => {
       let buff: string[] = [];
       let check = '';
       const slaveAddress = '01'; // Default slave address
 

 
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

     });
   }
   initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, reading: IreadingData = null, isNative: boolean): Promise<void> {
     return this.serialService.initializeSerialPort(portName, baudRate, log, reading, isNative);
   }
   getSerialEvents(){
     return this.serialService.getSerialEvents();
   }

}
enum VMC_COMMAND {
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
