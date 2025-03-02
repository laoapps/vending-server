import { Injectable } from '@angular/core';
import { Zdm8Service } from './zdm8.service';
import { VmcService } from './vmc.service';
import {Tp77p3bcashacceptorService} from './tp77p3bcashacceptor.service';
import {ESerialPortType,ISerialService} from './services/syste.model';
import { BackgroundTask } from '@capawesome/capacitor-background-task';
import { App } from '@capacitor/app';
import { EsspNV9USBService } from './essp-nv9-usb.service';
import { CCTALKTb74Service } from './cctalktb74.service';


export enum EVendingIndex{
  zdm8,
  vmc,
  toptp773b
}



@Injectable({
  providedIn: 'root'
})
export class VendingIndexServiceService {
  log = { data: '' };
  portName = '/dev/ttyS1';
  braudRate = 9600;

  task:ISerialService;


  constructor(public zdm8:Zdm8Service,public vmc:VmcService,public tp773b:Tp77p3bcashacceptorService,public essp:EsspNV9USBService,public cctalk:CCTALKTb74Service) {
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
  async initZDM8(portName:string='/dev/ttyS1',baudRate:number=9600,machineId='11111111',otp='111111',isNative=ESerialPortType.Serial){
    this.portName = portName;
    this.braudRate = baudRate;
    this.zdm8.initializeSerialPort(portName,baudRate,this.log,machineId,otp,isNative);
    console.log('zdm8 Serial port initialized');
    this.task = this.zdm8;
    return this.zdm8;
  }
  async initVMC(portName:string='/dev/ttyS0',baudRate:number=57600,machineId='11111111',otp='111111',isNative=ESerialPortType.Serial){
    this.portName = portName;
    this.braudRate = baudRate;
    await this.vmc.initializeSerialPort(portName,baudRate,this.log,machineId,otp,isNative);
    console.log('VMC Serial port initialized');
    this.task = this.vmc;
    return this.vmc;
  }
  async initTop77p(portName:string='/dev/ttyS0',baudRate:number=9600,machineId='11111111',otp='111111',isNative=ESerialPortType.Serial){
    this.portName = portName;
    this.braudRate = baudRate;
    await this.tp773b.initializeSerialPort(portName,baudRate,this.log,machineId,otp,isNative);
    console.log('tp773b Serial port initialized');
    this.task = this.tp773b;
    return this.tp773b;
  }
  async initEssp(portName:string='/dev/ttyS0',baudRate:number=9600,machineId='11111111',otp='111111',isNative=ESerialPortType.Serial){
    this.portName = portName;
    this.braudRate = baudRate;
    await this.essp.initializeSerialPort(portName,baudRate,this.log,machineId,otp,isNative);
    console.log('initEssp Serial port initialized');
    this.task = this.essp;
    return this.essp;
  }
  async initCctalk(portName:string='/dev/ttyS0',baudRate:number=9600,machineId='11111111',otp='111111',isNative=ESerialPortType.Serial){
    this.portName = portName;
    this.braudRate = baudRate;
    await this.cctalk.initializeSerialPort(portName,baudRate,this.log,machineId,otp,isNative);
    console.log('initEssp Serial port initialized');
    this.task = this.cctalk;
    return this.cctalk;
  }
  
  

}
