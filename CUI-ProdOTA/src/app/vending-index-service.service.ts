import { Injectable } from '@angular/core';
import { Zdm8Service } from './zdm8.service';
import { VmcService } from './vmc.service';
import { Tp77PulseService } from './Tp77Pulse.Service';
import { addLogMessage, ESerialPortType, IlogSerial, ISerialService } from './services/syste.model';
import { BackgroundTask } from '@capawesome/capacitor-background-task';
import { App } from '@capacitor/app';
import { EsspService } from './essp.service';

import { CCTALKTb74Service } from './cctalktb74.service';
import { MT102Service } from './mt102.service';
import { ADH815Service } from './adh815.service';
import { ADH814Service } from './adh814.service';
import { Toast } from '@capacitor/toast';






@Injectable({
  providedIn: 'root'
})
export class VendingIndexServiceService {
  log: IlogSerial = { data: '', limit: 50 };
  portName = '/dev/ttyS3';
  baudRate = 9600;

  task: ISerialService;


  constructor(public vmc: VmcService, public zdm8: Zdm8Service, 
    // public tp773b: Tp77PulseService, public essp: EsspService, public cctalk: CCTALKTb74Service, public m102: MT102Service, public adh815: ADH815Service,
    public adh814: ADH814Service) {
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        return;
      }
      // The app state has been changed to inactive.
      // Start the background task by calling `beforeExit`.
      const taskId = await BackgroundTask.beforeExit(async () => {
        // Run your code...
        // Finish the background task as soon as everything is done.
        if (this.task) {
          this.task.close();
          console.log('vendingindex service  Task close serial port');
        }
        BackgroundTask.finish({ taskId });
      });
    });
  }
  async initZDM8(portName: string = '/dev/ttyS1', baudRate: number = 9600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial): Promise<ISerialService> {
    return new Promise<ISerialService>(async (resolve, reject) => {
      this.portName = portName;
      this.baudRate = baudRate;

      const x = await this.zdm8.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
      if (x != this.portName) {
        reject(null);
      }
      console.log('vendingindex service  zdm8 Serial port initialized');
      this.task = this.zdm8;
      return resolve(this.zdm8);
    });

  }
  async initVMC(portName: string = '/dev/ttyS0', baudRate: number = 57600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial): Promise<ISerialService> {
    return new Promise<ISerialService>(async (resolve, reject) => {
      this.portName = portName;
      this.baudRate = baudRate;

      const x = await this.vmc.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
      if (x != this.portName) {
        return reject(null);
      }
      console.log('vendingindex service  VMC Serial port initialized');
      this.task = this.vmc;
      return resolve(this.vmc);
    });
  }
  // async initPulseTop77p(portName: string = '/dev/ttyS0', baudRate: number = 9600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial): Promise<ISerialService> {
  //   return new Promise<ISerialService>(async (resolve, reject) => {
  //     this.portName = portName;
  //     this.baudRate = baudRate;
  //     const x = await this.tp773b.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
  //     if (x != this.portName) {
  //       return reject(null);
  //     }
  //     console.log('vendingindex service  tp773b Serial port initialized');
  //     this.task = this.tp773b;
  //     return resolve(this.tp773b);
  //   });
  // }
  // async initEssp(portName: string = '/dev/ttyS1', baudRate: number = 9600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial,channels=[1,1,1,1,1,1,1]):Promise<ISerialService> {
  //   return new Promise<ISerialService>(async (resolve, reject) => { 
  //     this.portName = portName;
  //   this.baudRate = baudRate;
  //   // this.essp2.setChannels(channels);
  //   const  x= await this.essp.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
  //   if(x!=this.portName){
  //     return reject(null);
  //   }
  //   console.log('vendingindex service  initEssp Serial port initialized');
  //   this.task = this.essp;
  //   return resolve(this.essp);
  // });
  // }
  // async initEssp(portName: string = '/dev/ttyS1', baudRate: number = 9600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial, channels = [1, 1, 1, 1, 1, 1, 1]): Promise<ISerialService> {
  //   return new Promise<ISerialService>(async (resolve, reject) => {
  //     this.portName = portName;
  //     this.baudRate = baudRate;

  //     this.essp.setChannels(channels);
  //     const x = await this.essp.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
  //     if (x != this.portName) {
  //       return reject(null);
  //     }
  //     console.log('vendingindex service  initEssp Serial port initialized');
  //     this.task = this.essp;
  //     return resolve(this.essp);
  //   });
  // }
  // async initCctalk(portName: string = '/dev/ttyS0', baudRate: number = 9600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial): Promise<ISerialService> {
  //   return new Promise<ISerialService>(async (resolve, reject) => {
  //     this.portName = portName;
  //     this.baudRate = baudRate;

  //     const x = await this.cctalk.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
  //     if (x != this.portName) {
  //       return reject(null);
  //     }
  //     console.log('vendingindex service  initCctalk Serial port initialized');
  //     this.task = this.cctalk;
  //     return resolve(this.cctalk);
  //   });
  // }
  // async initM102(portName: string = '/dev/ttyS0', baudRate: number = 9600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial): Promise<ISerialService> {
  //   return new Promise<ISerialService>(async (resolve, reject) => {
  //     this.portName = portName;
  //     this.baudRate = baudRate;

  //     const x = await this.m102.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
  //     if (x != this.portName) {
  //       return reject(null);
  //     }
  //     console.log('vendingindex service  initM102 Serial port initialized');
  //     this.task = this.m102;
  //     return resolve(this.m102);
  //   });
  // }
  // async initADH815(portName: string = '/dev/ttyS0', baudRate: number = 9600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial): Promise<ISerialService> {
  //   return new Promise<ISerialService>(async (resolve, reject) => {
  //     this.portName = portName;
  //     this.baudRate = baudRate;
  //     const x = await this.adh815.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
  //     if (x != this.portName) {
  //       return reject(null);
  //     }
  //     console.log('vendingindex service  initADH815 Serial port initialized');
  //     this.task = this.adh815;
  //     return resolve(this.adh815);
  //   });
  // }


  async initADH814(portName: string = '/dev/ttyS3', baudRate: number = 9600, machineId = '11111111', otp = '111111', isNative = ESerialPortType.Serial): Promise<ISerialService> {
    return new Promise<ISerialService>(async (resolve, reject) => {
      this.portName = portName;
      this.baudRate = baudRate;
      const x = await this.adh814.initializeSerialPort(portName, baudRate, this.log, machineId, otp, isNative);
      if (x != this.portName) {
        console.log('vendingindex service  initADH814 NULL',x);
        Toast.show({ text: 'vendingindex service  initADH814 NULL' });
        return reject(null);

      }
      console.log('vendingindex service  initADH814 Serial port initialized');
      // Toast.show({ text: 'vendingindex service  initADH814 Serial port initialized' });
      this.task = this.adh814;
      return resolve(this.adh814);
    });
  }




}
