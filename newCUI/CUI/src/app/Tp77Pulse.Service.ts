import { Injectable } from '@angular/core';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import * as moment from 'moment'; // Add moment import

@Injectable({
  providedIn: 'root'
})
export class Tp77PulseService implements ISerialService {
  pulseCount = 0;
  lastPulseTime = Date.now();
  pulsesPerBill = 15;
  totalValue = 0;
  pulseTimeout = 1000;
  machineId = '11111111';
  portName = '/dev/ttyS1';
  baudRate = 9600;
  log: IlogSerial = { data: '', limit: 50 };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;

  private T: NodeJS.Timeout;

  constructor(private serialService: SerialServiceService) {}

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }

  private initTop(): void {
    const that = this;

    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = event.data;
        that.addLogMessage(that.log, `Raw data: ${hexData}`);
        console.log('tp77 service  Received from device:', hexData);
        that.processPulseData(hexData);
      }
    });

    this.T = setInterval(() => {
      if (that.pulseCount > 0 && Date.now() - that.lastPulseTime > that.pulseTimeout) {
        that.processBill();
      }
    }, 1000);
  }

  private processPulseData(hexData: string): void {
    for (let i = 0; i < hexData.length; i += 2) {
      const byte = hexData.slice(i, i + 2);
      if (byte === '01') {
        this.pulseCount++;
        this.lastPulseTime = Date.now();
        this.addLogMessage(this.log, `Pulse detected. Count: ${this.pulseCount}`);
        console.log(`Pulse detected. Count: ${this.pulseCount}`);
      }
    }
  }

  private processBill(): void {
    if (this.pulseCount >= this.pulsesPerBill) {
      const billValue = 20;
      this.totalValue += billValue;
      this.addLogMessage(this.log, `Bill accepted: ${billValue} THB. Total: ${this.totalValue} THB`);
      console.log(`Bill accepted: ${billValue} THB. Total: ${this.totalValue} THB`);
    } else if (this.pulseCount > 0) {
      this.addLogMessage(this.log, `Incomplete pulse sequence: ${this.pulseCount} pulses`);
      console.log(`Incomplete pulse sequence: ${this.pulseCount} pulses`);
    }
    this.pulseCount = 0;
  }

  initializeSerialPort(
    portName: string,
    baudRate: number,
    log: IlogSerial,
    machineId: string,
    otp: string,
    isNative: ESerialPortType
  ): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      this.machineId = machineId;
      this.otp = otp;
      this.portName = portName || this.portName;
      this.baudRate = baudRate || this.baudRate;
      this.log = log;

      const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      if (init === this.portName) {
        this.initTop();
        resolve(init);
      } else {
        reject(init);
      }
    });
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>((resolve) => {
      switch (command) {
        case EMACHINE_COMMAND.POLL:
          resolve(PrintSucceeded(command, { totalValue: this.totalValue, pulseCount: this.pulseCount }, 'poll'));
          break;
        case EMACHINE_COMMAND.RESET:
          this.totalValue = 0;
          this.pulseCount = 0;
          this.addLogMessage(this.log, 'Total value reset');
          resolve(PrintSucceeded(command, {}, 'reset'));
          break;
        case EMACHINE_COMMAND.READ_EVENTS:
          resolve(PrintSucceeded(command, { totalValue: this.totalValue }, 'read events'));
          break;
        default:
          resolve(PrintSucceeded(command, params, 'unknown command'));
      }
    });
  }

  checkSum(data?: any[]): string {
    return data ? data.join('') : '';
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