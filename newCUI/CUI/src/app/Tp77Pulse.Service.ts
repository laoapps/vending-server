import { Injectable } from '@angular/core';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import { SerialPortListResult } from 'SerialConnectionCapacitor';

@Injectable({
  providedIn: 'root'
})
export class Tp77PulseService implements ISerialService {
  private pulseCount = 0;
  private lastPulseTime = Date.now();
  private totalValue = 0;
  private pulseTimeout = 1000; // Timeout in milliseconds to consider pulses complete
  private machineId = '11111111';
  private portName = '/dev/ttyS1';
  private baudRate = 9600; // Default RS232 baud rate, adjust if specified
  public log: IlogSerial = { data: '', limit: 50 };
  private otp = '111111';
  private parity: 'none' = 'none';
  private dataBits: 8 = 8;
  private stopBits: 1 = 1;
  machinestatus = {data:''};
  // Configurable pulse settings based on DIP switches
  private pulsesPerBillOptions = [
    15,   // SW1:OFF, SW2:OFF, SW3:OFF
    30,   // SW1:OFF, SW2:OFF, SW3:ON
    45,   // SW1:OFF, SW2:ON,  SW3:OFF
    60,   // SW1:OFF, SW2:ON,  SW3:ON
    75,   // SW1:ON,  SW2:OFF, SW3:OFF
    150,  // SW1:ON,  SW2:OFF, SW3:ON
    300,  // SW1:ON,  SW2:ON,  SW3:OFF
    1500  // SW1:ON,  SW2:ON,  SW3:ON
  ];
  private pulsesPerBill = this.pulsesPerBillOptions[0]; // Default to 15 pulses per 20 THB
  private billValue = 20; // Fixed value for THB 20 as per document

  private pulseTimer: NodeJS.Timeout | null = null;

  constructor(private serialService: SerialServiceService) {}

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }

  private initTp77(): void {
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = event.data;
        this.addLogMessage(this.log, `Raw data: ${hexData}`);
        this.processPulseData(hexData);
      } else if (event.event === 'serialOpened') {
        this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
      }
    });

    // Pulse timeout handling
    this.pulseTimer = setInterval(() => {
      if (this.pulseCount > 0 && Date.now() - this.lastPulseTime > this.pulseTimeout) {
        this.processBill();
      }
    }, 500); // Check every 500ms for better responsiveness
  }

  // Set the number of pulses per bill based on DIP switch configuration
  public setPulsesPerBill(pulseCount: number): void {
    if (this.pulsesPerBillOptions.includes(pulseCount)) {
      this.pulsesPerBill = pulseCount;
      this.addLogMessage(this.log, `Pulses per bill set to: ${pulseCount}`);
    } else {
      this.addLogMessage(this.log, `Invalid pulse count: ${pulseCount}. Valid options: ${this.pulsesPerBillOptions.join(', ')}`);
    }
  }

  private processPulseData(hexData: string): void {
    // Assuming the TP77 sends a pulse as a transition (e.g., '01' for high, '00' for low)
    // Adjust this logic based on actual pulse signal specifics if documented
    for (let i = 0; i < hexData.length; i += 2) {
      const byte = hexData.slice(i, i + 2).toLowerCase();
      // Detect pulse transition (e.g., '01' indicates a pulse)
      if (byte === '01') {
        this.pulseCount++;
        this.lastPulseTime = Date.now();
        this.addLogMessage(this.log, `Pulse detected. Count: ${this.pulseCount}`);
      }
    }
  }

  private processBill(): void {
    if (this.pulseCount >= this.pulsesPerBill) {
      const billsDetected = Math.floor(this.pulseCount / this.pulsesPerBill);
      const valueAdded = billsDetected * this.billValue;
      this.totalValue += valueAdded;
      this.addLogMessage(this.log, `Bill accepted: ${valueAdded} THB (${billsDetected} x 20 THB). Total: ${this.totalValue} THB`);
      this.pulseCount -= billsDetected * this.pulsesPerBill; // Reset only the pulses used
    } else if (this.pulseCount > 0) {
      this.addLogMessage(this.log, `Incomplete pulse sequence: ${this.pulseCount} pulses (expected ${this.pulsesPerBill})`);
    } else {
      this.addLogMessage(this.log, 'No pulses to process');
    }
    if (this.pulseCount === 0) {
      this.lastPulseTime = Date.now(); // Reset timer if no pulses remain
    }
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
      this.serialService.startReading();

      if (init === this.portName) {
        this.initTp77();
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
          this.lastPulseTime = Date.now();
          this.addLogMessage(this.log, 'Total value and pulse count reset');
          resolve(PrintSucceeded(command, {}, 'reset'));
          break;
        case EMACHINE_COMMAND.READ_EVENTS:
          resolve(PrintSucceeded(command, { totalValue: this.totalValue, pulseCount: this.pulseCount }, 'read events'));
          break;
        case EMACHINE_COMMAND.SET_PULSE_COUNT:
          if (params && typeof params.pulseCount === 'number') {
            this.setPulsesPerBill(params.pulseCount);
            resolve(PrintSucceeded(command, { pulsesPerBill: this.pulsesPerBill }, 'pulse count set'));
          } else {
            resolve(PrintSucceeded(command, {}, 'invalid pulse count parameter'));
          }
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
    if (this.pulseTimer) clearInterval(this.pulseTimer);
    this.pulseTimer = null;
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return  this.serialService.listPorts();
  }
}