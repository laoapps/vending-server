import { Injectable, OnDestroy } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core/types/definitions';
import { ToastController } from '@ionic/angular';
import { SerialConnectionCapacitor, SerialPortListResult, SerialPortEventTypes } from 'SerialConnectionCapacitor';
import { addLogMessage, ESerialPortType, IlogSerial } from '../services/syste.model'
import { Subject, Subscription, } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class SerialServiceService implements OnDestroy {
  private initialized = false;  // Guard against multiple initializations

  // Subject to broadcast serial events to subscribers
  private serialEventSubject = new Subject<any>();
  // Subscriptions to Capacitor listeners for cleanup
  private listenerSubscriptions: Array<Promise<PluginListenerHandle> & PluginListenerHandle> = [];
  constructor() {
  }



  async ngOnDestroy() {
    this.initialized = false;
    await this.close();  // Close serial port
    // Remove all Capacitor listeners
    await Promise.all(this.listenerSubscriptions.map(handle => handle.remove()));
    this.listenerSubscriptions = [];
    this.serialEventSubject.complete();  // Complete the subject
    console.log('serial service  SerialServiceService destroyed and cleaned up');
  }
  async initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, isNative = ESerialPortType.Serial, dataBits = 8, stopBits = 1, parity = 'none', bufferSize = 1024, flags = 0): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      if (this.initialized) {
        console.log("Serial port already initialized, skipping...");
        return reject('Serial port already initialized');
      }

      try {
        // Add event listeners
        // Add event listeners and store subscriptions
        this.listenerSubscriptions.push(
          SerialConnectionCapacitor.addListener('serialOpened', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  Native serial opened:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.SerialOpened, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('usbSerialOpened', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  USB serial opened:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.UsbSerialOpened, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('connectionClosed', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  Connection closed:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.ConnectionClosed, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('serialWriteSuccess', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  Native write succeeded:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.SerialWriteSuccess, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('usbWriteSuccess', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  USB write succeeded:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.UsbWriteSuccess, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('dataReceived', (data) => {
            console.log('serial service  Serial Data received: ' + JSON.stringify(data));
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  Data received:', data?.data);
            this.serialEventSubject.next({ event: SerialPortEvent.DataReceived, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('readingStarted', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  Reading started:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.ReadingStarted, data: data?.data });
          }),
          SerialConnectionCapacitor.addListener('readingStopped', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  Reading stopped:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.ReadingStopped, data: data?.data });
          }),
          // commandAcknowledged
          SerialConnectionCapacitor.addListener('commandAcknowledged', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service commandAcknowledged:', data?.message);
            this.serialEventSubject.next({ event: SerialPortEvent.CommandAcknowledged, data: data?.data });
          }),


          SerialConnectionCapacitor.addListener('portsListed', (data) => {
            !log || this.addLogMessage(log, JSON.stringify(data), data?.message);
            console.log('serial service  serial service  List error:', data?.error);
            this.serialEventSubject.next({ event: SerialPortEvent.PortsListed, data: data?.data });
          })
          // Note: 'readingData' event isn't in your plugin—remove or implement if needed
        );


        const result = await SerialConnectionCapacitor.listPorts();

        console.log("Available ports:", result.ports);

        this.addLogMessage(log, JSON.stringify(result), 'Listed ports');
        // Open serial port
        console.log("Opening openNativeSerial:", { portName, baudRate });
        if (isNative === ESerialPortType.Serial)
          await SerialConnectionCapacitor.openSerial({ portName, baudRate, dataBits, stopBits, parity, bufferSize, flags });
        else
          await SerialConnectionCapacitor.openUsbSerial({ portName, baudRate });
        console.log(`Opened ${portName}`);

        console.log(`Started reading ${portName}`);
        this.initialized = true;  // Mark as initialized
        resolve(portName);
      } catch (err) {
        console.log('serial service  serial service  Error initializing serial port:', err);
        reject(err);
      }
    });

  }
  // Public method for components to subscribe to serial events
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
          console.log('VMC serial service  Serial port not initialized');
          reject('VMC Serial port not initialized');
        }
      } catch (e) {
        console.log('VMC serial service  startReading error', e);
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
          console.log('serial service  Serial port not initialized');
          reject('Serial port not initialized');
        }
      } catch (e) {
        console.log('serial service  startReading error', e);
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
          console.log('serial service  Serial port not initialized');
          reject('Serial port not initialized');
        }
      } catch (e) {
        console.log('serial service  stopReading error', e);
        reject(e);
      }
    });
  }
  async write(data: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.initialized) {
          const x = await SerialConnectionCapacitor.write({ data });
          console.log(`writeData  ${data}`);
          resolve(x);
        }
        else {
          console.log('serial service  Serial port not initialized');
          reject('Serial port not initialized');
        }
      }
      catch (e) {
        console.log('serial service  writeData error', e);
        reject(e);
      }
    });
  }
  async writeVMC(command: string, params: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (!this.initialized) {
          console.log('serial service  Serial port not initialized');
          reject('Serial port not initialized');
          return;
        }
        const data = JSON.stringify({ command, params });
        console.log(`serial service  Writing to VMC: ${data}`);
        const x = await SerialConnectionCapacitor.writeVMC({ data });
        console.log(`serial service  Command queued: ${data}`);
        resolve(x);
      } catch (e) {
        console.log('serial service  writeVMC error', e);
        reject(e);
      }
    });
  }
  isPortOpen(): boolean {
    return this.initialized;
  }
  async close(): Promise<any> {
    await SerialConnectionCapacitor.stopReading();
    this.initialized = false;
    await Promise.all(this.listenerSubscriptions.map(handle => handle.remove()));
    this.listenerSubscriptions = [];
    this.serialEventSubject.complete();  // Complete the subject
    console.log('serial service  SerialServiceService destroyed and cleaned up');
    const x = await SerialConnectionCapacitor.close();
    console.log('serial service  Serial port closed');

    return new Promise((resolve, reject) => {
      resolve(x);
    });
  }
  // Optional: Method to list ports on demand
  async listPorts(): Promise<SerialPortListResult> {
    try {
      const result = await SerialConnectionCapacitor.listPorts();
      console.log("Available ports:", result.ports);
      return new Promise((resolve, reject) => {
        resolve(result);
      });
    } catch (err) {
      console.log('serial service  serial service  Error listing ports:', err);
      return new Promise((resolve, reject) => { reject(err); }
      );
    }
  }
  //this.addLogMessage(log, JSON.stringify(data), data?.message);
  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string) {
    addLogMessage(log, message, consoleMessage);
  }
  int2hex(i: number) {
    const str = Number(i).toString(16);
    return str.length === 1 ? '0' + str : str;
  }

  // Convert bytes to hex string
  bytesToHexString(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  hexStringToArray(hex: string): string[] {
    // Remove spaces if any and ensure even-length
    hex = hex.replace(/\s+/g, '').toLowerCase();

    // Split into pairs
    const hexArray: string[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      hexArray.push(hex.substring(i, i + 2));
    }

    return hexArray;
  }

  checkSumCRC(d: string[]): string {
    const data = d.join('');
    let crc = 0xFFFF; // Initial CRC value
    for (let i = 0; i < data.length; i += 2) {
      const byte = parseInt(data.substring(i, i + 2), 16); // Convert hex string to byte
      crc ^= byte; // XOR with the current byte
      for (let j = 0; j < 8; j++) {
        if (crc & 0x0001) { // Check if the least significant bit is set
          crc = (crc >> 1) ^ 0xA001; // Shift right and XOR with polynomial
        } else {
          crc >>= 1; // Just shift right
        }
      }
    }
    // Convert the CRC to a 4-character hexadecimal string
    const crcHex = crc.toString(16).padStart(4, '0');
    // Swap the bytes (little-endian to big-endian)
    return crcHex.substring(2) + crcHex.substring(0, 2);
  }

  chk8xor(byteArray = new Array<any>()) {
    let checksum = 0x00
    for (let i = 0; i < byteArray.length - 1; i++)
      checksum ^= parseInt(byteArray[i].replace(/^#/, ''), 16)
    const x = checksum.toString(16);
    if (x.length == 1) return '0' + x;
    return x;
  }
  // Helper: ArrayBuffer to hex string
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
