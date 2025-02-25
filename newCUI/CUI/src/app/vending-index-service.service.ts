import { Injectable } from '@angular/core';
import { Zdm8Service } from './zdm8.service';
import { VmcService } from './vmc.service';
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

  constructor(public zdm8:Zdm8Service,public vmc:VmcService) { }
  initZDM8(portName:string='/dev/ttyS1',baudRate:number=9600){
    this.portName = portName;
    this.braudRate = baudRate;
    this.zdm8.initializeSerialPort(portName,baudRate,this.log,this.readingData,true).then(() => {
      console.log('zdm8 Serial port initialized');
    });

  }
  initVMC(portName:string='/dev/ttyS0',baudRate:number=57600){
    this.portName = portName;
    this.braudRate = baudRate;
    this.vmc.initializeSerialPort(portName,baudRate,this.log,this.readingData,true).then(() => {
      console.log('zdm8 Serial port initialized');
    });

  }
}
