import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { interval, Subscription } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class MT102Service implements ISerialService {
  private m102: M102Protocol;
  private machineId = '11111111';
  private portName = '/dev/ttyS1';
  private baudRate = 9600;
  public log: IlogSerial = { data: '', limit: 50 };
  private otp = '111111';
  private parity: 'none' = 'none';
  private dataBits: 8 = 8;
  private stopBits: 1 = 1;
  private totalValue = 0; // Optional: for tracking if MT102 reports values
  machinestatus = { data: '' };
  private serialEventsSubscription: Subscription | null = null;
  private pollingSubscription: Subscription | null = null;
  private pollingIntervalMs = 200; // Poll every 500ms  
  constructor(private serialService: SerialServiceService) {

  }

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }

  private setupListeners(): void {
    this.serialEventsSubscription = this.getSerialEvents().subscribe((event) => {
      this.m102.on('SERIAL_NUMBER', ({ details }) => {
        this.addLogMessage(this.log, `Serial Number: ${this.formatHexArray(details)}`);
      });
      this.m102.on('MOTOR_POLL', ({ details }) => {
        const status = {
          executionStatus: details![0], // 0=Idle, 1=Execute, 2=Executed
          runningMotor: details![1], // 0-59
          executionResult: details![2],
          peakCurrent: (details![3] << 8) | details![4], // mA
          averageCurrent: (details![5] << 8) | details![6], // mA
          runningTime: (details![7] << 8) | details![8], // ms
          lightCurtainState: details![9] // 0=no drop, 1-200=ms
        };
        this.machinestatus.data = JSON.stringify(status);
        this.addLogMessage(this.log, `Motor Poll: ${JSON.stringify(status)}`);
      });
      this.m102.on('MOTOR_RUN', ({ details }) => {
        const result = details?.[0] === 0 ? 'Success' : `Error ${details?.[0]}`;
        this.addLogMessage(this.log, `Motor Run Result: ${result}`);
        if (details?.[0] === 0) this.totalValue++; // Increment for successful motor run
      });
      this.m102.on('TEMPERATURE', ({ details }) => {
        const temp = (details![0] << 8) | details![1];
        this.addLogMessage(this.log, `Temperature: ${temp / 10} °C`);
      });
      this.m102.on('SWITCH_OUTPUT', ({ details }) => {
        this.addLogMessage(this.log, `Switch Output: Index ${details![0]}, Result ${details![1]}`); // 0-7
      });
      this.m102.on('SWITCH_INPUT', ({ details }) => {
        this.addLogMessage(this.log, `Switch Input (0-7): ${this.formatHexArray(details.slice(0, 8))}`); // 0-7
      });
      this.m102.on('ADDRESS_SET', ({ details }) => {
        this.addLogMessage(this.log, `Address Set: ${details![0]}`);
      });
      this.m102.on('ERROR', ({ details }) => {
        this.addLogMessage(this.log, `Error: Code ${details?.[0]}`);
      });

      this.getSerialEvents().subscribe((event) => {
        if (event.event === 'dataReceived') {
          const hexData = event.data;
          this.addLogMessage(this.log, `Raw data: ${hexData}`);
          try {
            this.m102.parseResponse(hexData);
          } catch (error) {
            this.addLogMessage(this.log, `Parse error: ${error.message}`);
          }
        } else if (event.event === 'serialOpened') {
          this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
          setTimeout(() => {
            // Start setup after a delay to ensure port is ready
             this.setupDevice().catch(err => {
            this.addLogMessage(this.log, `Setup failed: ${err.message}`);
          });
          },10000);
         
        }
      });
    });
  }

  private formatHexArray(data: number[]): string {
    return data.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }

  private initM102(slaveAddress: number = 1): void {
    this.m102 = new M102Protocol(slaveAddress);
    this.setupListeners();
  }

  private async setupDevice(): Promise<void> {
    try {
      const serialNumberPacket = this.m102.getSerialNumber();
      await this.serialService.write(serialNumberPacket);
      this.addLogMessage(this.log, 'MT102 setup complete');
      // this.startPolling(); // Start polling after setup
    } catch (err) {
      this.addLogMessage(this.log, `Setup error: ${err.message}`);
      return Promise.reject(err);
    }
    return Promise.resolve();
  }
  public startPolling(): void {
    if (this.pollingSubscription) {
      this.addLogMessage(this.log, 'Polling already active');
      return;
    }

    this.pollingSubscription = interval(this.pollingIntervalMs).subscribe(async () => {
      try {
        const result = await this.command(EMACHINE_COMMAND.POLL, {}, Date.now());
        this.addLogMessage(this.log, `Poll result: ${JSON.stringify(result)}`);
        // Update machinestatus based on MOTOR_POLL event (handled in setupListeners)
      } catch (error) {
        this.addLogMessage(this.log, `Polling error: ${error.message}`);
      }
    });
    this.addLogMessage(this.log, 'Polling started');
  }

  // Stop polling
  public stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
      this.addLogMessage(this.log, 'Polling stopped');
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

      try {
        const init = await this.serialService.initializeSerialPort(
          this.portName,
          this.baudRate,
          this.log
        );
        if (init !== this.portName) {
          this.addLogMessage(this.log, `Serial port mismatch: Expected ${this.portName}, got ${init}`);
          return reject(new Error(`Serial port mismatch: Expected ${this.portName}, got ${init}`));
        }
        this.initM102(); // Initialize M102 protocol

        await this.serialService.startReading(); // Start reading to trigger M102 setup and polling
        this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
        resolve(init);
      } catch (error) {
        this.addLogMessage(this.log, `Serial port initialization failed: ${error.message}`);
        reject(error);
      }
    });
  }

  async command(command: EMACHINE_COMMAND, params: any, transactionID: number, retries = 3): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      if (!this.m102) {
        reject(new Error('MT102 protocol not initialized'));
        return;
      }
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          let m102Command: string;
          const { motorIndex = 0, motorType = 3, lightCurtainMode = 0, overcurrent = 100, undercurrent = 50, timeout = 70 } = params || {};
          switch (command) {
            case EMACHINE_COMMAND.POLL:
              m102Command = this.m102.motorPoll();
              break;
            case EMACHINE_COMMAND.shippingcontrol: // Renamed for clarity

              m102Command = this.m102.motorRun(motorIndex, motorType, lightCurtainMode, overcurrent, undercurrent, timeout);
              break;
            case EMACHINE_COMMAND.READ_TEMP:
              m102Command = this.m102.readTemp();
              break;
            case EMACHINE_COMMAND.READ_SWITCH_OUTPUT:
              const { switchIndex = 0 } = params || {};
              if (switchIndex < 0 || switchIndex > 7) throw new Error('Switch index must be 0-7');
              m102Command = this.m102.writeDO(switchIndex, 0); // Read by setting operation to 0
              break;
            case EMACHINE_COMMAND.READ_SWITCH_INPUT:
              m102Command = this.m102.readDI();
              break;
            case EMACHINE_COMMAND.SET_ADDRESS:
              const { newAddress = 1 } = params || {};
              m102Command = this.m102.setAddress(newAddress);
              break;
            case EMACHINE_COMMAND.RESET:
              resolve(PrintSucceeded(command, {}, 'reset'));
              return;
            case EMACHINE_COMMAND.READ_EVENTS:
              resolve(PrintSucceeded(command, {}, 'no events tracked'));
              return;
            case EMACHINE_COMMAND.MOTOR_SCAN:
              m102Command = this.m102.motorScan(motorIndex);
              break;
            default:
              resolve(PrintSucceeded(command, params, 'unknown command'));
              return;
          }

          this.addLogMessage(this.log, `Sending (Attempt ${attempt}): ${m102Command}`);
          const message=await this.serialService.write(m102Command);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Response timeout')), 1000);
            this.getSerialEvents().subscribe((event) => {
              if (event.event === 'dataReceived') {
                clearTimeout(timeout);
                resolve(event.data);
              }
            });
          });
           resolve( PrintSucceeded(command, params, 'Command sent, response received '+JSON.stringify(message)));
           return;
        } catch (error) {
          this.addLogMessage(this.log, `Attempt ${attempt} failed: ${error.message}`);
          if (attempt === retries) reject(new Error(`Command failed after ${retries} attempts: ${error.message}`));
          else this.addLogMessage(this.log, `Retrying... (${attempt}/${retries})`);
        }
      }
      reject(new Error('Command failed after all retries'));
    });
  }

  checkSum(data?: any[]): string {
    return data ? data.join('') : '';
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  public close(): Promise<void> {
    this.stopPolling();
    if (this.serialEventsSubscription) {
      this.serialEventsSubscription.unsubscribe();
      this.serialEventsSubscription = null;
    }
    this.m102.listeners.clear();
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
  }
}

type M102Event =
  | 'SERIAL_NUMBER'
  | 'MOTOR_POLL'
  | 'MOTOR_SCAN'
  | 'MOTOR_RUN'
  | 'TEMPERATURE'
  | 'SWITCH_OUTPUT'
  | 'SWITCH_INPUT'
  | 'ADDRESS_SET'
  | 'ERROR';

type ListenerCallback = (data: { event: M102Event; details?: number[] }) => void;

class M102Protocol {
  private hostAddress: number = 0x00;
  private slaveAddress: number;
  public listeners: Map<M102Event, ListenerCallback[]> = new Map();

  constructor(slaveAddress: number = 1) {
    if (slaveAddress < 1 || slaveAddress > 8) {
      throw new Error('Slave address must be between 1 and 8');
    }
    this.slaveAddress = slaveAddress;
  }

  private calculateCrc16(data: Uint8Array): number {
    let crc = 0xFFFF;
    for (let byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x0001) {
          crc = (crc >> 1) ^ 0x8408; // Polynomial used in original code
        } else {
          crc >>= 1;
        }
      }
    }
    return crc;
  }

  private toHexString(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join('');
  }

  private buildPacket(instruction: number, data: number[] = [], address: number = this.slaveAddress): string {
    const packet = new Uint8Array(20);
    packet[0] = address;
    packet[1] = instruction;
    packet.fill(0, 2, 18);
    packet.set(data.slice(0, 16), 2);

    const crcData = packet.slice(0, 18);
    const crc = this.calculateCrc16(crcData);
    packet[18] = crc & 0xFF;
    packet[19] = (crc >> 8) & 0xFF;

    return this.toHexString(packet);
  }

  public parseResponse(hexString: string): { instruction: number; data: number[] } {
    const matches = hexString.match(/.{1,2}/g);
    if (!matches || matches.length !== 20) {
      this.emit('ERROR', [ERROR_CODES.INVALID_LENGTH]);
      throw new Error('Response must be 20 bytes');
    }
    const packet = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    if (packet[0] !== this.hostAddress) {
      this.emit('ERROR', [ERROR_CODES.INVALID_HOST_ADDRESS]);
      throw new Error('Invalid host address');
    }

    const crcData = packet.slice(0, 18);
    const crc = (packet[19] << 8) | packet[18];
    if (this.calculateCrc16(crcData) !== crc) {
      this.emit('ERROR', [ERROR_CODES.CRC_MISMATCH]);
      throw new Error('CRC mismatch');
    }
    this.emit('ERROR', [ERROR_CODES.INVALID_DATA_LENGTH]);
    const instruction = packet[1];
    const data = Array.from(packet.slice(2, 18));
    this.processResponse(instruction, data);
    return { instruction, data };
  }

  private processResponse(instruction: number, data: number[]) {
    switch (instruction) {
      case 0x01:
        if (data.length >= 12) this.emit('SERIAL_NUMBER', data.slice(0, 12));
        else this.emit('ERROR', [0x04]); // Invalid data length
        break;
      case 0x03:
        if (data.length >= 10) this.emit('MOTOR_POLL', data.slice(0, 10));
        else this.emit('ERROR', [0x04]);
        break;
      case 0x04:
        if (data.length >= 1) this.emit('MOTOR_SCAN', [data[0]]);
        else this.emit('ERROR', [0x04]);
        break;
      case 0x05:
        if (data.length >= 1) this.emit('MOTOR_RUN', [data[0]]);
        else this.emit('ERROR', [0x04]);
        break;
      case 0x07:
        if (data.length >= 2) this.emit('TEMPERATURE', data.slice(0, 2));
        else this.emit('ERROR', [0x04]);
        break;
      case 0x08:
        if (data.length >= 2) this.emit('SWITCH_OUTPUT', data.slice(0, 2));
        else this.emit('ERROR', [0x04]);
        break;
      case 0x09:
        if (data.length >= 8) this.emit('SWITCH_INPUT', data.slice(0, 8));
        else this.emit('ERROR', [0x04]);
        break;
      case 0xFF:
        if (data.length >= 1) this.emit('ADDRESS_SET', [data[0]]);
        else this.emit('ERROR', [0x04]);
        break;
      default:
        this.emit('ERROR', [instruction]); // Unknown instruction
        break;
    }
  }

  public on(event: M102Event, callback: ListenerCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: M102Event, details?: number[]): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      callback({ event, details });
    }
  }

  public getSerialNumber(): string { return this.buildPacket(0x01); }
  public motorPoll(): string { return this.buildPacket(0x03); }
  public motorScan(motorIndex: number): string {
    // Note: Document specifies 0-99, but motorRun uses 0-59. Confirm range with hardware.
    if (motorIndex < 0 || motorIndex > 99) throw new Error('Motor index must be 0-99');
    return this.buildPacket(0x04, [motorIndex]);
  }
  public motorRun(motorIndex: number, motorType: number, lightCurtainMode: number, overcurrentThreshold: number, undercurrentThreshold: number, timeout: number): string {
    if (motorIndex < 0 || motorIndex > 59) throw new Error('Motor index must be 0-59');
    if (motorType < 0 || motorType > 3) throw new Error('Motor type must be 0-3');
    if (lightCurtainMode < 0 || lightCurtainMode > 2) throw new Error('Light curtain mode must be 0-2');
    if (overcurrentThreshold < 0 || overcurrentThreshold > 255) throw new Error('Overcurrent threshold must be 0-255');
    if (undercurrentThreshold < 0 || undercurrentThreshold > 255) throw new Error('Undercurrent threshold must be 0-255');
    if (timeout < 0 || timeout > 100) throw new Error('Timeout must be 0-100');
    return this.buildPacket(0x05, [motorIndex, motorType, lightCurtainMode, overcurrentThreshold, undercurrentThreshold, timeout]);
  }
  public readTemp(): string { return this.buildPacket(0x07); }
  public writeDO(doIndex: number, operation: number): string {
    if (doIndex < 0 || doIndex > 7) throw new Error('DO index must be 0-7');
    if (operation !== 0 && operation !== 1) throw new Error('Operation must be 0 or 1');
    return this.buildPacket(0x08, [doIndex, operation]);
  }
  public readDI(): string { return this.buildPacket(0x09, [0]); }
  public setAddress(newAddress: number): string {
    if (newAddress < 1 || newAddress > 8) throw new Error('New address must be 1-8');
    return this.buildPacket(0xFF, [newAddress], 255);
  }
}
const ERROR_CODES = {
  INVALID_LENGTH: 0x01,
  INVALID_HOST_ADDRESS: 0x02,
  CRC_MISMATCH: 0x03,
  INVALID_DATA_LENGTH: 0x04,
};
