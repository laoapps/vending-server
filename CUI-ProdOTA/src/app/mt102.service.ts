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
  private totalValue = 0;
  machinestatus = { data: '' };
  private serialEventsSubscription: Subscription | null = null;
  private pollingSubscription: Subscription | null = null;
  private pollingIntervalMs = 200;
  
  constructor(private serialService: SerialServiceService) {}

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }

  private setupListeners(): void {
    if (this.serialEventsSubscription) {
      this.serialEventsSubscription.unsubscribe();
    }
    
    this.serialEventsSubscription = this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = event.data;
        this.addLogMessage(this.log, `Raw data: ${hexData}`);
        try {
          this.m102.parseResponse(hexData);
        } catch (error) {
          this.addLogMessage(this.log, `Parse error: ${error.message}`);
        }
      } else if (event.event === 'mt102Response') {
        // Handle parsed response from Java plugin
        this.handleParsedMT102Response(event.data);
      } else if (event.event === 'serialOpened') {
        this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
        setTimeout(() => {
          this.setupDevice().catch(err => {
            this.addLogMessage(this.log, `Setup failed: ${err.message}`);
          });
        }, 500);
      } else if (event.event === 'commandProcessed') {
        this.addLogMessage(this.log, `Command processed, queue size: ${event.queueSize}`);
      } else if (event.event === 'readError') {
        this.addLogMessage(this.log, `Read error: ${event.error}`);
      }
    });

    // Setup M102 protocol listeners
    this.m102.on('SERIAL_NUMBER', ({ details }) => {
      this.addLogMessage(this.log, `Serial Number: ${this.formatHexArray(details)}`);
    });
    
    this.m102.on('MOTOR_POLL', ({ details }) => {
      const status = {
        executionStatus: details![0],
        runningMotor: details![1],
        executionResult: details![2],
        peakCurrent: (details![3] << 8) | details![4],
        averageCurrent: (details![5] << 8) | details![6],
        runningTime: (details![7] << 8) | details![8],
        lightCurtainState: details![9]
      };
      this.machinestatus.data = JSON.stringify(status);
      this.addLogMessage(this.log, `Motor Poll: ${JSON.stringify(status)}`);
    });
    
    this.m102.on('MOTOR_RUN', ({ details }) => {
      const result = details?.[0] === 0 ? 'Success' : `Error ${details?.[0]}`;
      this.addLogMessage(this.log, `Motor Run Result: ${result}`);
      if (details?.[0] === 0) this.totalValue++;
    });
    
    this.m102.on('TEMPERATURE', ({ details }) => {
      const temp = (details![0] << 8) | details![1];
      this.addLogMessage(this.log, `Temperature: ${temp / 10} °C`);
    });
    
    this.m102.on('SWITCH_OUTPUT', ({ details }) => {
      this.addLogMessage(this.log, `Switch Output: Index ${details![0]}, Result ${details![1]}`);
    });
    
    this.m102.on('SWITCH_INPUT', ({ details }) => {
      this.addLogMessage(this.log, `Switch Input (0-7): ${this.formatHexArray(details.slice(0, 8))}`);
    });
    
    this.m102.on('ADDRESS_SET', ({ details }) => {
      this.addLogMessage(this.log, `Address Set: ${details![0]}`);
    });
    
    this.m102.on('ERROR', ({ details }) => {
      this.addLogMessage(this.log, `Protocol Error: Code ${details?.[0]}`);
    });
  }

  private handleParsedMT102Response(response: any): void {
    if (!response || !response.command) {
      this.addLogMessage(this.log, 'Invalid MT102 response format');
      return;
    }

    const command = response.command;
    const dataHex = response.data;
    const dataArray = this.hexToArray(dataHex);

    switch (command) {
      case '01':
        this.m102.emit('SERIAL_NUMBER', dataArray.slice(0, 12));
        break;
      case '03':
        this.m102.emit('MOTOR_POLL', dataArray.slice(0, 10));
        break;
      case '04':
        this.m102.emit('MOTOR_SCAN', [dataArray[0]]);
        break;
      case '05':
        this.m102.emit('MOTOR_RUN', [dataArray[0]]);
        break;
      case '07':
        this.m102.emit('TEMPERATURE', dataArray.slice(0, 2));
        break;
      case '08':
        this.m102.emit('SWITCH_OUTPUT', dataArray.slice(0, 2));
        break;
      case '09':
        this.m102.emit('SWITCH_INPUT', dataArray.slice(0, 8));
        break;
      case 'FF':
        this.m102.emit('ADDRESS_SET', [dataArray[0]]);
        break;
      default:
        this.addLogMessage(this.log, `Unknown response command: ${command}`);
        break;
    }
  }

  private formatHexArray(data: number[]): string {
    return data.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }

  private hexToArray(hexString: string): number[] {
    const result = [];
    for (let i = 0; i < hexString.length; i += 2) {
      result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return result;
  }

  private initM102(slaveAddress: number = 1): void {
    this.m102 = new M102Protocol(slaveAddress);
    this.setupListeners();
  }

  private async setupDevice(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const serialNumberPacket = this.m102.getSerialNumber();
        const result = await this.serialService.writeMT102(
          '01',
           { address: this.m102.getSlaveAddress() }
        );
        
        this.addLogMessage(this.log, 'MT102 setup command sent');
        resolve();
      } catch (err) {
        this.addLogMessage(this.log, `Setup error: ${err.message}`);
        reject(err);
      }
    });
  }

  public startPolling(): void {
    if (this.pollingSubscription) {
      this.addLogMessage(this.log, 'Polling already active');
      return;
    }

    this.pollingSubscription = interval(this.pollingIntervalMs).subscribe(async () => {
      try {
        const result = await this.command(EMACHINE_COMMAND.POLL, {}, Date.now());
        this.addLogMessage(this.log, `Poll completed`);
      } catch (error) {
        this.addLogMessage(this.log, `Polling error: ${error.message}`);
      }
    });
    this.addLogMessage(this.log, 'Polling started');
  }

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
          reject(new Error(`Serial port mismatch: Expected ${this.portName}, got ${init}`));
          return;
        }
        
        this.initM102();
        await this.serialService.startReadingMT102();
        this.addLogMessage(this.log, `Serial port initialized: ${this.portName}`);
        resolve(init);
      } catch (error) {
        this.addLogMessage(this.log, `Serial port initialization failed: ${error.message}`);
        reject(error);
      }
    });
  }

  public async command(command: EMACHINE_COMMAND, params: any, transactionID: number, retries = 3): Promise<IResModel> {
    return new Promise(async (resolve, reject) => {
      if (!this.m102) {
        reject(new Error('MT102 protocol not initialized'));
        return;
      }

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          let m102Command: string;
          const { 
            motorIndex = 0, 
            motorType = 3, 
            lightCurtainMode = 0, 
            overcurrent = 100, 
            undercurrent = 50, 
            timeout = 70,
            switchIndex = 0,
            newAddress = 1
          } = params || {};

          switch (command) {
            case EMACHINE_COMMAND.POLL:
              m102Command = this.m102.motorPoll();
              break;
            case EMACHINE_COMMAND.shippingcontrol:
              m102Command = this.m102.motorRun(motorIndex, motorType, lightCurtainMode, overcurrent, undercurrent, timeout);
              break;
            case EMACHINE_COMMAND.READ_TEMP:
              m102Command = this.m102.readTemp();
              break;
            case EMACHINE_COMMAND.READ_SWITCH_OUTPUT:
              m102Command = this.m102.writeDO(switchIndex, 0);
              break;
            case EMACHINE_COMMAND.READ_SWITCH_INPUT:
              m102Command = this.m102.readDI();
              break;
            case EMACHINE_COMMAND.SET_ADDRESS:
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

          this.addLogMessage(this.log, `Sending command (Attempt ${attempt}): ${command}`);
          await this.serialService.writeMT102(
            this.getCommandHex(command),
            { 
              address: this.m102.getSlaveAddress(),
              ...params 
            }
          );

          // Wait a bit for response
          await new Promise(resolve => setTimeout(resolve, 100));
          
          resolve(PrintSucceeded(command, params, 'Command sent successfully'));
          return;
         
        } catch (error) {
          this.addLogMessage(this.log, `Attempt ${attempt} failed: ${error.message}`);
          if (attempt === retries) {
            reject(new Error(`Command failed after ${retries} attempts: ${error.message}`));
            return;
          }
          this.addLogMessage(this.log, `Retrying... (${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    });
  }

  private getCommandHex(command: EMACHINE_COMMAND): string {
    switch (command) {
      case EMACHINE_COMMAND.POLL: return '03';
      case EMACHINE_COMMAND.shippingcontrol: return '05';
      case EMACHINE_COMMAND.READ_TEMP: return '07';
      case EMACHINE_COMMAND.READ_SWITCH_OUTPUT: return '08';
      case EMACHINE_COMMAND.READ_SWITCH_INPUT: return '09';
      case EMACHINE_COMMAND.SET_ADDRESS: return 'FF';
      case EMACHINE_COMMAND.MOTOR_SCAN: return '04';
      default: return '01';
    }
  }

  checkSum(data?: any[]): string {
    return data ? data.join('') : '';
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  public close(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        this.stopPolling();
        
        if (this.serialEventsSubscription) {
          this.serialEventsSubscription.unsubscribe();
          this.serialEventsSubscription = null;
        }
        
        if (this.m102) {
          this.m102.listeners.clear();
        }
        
        await this.serialService.close();
        this.addLogMessage(this.log, 'MT102 service closed');
        resolve();
      } catch (error) {
        this.addLogMessage(this.log, `Close error: ${error.message}`);
        reject(error);
      }
    });
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
    this.slaveAddress = Math.max(1, Math.min(8, slaveAddress || 1));
  }

  getSlaveAddress(): number {
    return this.slaveAddress;
  }

  private calculateCrc16(data: Uint8Array): number {
    let crc = 0xFFFF;
    for (let byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x0001) {
          crc = (crc >> 1) ^ 0xA001; // Match Java plugin polynomial
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
    
    // Pad data to 16 bytes with zeros
    const paddedData = [...data];
    while (paddedData.length < 16) {
      paddedData.push(0);
    }
    
    packet.set(paddedData.slice(0, 16), 2);

    // Calculate CRC on first 18 bytes
    const crcData = packet.slice(0, 18);
    const crc = this.calculateCrc16(crcData);
    
    // CRC bytes - low byte first, then high byte
    packet[18] = crc & 0xFF;
    packet[19] = (crc >> 8) & 0xFF;

    return this.toHexString(packet);
  }

  public parseResponse(hexString: string): { instruction: number; data: number[] } {
    try {
      const matches = hexString.match(/.{1,2}/g);
      if (!matches || matches.length !== 20) {
        this.emit('ERROR', [1]); // INVALID_LENGTH
        return { instruction: 0, data: [] };
      }
      
      const packet = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
      
      if (packet[0] !== this.hostAddress) {
        this.emit('ERROR', [2]); // INVALID_HOST_ADDRESS
        return { instruction: 0, data: [] };
      }

      // Verify CRC
      const crcData = packet.slice(0, 18);
      const crc = (packet[19] << 8) | packet[18];
      if (this.calculateCrc16(crcData) !== crc) {
        this.emit('ERROR', [3]); // CRC_MISMATCH
        return { instruction: 0, data: [] };
      }

      const instruction = packet[1];
      const data = Array.from(packet.slice(2, 18));
      this.processResponse(instruction, data);
      
      return { instruction, data };
    } catch (error) {
      this.emit('ERROR', [5]); // PARSE_ERROR
      return { instruction: 0, data: [] };
    }
  }

  private processResponse(instruction: number, data: number[]) {
    try {
      switch (instruction) {
        case 0x01:
          this.emit('SERIAL_NUMBER', data.slice(0, 12));
          break;
        case 0x03:
          this.emit('MOTOR_POLL', data.slice(0, 10));
          break;
        case 0x04:
          this.emit('MOTOR_SCAN', [data[0]]);
          break;
        case 0x05:
          this.emit('MOTOR_RUN', [data[0]]);
          break;
        case 0x07:
          this.emit('TEMPERATURE', data.slice(0, 2));
          break;
        case 0x08:
          this.emit('SWITCH_OUTPUT', data.slice(0, 2));
          break;
        case 0x09:
          this.emit('SWITCH_INPUT', data.slice(0, 8));
          break;
        case 0xFF:
          this.emit('ADDRESS_SET', [data[0]]);
          break;
        default:
          this.emit('ERROR', [instruction]);
          break;
      }
    } catch (error) {
      this.emit('ERROR', [6]); // PROCESS_ERROR
    }
  }

  public on(event: M102Event, callback: ListenerCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public emit(event: M102Event, details?: number[]): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      try {
        callback({ event, details });
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    }
  }

  public getSerialNumber(): string { 
    return this.buildPacket(0x01); 
  }
  
  public motorPoll(): string { 
    return this.buildPacket(0x03); 
  }
  
  public motorScan(motorIndex: number): string {
    const index = Math.max(0, Math.min(99, motorIndex || 0));
    return this.buildPacket(0x04, [index]);
  }
  
  public motorRun(
    motorIndex: number, 
    motorType: number, 
    lightCurtainMode: number, 
    overcurrentThreshold: number, 
    undercurrentThreshold: number, 
    timeout: number
  ): string {
    const params = [
      Math.max(0, Math.min(59, motorIndex || 0)),
      Math.max(0, Math.min(3, motorType || 0)),
      Math.max(0, Math.min(2, lightCurtainMode || 0)),
      Math.max(0, Math.min(255, overcurrentThreshold || 0)),
      Math.max(0, Math.min(255, undercurrentThreshold || 0)),
      Math.max(0, Math.min(100, timeout || 0))
    ];
    return this.buildPacket(0x05, params);
  }
  
  public readTemp(): string { 
    return this.buildPacket(0x07); 
  }
  
  public writeDO(doIndex: number, operation: number): string {
    const params = [
      Math.max(0, Math.min(7, doIndex || 0)),
      operation ? 1 : 0
    ];
    return this.buildPacket(0x08, params);
  }
  
  public readDI(): string { 
    return this.buildPacket(0x09, [0]); 
  }
  
  public setAddress(newAddress: number): string {
    const address = Math.max(1, Math.min(8, newAddress || 1));
    return this.buildPacket(0xFF, [address], 255);
  }
}