import { Injectable } from '@angular/core';
import { Zdm8Service } from './zdm8.service';
import { VmcService } from './vmc.service';
import {ESerialPortType,ISerialService} from './services/syste.model';
import { BackgroundTask } from '@capawesome/capacitor-background-task';
import { App } from '@capacitor/app';


export enum EVendingIndex{
  zdm8,
  vmc
}
export interface IlogSerial{
  data:string;
}
export interface IreadingData{
  data:string;
  len:number;
}

@Injectable({
  providedIn: 'root'
})
export class VendingIndexServiceService {
  log = { data: '' };
  readingData = { data: '',len:100 };
  portName = '/dev/ttyS1';
  braudRate = 9600;

  task:ISerialService;


  constructor(public zdm8:Zdm8Service,public vmc:VmcService) {
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        return;
      }
      // The app state has been changed to inactive.
      // Start the background task by calling `beforeExit`.
      const taskId = await BackgroundTask.beforeExit(async () => {
        // Run your code...
        // Finish the background task as soon as everything is done.
        if(this.task){
          this.task.close();
          console.log('Task close serial port');
        }
        BackgroundTask.finish({ taskId });
      });
    });
   }
  initZDM8(portName:string='/dev/ttyS1',baudRate:number=9600,machineId='11111111',otp='111111',isNative=ESerialPortType.Serial){
    this.portName = portName;
    this.braudRate = baudRate;
    this.zdm8.initializeSerialPort(portName,baudRate,this.log,this.readingData,machineId,otp,isNative).then(() => {
      console.log('zdm8 Serial port initialized');
    });
    this.task = this.zdm8;
    return this.zdm8;
  }
  initVMC(portName:string='/dev/ttyS0',baudRate:number=57600,machineId='11111111',otp='111111',isNative=ESerialPortType.Serial){
    this.portName = portName;
    this.braudRate = baudRate;
    this.vmc.initializeSerialPort(portName,baudRate,this.log,this.readingData,machineId,otp,isNative).then(() => {
      console.log('VMC Serial port initialized');
    });
    this.task = this.vmc;
    return this.vmc;
  }
  

}
