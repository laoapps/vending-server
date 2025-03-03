import { Injectable } from '@angular/core';
import { EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import { Buffer } from 'buffer';

@Injectable({
  providedIn: 'root'
})
export class Tp77PulseService implements ISerialService {
  pulseCount = 0;
  lastPulseTime = Date.now();
  pulsesPerBill = 15; // Adjust based on DIP switch (e.g., 15, 30, 45, etc.)
  totalValue = 0; // Total THB accumulated
  pulseTimeout = 1000; // 1s timeout to detect end of pulse sequence
  machineId = '11111111';
  portName = '/dev/ttyS1';
  baudRate = 9600;
  log: IlogSerial = { data: '' };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;

  private T: NodeJS.Timeout;

  constructor(private serialService: SerialServiceService) {}

  // Initialize pulse protocol listener
  private initTop(): void {
    const that = this;

    // Subscribe to serial events
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = Buffer.from(event.data as any).toString('hex'); // Convert to hex string
        that.log.data += `Raw data: ${hexData}\n`;
        console.log('Received from device:', hexData);
        that.processPulseData(hexData);
      }
    });

    // Start timeout checker for pulse sequence completion
    this.T = setInterval(() => {
      if (that.pulseCount > 0 && Date.now() - that.lastPulseTime > that.pulseTimeout) {
        that.processBill();
      }
    }, 1000);
  }

  // Process incoming pulse data
  private processPulseData(hexData: string): void {
    // Assuming each '01' byte is a pulse (adjust based on actual TP77P3B output)
    for (let i = 0; i < hexData.length; i += 2) {
      const byte = hexData.slice(i, i + 2);
      if (byte === '01') { // Example pulse byte
        this.pulseCount++;
        this.lastPulseTime = Date.now();
        this.log.data += `Pulse detected. Count: ${this.pulseCount}\n`;
        console.log(`Pulse detected. Count: ${this.pulseCount}`);
      }
    }
  }

  // Process completed pulse sequence
  private processBill(): void {
    if (this.pulseCount >= this.pulsesPerBill) {
      const billValue = 20; // THB
      this.totalValue += billValue;
      this.log.data += `Bill accepted: ${billValue} THB. Total: ${this.totalValue} THB\n`;
      console.log(`Bill accepted: ${billValue} THB. Total: ${this.totalValue} THB`);
    } else if (this.pulseCount > 0) {
      this.log.data += `Incomplete pulse sequence: ${this.pulseCount} pulses\n`;
      console.log(`Incomplete pulse sequence: ${this.pulseCount} pulses`);
    }
    this.pulseCount = 0; // Reset for next bill
  }

  // Initialize serial port and pulse protocol
  initializeSerialPort(
    portName: string,
    baudRate: number,
    log: IlogSerial,
    machineId: string,
    otp: string,
    isNative: ESerialPortType
  ): Promise<void> {
    this.machineId = machineId;
    this.otp = otp;
    this.portName = portName || this.portName;
    this.baudRate = baudRate || this.baudRate;
    this.log = log ;

    return this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative)
      .then(() => this.initTop());
  }

  // Execute machine commands
  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>((resolve) => {
      switch (command) {
        case EMACHINE_COMMAND.POLL:
          // No active polling in pulse mode; return current state
          resolve(PrintSucceeded(command, { totalValue: this.totalValue, pulseCount: this.pulseCount }, 'poll'));
          break;
        case EMACHINE_COMMAND.RESET:
          this.totalValue = 0;
          this.pulseCount = 0;
          this.log.data += 'Total value reset\n';
          resolve(PrintSucceeded(command, {}, 'reset'));
          break;
        case EMACHINE_COMMAND.READ_EVENTS:
          // Return accumulated total as an "event"
          resolve(PrintSucceeded(command, { totalValue: this.totalValue }, 'read events'));
          break;
        default:
          resolve(PrintSucceeded(command, params, 'unknown command'));
      }
    });
  }

  checkSum(data?: any[]): string {
    return data ? data.join('') : ''; // Simple concatenation, not used in pulse mode
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  close(): Promise<void> {
    if (this.T) clearInterval(this.T);
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return await this.serialService.listPorts();
  }
}

// Usage example in Angular component
/*
import { Component, OnInit } from '@angular/core';
import { Tp77p3bcashacceptorService } from './tp77p3bcashacceptor.service';

@Component({
  selector: 'app-root',
  template: `<div>{{ log }}</div>`,
})
export class AppComponent implements OnInit {
  log: string = '';

  constructor(private tp77Service: Tp77p3bcashacceptorService) {}

  ngOnInit() {
    this.tp77Service.initializeSerialPort('/dev/ttyS1', 9600, { data: '' }, '11111111', '111111', ESerialPortType.NATIVE)
      .then(() => {
        this.tp77Service.getSerialEvents().subscribe((event) => {
          this.log = this.tp77Service.log.data;
        });
        // Example command
        this.tp77Service.command(EMACHINE_COMMAND.POLL, {}, 1)
          .then((res) => console.log('Poll result:', res));
      })
      .catch((err) => console.error('Init error:', err));
  }
}
*/