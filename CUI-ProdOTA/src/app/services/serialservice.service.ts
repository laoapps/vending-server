import { Injectable, OnDestroy } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core/types/definitions';
import { Toast } from '@capacitor/toast';
import { SerialConnectionCapacitor, SerialPortListResult, SerialPortEventTypes } from 'SerialConnectionCapacitor';
import { addLogMessage, ESerialPortType, IlogSerial } from '../services/syste.model';
import { Subject } from 'rxjs';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root'
})
export class SerialServiceService  {
  public initialized = false;
  private serialEventSubject = new Subject<any>();
  private listenerSubscriptions: Array<Promise<PluginListenerHandle> & PluginListenerHandle> = [];

  constructor() {}


  async initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, isNative = ESerialPortType.Serial, dataBits = 8, stopBits = 1, parity = 'none', bufferSize = 1024, flags = 0): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      if (this.initialized) {
        console.log("Serial port already initialized, skipping...");
        Toast.show({ text: "Serial port already initialized, skipping..." });
        return reject('Serial port already initialized');
      }

      try {
        this.listenerSubscriptions.push(
          SerialConnectionCapacitor.addListener('serialOpened', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service Native serial opened:', data?.message);
            Toast.show({ text: 'Native serial opened' });
            this.serialEventSubject.next({ event: SerialPortEvent.SerialOpened, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('usbSerialOpened', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service USB serial opened:', data?.message);
            Toast.show({ text: 'USB serial opened' });
            this.serialEventSubject.next({ event: SerialPortEvent.UsbSerialOpened, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('connectionClosed', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service Connection closed:', data?.message);
            Toast.show({ text: 'Connection closed' });
            this.serialEventSubject.next({ event: SerialPortEvent.ConnectionClosed, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('serialWriteSuccess', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service Native write succeeded:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.SerialWriteSuccess, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('usbWriteSuccess', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service USB write succeeded:', data?.message);
            Toast.show({ text: 'USB write succeeded' });
            this.serialEventSubject.next({ event: SerialPortEvent.UsbWriteSuccess, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('dataReceived', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service Data received:', data?.data);
            this.serialEventSubject.next({ event: SerialPortEvent.DataReceived, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('readingStarted', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service Reading started:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.ReadingStarted, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('readingStopped', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service Reading stopped:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.ReadingStopped, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('commandAcknowledged', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service commandAcknowledged:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.CommandAcknowledged, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('portsListed', (data) => {
            addLogMessage(log, JSON.stringify(data), data?.ports);
            console.log('serial service List ports:', data?.ports);
            this.serialEventSubject.next({ event: SerialPortEvent.PortsListed, data: data?.ports });
          })
        );

        const result = await SerialConnectionCapacitor.listPorts();
        console.log("Available ports:", result.ports);
        addLogMessage(log, JSON.stringify(result), 'Listed ports');

        console.log("Opening port:", { portName, baudRate });
        if (isNative === ESerialPortType.Serial) {
          await SerialConnectionCapacitor.openSerial({ portName, baudRate, dataBits, stopBits, parity, bufferSize, flags });
        } else {
          await SerialConnectionCapacitor.openUsbSerial({ portName, baudRate, dataBits, stopBits, parity });
        }
        console.log(`Opened ${portName}`);
        this.initialized = true;
        resolve(portName);
      } catch (err) {
        console.log('serial service Error initializing serial port:', err);
        reject(err);
      }
    });
  }

  getSerialEvents() {
    return this.serialEventSubject.asObservable();
  }

  async startReadingVMC(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.initialized) {
          await SerialConnectionCapacitor.startReadingVMC();
          resolve('ReadingVMC started');
        } else {
          console.log('serial service Serial port not initialized');
          reject('Serial port not initialized');
        }
      } catch (e) {
        console.log('serial service startReadingVMC error', e);
        reject(e);
      }
    });
  }

  async startReading(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.initialized) {
          await SerialConnectionCapacitor.startReading();
          resolve('Reading started');
        } else {
          console.log('serial service Serial port not initialized');
          reject('Serial port not initialized');
        }
      } catch (e) {
        console.log('serial service startReading error', e);
        reject(e);
      }
    });
  }
 async startReadingMT102(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.initialized) {
          await SerialConnectionCapacitor.startReadingMT102();
          resolve('ReadingMT102 started');
        } else {
          console.log('serial service Serial port not initialized');
          reject('Serial port not initialized');
        }
      } catch (e) {
        console.log('serial service startReadingADH814 error', e);
        reject(e);
      }
    });
  }
  async startReadingADH814(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.initialized) {
          await SerialConnectionCapacitor.startReadingADH814();
          resolve('ReadingADH814 started');
        } else {
          console.log('serial service Serial port not initialized');
          reject('Serial port not initialized');
        }
      } catch (e) {
        console.log('serial service startReadingADH814 error', e);
        reject(e);
      }
    });
  }

  async stopReading(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.initialized) {
          await SerialConnectionCapacitor.stopReading();
          resolve('Reading stopped');
        } else {
          console.log('serial service Serial port not initialized');
          reject('Serial port not initialized');
        }
      } catch (e) {
        console.log('serial service stopReading error', e);
        reject(e);
      }
    });
  }

  async write(data: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.initialized) {
          const x = await SerialConnectionCapacitor.write({ data });
          console.log(`serial service writeData ${data}`);
          resolve(x);
        } else {
          console.log('write serial service Serial port not initialized');
          reject('Serial port not initialized');
        }
      } catch (e) {
        console.log('serial service writeData error', e);
        reject(e);
      }
    });
  }

  async writeVMC(command: string, params: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (!this.initialized) {
          console.log('write serial service Serial port not initialized');
          reject('Serial port not initialized');
          return;
        }
        const data = JSON.stringify({ command, params });
        console.log(`serial service Writing to VMC: ${data}`);
        const x = await SerialConnectionCapacitor.writeVMC({ data });
        console.log(`serial service Command queued: ${data}`);
        resolve(x);
      } catch (e) {
        console.log('serial service writeVMC error', e);
        reject(e);
      }
    });
  }
  async writeMT102(command: string, params: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (!this.initialized) {
          console.log('write serial service Serial port not initialized');
          reject('Serial port not initialized');
          return;
        }
        const data = JSON.stringify({ command, params });
        console.log(`serial service Writing to MT102: ${data}`);
        const x = await SerialConnectionCapacitor.writeMT102({ data });
        console.log(`serial service Command queued: ${data}`);
        resolve(x);
      } catch (e) {
        console.log('serial service writeVMC error', e);
        reject(e);
      }
    });
  }

  async writeADH814(data: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (!this.initialized) {
          console.log('write serial service Serial port not initialized');
          reject('Serial port not initialized');
          return;
        }
        console.log(`serial service Writing to ADH814: ${data}`);
        const x = await SerialConnectionCapacitor.writeADH814({ data });
        console.log(`serial service Command queued: ${data}`);
        resolve(x);
      } catch (e) {
        console.log('serial service writeADH814 error', e);
        reject(e);
      }
    });
  }

  isPortOpen(): boolean {
    return this.initialized;
  }

  async close(): Promise<void> {
    try {
      if (this.initialized) {
        await SerialConnectionCapacitor?.stopReading();
        await SerialConnectionCapacitor?.close();
        this.initialized = false;
        await Promise.all(this.listenerSubscriptions?.map(handle => handle?.remove()));
        this.listenerSubscriptions = [];
        this.serialEventSubject?.complete();
        console.log('serial service SerialServiceService destroyed and cleaned up');
      }
    } catch (e) {
      console.log('serial service close error', e);
      throw e;
    }
  }

  async listPorts(): Promise<SerialPortListResult> {
    try {
      const result = await SerialConnectionCapacitor.listPorts();
      console.log("Available ports:", result.ports);
      return result;
    } catch (err) {
      console.log('serial service Error listing ports:', err);
      throw err;
    }
  }

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string) {
    addLogMessage(log, message, consoleMessage);
  }

  int2hex(i: number) {
    const str = Number(i).toString(16);
    return str.length === 1 ? '0' + str : str;
  }

  bytesToHexString(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('')?.toUpperCase();
  }

  hexStringToArray(hex: string): string[] {
    hex = hex.replace(/\s+/g, '').toLowerCase();
    const hexArray: string[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      hexArray.push(hex.substring(i, i + 2));
    }
    return hexArray;
  }

  checkSumCRC(d: string[]): string {
    const data = d.join('');
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i += 2) {
      const byte = parseInt(data.substring(i, i + 2), 16);
      crc ^= byte;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x0001) {
          crc = (crc >> 1) ^ 0xA001;
        } else {
          crc >>= 1;
        }
      }
    }
    const crcHex = crc.toString(16).padStart(4, '0');
    return crcHex.substring(2) + crcHex.substring(0, 2);
  }

  chk8xor(byteArray = new Array<any>()) {
    let checksum = 0x00;
    for (let i = 0; i < byteArray.length - 1; i++) {
      checksum ^= parseInt(byteArray[i].replace(/^#/, ''), 16);
    }
    const x = checksum.toString(16);
    return x.length === 1 ? '0' + x : x;
  }

  arrayBufferToHex(arrayBuffer: Uint8Array) {
    return Array.from(new Uint8Array(arrayBuffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}

export enum SerialPortEvent {
  PortsListed = 'portsListed',
  SerialOpened = 'serialOpened',
  UsbSerialOpened = 'usbSerialOpened',
  ConnectionClosed = 'connectionClosed',
  UsbWriteSuccess = 'usbWriteSuccess',
  DataReceived = 'dataReceived',
  ReadingStarted = 'readingStarted',
  ReadingStopped = 'readingStopped',
  SerialWriteSuccess = 'serialWriteSuccess',
  CommandAcknowledged = 'commandAcknowledged',
  CommandQueued = 'commandQueued'
}