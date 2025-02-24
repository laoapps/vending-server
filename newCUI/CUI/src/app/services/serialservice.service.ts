import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { SerialConnectionCapacitor } from 'SerialConnectionCapacitor';

@Injectable({
  providedIn: 'root'
})
export class SerialServiceService {
  private initialized = false;  // Guard against multiple initializations

  constructor(public toast: ToastController) {
  }

  // Convert bytes to hex string
  bytesToHexString(bytes: number[]): string {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  async initializeSerialPort(portName: string, baudRate: number): Promise<void> {
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
        console.log('Native serial opened:', data.message);
      });
      SerialConnectionCapacitor.addListener('usbSerialOpened', (data) => {
        console.log('USB serial opened:', data.message);
      });
      SerialConnectionCapacitor.addListener('connectionClosed', (data) => {
        console.log('Connection closed:', data.message);
      });
      SerialConnectionCapacitor.addListener('nativeWriteSuccess', (data) => {
        console.log('Native write succeeded:', data.message);
      });
      SerialConnectionCapacitor.addListener('usbWriteSuccess', (data) => {
        console.log('USB write succeeded:', data.message);
      });
      SerialConnectionCapacitor.addListener('dataReceived', (data) => {
        console.log('Data received:', data.data);  // Log received data
      });
      SerialConnectionCapacitor.addListener('readingStarted', (data) => {
        console.log('Reading started:', data.message);
      });
      SerialConnectionCapacitor.addListener('readingStopped', (data) => {
        console.log('Reading stopped:', data.message);
      });
      SerialConnectionCapacitor.addListener('connectionError', (data) => {
        console.error('Connection error:', data.error);
      });
      SerialConnectionCapacitor.addListener('listError', (data) => {
        console.error('List error:', data.error);
      });
      SerialConnectionCapacitor.addListener('writeError', (data) => {
        console.error('Write error:', data.error);
      });
      SerialConnectionCapacitor.addListener('readError', (data) => {
        console.error('Read error:', data.error);
      });

      // Open serial port
      console.log("Opening openUsbSerial:", { portName, baudRate });
      await SerialConnectionCapacitor.openUsbSerial({ portName, baudRate });
      console.log(`Opened ${portName}`);

      // Write initial poll command
      const pollCommand = this.bytesToHexString([0xFA, 0xFB, 0x41, 0x00, 0x40]);
      await SerialConnectionCapacitor.write({ data: pollCommand });
      console.log(`Wrote to ${portName}: ${pollCommand}`);

      // Start reading
      await SerialConnectionCapacitor.startReading();
      console.log(`Started reading ${portName}`);

      this.initialized = true;  // Mark as initialized
    } catch (err) {
      console.error('Error initializing serial port:', err);
    }
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
}