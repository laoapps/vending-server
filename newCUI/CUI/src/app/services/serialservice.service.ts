import { Injectable, OnDestroy } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core/types/definitions';
import { ToastController } from '@ionic/angular';
import { SerialConnectionCapacitor, SerialPortListResult, SerialPortEventTypes } from 'SerialConnectionCapacitor';
import crc from 'crc';
import { ESerialPortType, IlogSerial } from '../services/syste.model'
import { Subject, Subscription, } from 'rxjs';
import { Buffer } from 'buffer';


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


  // Cleanup on service destruction (app close)
  async ngOnDestroy() {
    this.initialized = false;
    await this.close();  // Close serial port
    // Remove all Capacitor listeners
    await Promise.all(this.listenerSubscriptions.map(handle => handle.remove()));
    this.listenerSubscriptions = [];
    this.serialEventSubject.complete();  // Complete the subject
    console.log('SerialServiceService destroyed and cleaned up');
  }
  async initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, isNative = ESerialPortType.Serial): Promise<void> {
    if (this.initialized) {
      console.log("Serial port already initialized, skipping...");
      return;
    }

    try {
      // Add event listeners
      // Add event listeners and store subscriptions
      this.listenerSubscriptions.push(
        SerialConnectionCapacitor.addListener('serialOpened', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.log('Native serial opened:', data?.message);
          this.serialEventSubject.next({ event: SerialPortEvent.NativeSerialOpened, data });
        }),
        SerialConnectionCapacitor.addListener('usbSerialOpened', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.log('USB serial opened:', data?.message);
          this.serialEventSubject.next({ event: SerialPortEvent.UsbSerialOpened, data });
        }),
        SerialConnectionCapacitor.addListener('connectionClosed', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.log('Connection closed:', data?.message);
          this.serialEventSubject.next({ event: SerialPortEvent.ConnectionClosed, data });
        }),
        SerialConnectionCapacitor.addListener('serialWriteSuccess', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.log('Native write succeeded:', data?.message);
          this.serialEventSubject.next({ event: SerialPortEvent.NativeWriteSuccess, data });
        }),
        SerialConnectionCapacitor.addListener('usbWriteSuccess', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.log('USB write succeeded:', data?.message);
          this.serialEventSubject.next({ event: SerialPortEvent.NativeWriteSuccess, data });
        }),
        SerialConnectionCapacitor.addListener('dataReceived', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.log('Data received:', data?.data);
          this.serialEventSubject.next({ event: SerialPortEvent.DataReceived, data });
        }),
        SerialConnectionCapacitor.addListener('readingStarted', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.log('Reading started:', data?.message);
          this.serialEventSubject.next({ event: SerialPortEvent.ReadingStarted, data });
        }),
        SerialConnectionCapacitor.addListener('readingStopped', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.log('Reading stopped:', data?.message);
          this.serialEventSubject.next({ event: SerialPortEvent.ReadingStopped, data });
        }),


        SerialConnectionCapacitor.addListener('portsListed', (data) => {
          !log || (log.data += JSON.stringify(data) + '\n');
          console.error('List error:', data?.error);
          this.serialEventSubject.next({ event: SerialPortEvent.ListError, data });
        })
        // Note: 'readingData' event isn't in your plugin—remove or implement if needed
      );
      // SerialConnectionCapacitor.addListener('readingData', (data) => {
      //   if (reading) {
      //     if (reading.data.split('\n').length > reading?.len || 100)
      //       reading.data.split('\n').shift();
      //     reading.data += JSON.stringify(data) + '\n';
      //     this.serialEventSubject.next({ event: SerialPortEvent.ReadingData, data });
      //   }

      //   // console.log('Reading data:', data?.data);
      // }
      // );

      const result = await SerialConnectionCapacitor.listPorts();

      console.log("Available ports:", result.ports);

      log.data += JSON.stringify(result) + '\n';
      // Open serial port
      console.log("Opening openNativeSerial:", { portName, baudRate });
      if (isNative === ESerialPortType.Serial)
        await SerialConnectionCapacitor.openSerial({ portName, baudRate });
      else
        await SerialConnectionCapacitor.openUsbSerial({ portName, baudRate });
      console.log(`Opened ${portName}`);
      // Start reading
      await SerialConnectionCapacitor.startReading();
      console.log(`Started reading ${portName}`);
      this.initialized = true;  // Mark as initialized
    } catch (err) {
      console.error('Error initializing serial port:', err);
    }
  }
  // Public method for components to subscribe to serial events
  getSerialEvents() {
    return this.serialEventSubject.asObservable();
  }

  async write(data: string): Promise<any> {
    try {
      if (this.initialized) {
        const x = await SerialConnectionCapacitor.write({ data });
        console.log(`writeData  ${data}`);
        return x;
      }
      else {
        console.log('Serial port not initialized');
        return null;
      }
    }
    catch (e) {
      console.log('writeData error', e);
    }
  }

  async close(): Promise<any> {
    await SerialConnectionCapacitor.stopReading();
    this.initialized = false;
    await Promise.all(this.listenerSubscriptions.map(handle => handle.remove()));
    this.listenerSubscriptions = [];
    this.serialEventSubject.complete();  // Complete the subject
    console.log('SerialServiceService destroyed and cleaned up');
    const x = await SerialConnectionCapacitor.close();
    console.log('Serial port closed');
    
    return x;
  }
  // Optional: Method to list ports on demand
  async listPorts(): Promise<SerialPortListResult> {
    try {
      const result = await SerialConnectionCapacitor.listPorts();
      console.log("Available ports:", result.ports);
      return result;
    } catch (err) {
      console.error('Error listing ports:', err);
    }
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
  // checkSumCRC(buff: string[]): string {
  //   try {
  //     let x = crc.crc16modbus(Buffer.from(buff.join(''), 'hex')).toString(16);
  //     x.length < 4 ? x = '0' + x : '';
  //     console.log(x);
  //     console.log(x.substring(2) + x.substring(0, 2));

  //     return x.substring(2) + x.substring(0, 2);
  //   }
  //   catch (e) {
  //     console.log('error', e);
  //     return '';
  //   }
  // }
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
}

export enum SerialPortEvent {
  PortsListed = 'portsListed',
  ConnectionOpened = 'connectionOpened',
  NativeSerialOpened = 'nativeSerialOpened',
  UsbSerialOpened = 'usbSerialOpened',
  ConnectionClosed = 'connectionClosed',
  NativeWriteSuccess = 'nativeWriteSuccess',
  UsbWriteSuccess = 'usbWriteSuccess',
  DataReceived = 'dataReceived',
  ReadingStarted = 'readingStarted',
  ReadingStopped = 'readingStopped',
  ListError = 'listError',
  ConnectionError = 'connectionError',
  WriteError = 'writeError',
  ReadError = 'readError',
  ReadingData = 'readingData',
  mcNativeSerialOpened = 'mcNativeSerialOpened',
  mcNativeWriteSuccess = "mcNativeWriteSuccess",

}
