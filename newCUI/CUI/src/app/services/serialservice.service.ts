import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { SerialConnectionCapacitor } from 'SerialConnectionCapacitor';
import crc from 'crc';
@Injectable({
  providedIn: 'root'
})
export class SerialServiceService {
  private initialized = false;  // Guard against multiple initializations
  log = '';
  pcbarray = '01'
  constructor(public toast: ToastController) {
  }

  // Convert bytes to hex string
  bytesToHexString(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  async initializeSerialPort(portName: string, baudRate: number, log: { data: string },reading:{data:string}): Promise<void> {
    if (this.initialized) {
      console.log("Serial port already initialized, skipping...");
      return;
    }

    try {
      // List ports once
      // const result = await SerialConnectionCapacitor.listPorts();
      // console.log("Available ports:", result.ports);

      // Add listeners before opening
      SerialConnectionCapacitor.addListener('nativeSerialOpened', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.log('Native serial opened:', data?.message);
      });
      SerialConnectionCapacitor.addListener('usbSerialOpened', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.log('USB serial opened:', data?.message);
      });
      SerialConnectionCapacitor.addListener('connectionClosed', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.log('Connection closed:', data?.message);
      });
      SerialConnectionCapacitor.addListener('nativeWriteSuccess', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.log('Native write succeeded:', data?.message);
      });
      SerialConnectionCapacitor.addListener('usbWriteSuccess', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.log('USB write succeeded:', data?.message);
      });
      SerialConnectionCapacitor.addListener('dataReceived', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.log('Data received:', data?.data);  // Log received data
      });
      SerialConnectionCapacitor.addListener('readingStarted', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.log('Reading started:', data?.message);
      });
      SerialConnectionCapacitor.addListener('readingStopped', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.log('Reading stopped:', data?.message);
      });
      SerialConnectionCapacitor.addListener('connectionError', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.error('Connection error:', data?.error);
      });
      SerialConnectionCapacitor.addListener('listError', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.error('List error:', data?.error);
      });
      SerialConnectionCapacitor.addListener('writeError', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.error('Write error:', data?.error);
      });
      SerialConnectionCapacitor.addListener('readError', (data) => {
        log.data += JSON.stringify(data) + '\n';
        console.error('Read error:', data?.error);
      });
      SerialConnectionCapacitor.addListener('readingData', (data) => {
        
        if(reading.data.split('\n').length>50)
          reading.data.split('\n').shift();
        reading.data += JSON.stringify(data) + '\n';
        console.log('Reading data:', data?.data);
      }
      );

      const result = await SerialConnectionCapacitor.listPorts();
      console.log("Available ports:", result.ports);
      log.data += JSON.stringify(result) + '\n';
      // Open serial port
      console.log("Opening openNativeSerial:", { portName, baudRate });
      await SerialConnectionCapacitor.openNativeSerial({ portName, baudRate });
      // Start reading
      await SerialConnectionCapacitor.startReading();
      console.log(`Started reading ${portName}`);

      console.log(`Opened ${portName}`);

      // Write initial poll command
      // const pollCommand = bytesToHexString([0xFA, 0xFB, 0x41, 0x00, 0x40]);




      this.initialized = true;  // Mark as initialized
    } catch (err) {
      console.error('Error initializing serial port:', err);
    }
  }

  checkSum(buff: string[]): string {
    try {
        let hexString = buff.join('');
        let data = new Uint8Array(buff.map(b => parseInt(b, 16))); // Replace Buffer
        let x = crc.crc16modbus(data).toString(16);

        x = x.padStart(4, '0'); // Ensure 4 characters
        return x.substring(2) + x.substring(0, 2); // Swap bytes
    } catch (e) {
        console.error('Error:', e);
        return '';
    }
}
  async write(data: any) {
    try {

      await SerialConnectionCapacitor.write({ data });
      console.log(`writeData  ${data}`);
    }
    catch (e) {
      console.log('writeData error', e);
    }
  }

  int2hex(i: number) {
    const str = Number(i).toString(16);
    return str.length === 1 ? '0' + str : str;
  }
  shipOrder(s = 2,log:{data:string}=null) {
    const slot = this.int2hex(s - 1);
    const isspring = '01';
    const dropdetect = '00';
    const liftsystem = '00';
    let buff = [this.pcbarray, '10', '20', '01', '00', '02', '04', slot, isspring, dropdetect, liftsystem];
    // 011000010002040A010000

    let check = this.checkSum(buff)
    const x = buff.join('') + check;
    console.log('shipOrder', x);
    if(log)
    log.data += 'shipOrder' + x + '\n';
    this.write(x);
  }
  // Optional: Method to list ports on demand
  async listPorts(): Promise<void> {
    try {
      const result = await SerialConnectionCapacitor.listPorts();

      console.log("Available ports:", result.ports);
    } catch (err) {
      console.error('Error listing ports:', err);
    }
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
   chk8xor(byteArray = new Array<any>()) {
    let checksum = 0x00
    for (let i = 0; i < byteArray.length - 1; i++)
        checksum ^= parseInt(byteArray[i].replace(/^#/, ''), 16)
    const x = checksum.toString(16);
    if (x.length == 1) return '0' + x;
    return x;
}
}