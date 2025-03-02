import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';



@Injectable({
  providedIn: 'root'
})
export class MT102Service implements ISerialService {
  private m102: M102Protocol;
  machineId = '11111111';
  portName = '/dev/ttyS1';
  baudRate = 9600;
  log: IlogSerial = { data: '' };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;

  constructor(private serialService: SerialServiceService) {
    this.m102 = new M102Protocol(1); // Default slave address 1
    this.setupListeners();
  }

  private setupListeners(): void {
    this.m102.on('SERIAL_NUMBER', ({ details }) => {
      this.log.data += `Serial Number: ${details}\n`;
      console.log('Serial Number:', details);
    });
    this.m102.on('MOTOR_POLL', ({ details }) => {
      this.log.data += `Motor Poll: ${details}\n`;
      console.log('Motor Poll:', details);
    });
    this.m102.on('MOTOR_RUN', ({ details }) => {
      this.log.data += `Motor Run Result: ${details?.[0]}\n`;
      console.log('Motor Run Result:', details?.[0]);
    });
    this.m102.on('TEMPERATURE', ({ details }) => {
      const temp = (details![1] << 8) | details![0]; // Z1-Z2 as 16-bit signed
      this.log.data += `Temperature: ${temp / 10} °C\n`;
      console.log('Temperature:', temp / 10, '°C');
    });
    this.m102.on('SWITCH_OUTPUT', ({ details }) => {
      this.log.data += `Switch Output: Index ${details![0]}, Result ${details![1]}\n`;
      console.log('Switch Output:', details);
    });
    this.m102.on('SWITCH_INPUT', ({ details }) => {
      this.log.data += `Switch Input: ${details}\n`;
      console.log('Switch Input:', details);
    });
    this.m102.on('ERROR', ({ details }) => {
      this.log.data += `Error: ${details?.[0]}\n`;
      console.log('Error:', details?.[0]);
    });

    // Listen to serial events
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = Buffer.from(event.data as any).toString('hex').toUpperCase();
        this.log.data += `Raw data: ${hexData}\n`;
        console.log('Received:', hexData);
        try {
          this.m102.parseResponse(hexData);
        } catch (error) {
          this.log.data += `Parse error: ${error.message}\n`;
          console.error('Parse error:', error);
        }
      }
    });
  }

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
    this.log = log || this.log;

    return this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>((resolve, reject) => {
      let m102Command: string;
      switch (command) {
        case EMACHINE_COMMAND.POLL:
          m102Command = this.m102.motorPoll();
          break;
        case EMACHINE_COMMAND.shippingcontrol: // Assuming dispense maps to motorRun
          const { motorIndex, motorType, lightCurtainMode, overcurrent, undercurrent, timeout } = params;
          m102Command = this.m102.motorRun(
            motorIndex || 0,
            motorType || 3, // Default to 3-wire motor
            lightCurtainMode || 0,
            overcurrent || 100,
            undercurrent || 50,
            timeout || 70
          );
          break;
        case EMACHINE_COMMAND.READ_TEMP: // Custom command for temperature
          m102Command = this.m102.readTemp();
          break;
        default:
          resolve(PrintSucceeded(command, params, 'unknown command'));
          return;
      }

      this.log.data += `Sending: ${m102Command}\n`;
      console.log('Sending:', m102Command);
      this.serialService.write(m102Command)
        .then(() => {
          // Response handling is via event listener, resolve with a placeholder
          resolve(PrintSucceeded(command, params, 'Command sent, awaiting response'));
        })
        .catch((error) => {
          this.log.data += `Error sending: ${error.message}\n`;
          reject(error);
        });
    });
  }

  checkSum(data?: any[]): string {
    return data ? data.join('') : '';
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  close(): Promise<void> {
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return await this.serialService.listPorts();
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
  private listeners: Map<M102Event, ListenerCallback[]> = new Map();

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
          crc = (crc >> 1) ^ 0x8408;
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

  private buildPacket(instruction: number, data: number[] = []): string {
    const packet = new Uint8Array(20);
    packet[0] = this.slaveAddress;
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
      this.emit('ERROR', [0x01]);
      throw new Error('Response must be 20 bytes');
    }
    const packet = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    if (packet[0] !== this.hostAddress) {
      this.emit('ERROR', [0x02]);
      throw new Error('Invalid host address');
    }

    const crcData = packet.slice(0, 18);
    const crc = (packet[19] << 8) | packet[18];
    if (this.calculateCrc16(crcData) !== crc) {
      this.emit('ERROR', [0x03]);
      throw new Error('CRC mismatch');
    }

    const instruction = packet[1];
    const data = Array.from(packet.slice(2, 18));
    this.processResponse(instruction, data);
    return { instruction, data };
  }

  private processResponse(instruction: number, data: number[]) {
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
        this.emit('SWITCH_INPUT', data.slice(0, 4));
        break;
      case 0xFF:
        this.emit('ADDRESS_SET', [data[0]]);
        break;
      default:
        this.emit('ERROR', [instruction]);
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
    if (doIndex < 0 || doIndex > 6) throw new Error('DO index must be 0-6');
    if (operation !== 0 && operation !== 1) throw new Error('Operation must be 0 or 1');
    return this.buildPacket(0x08, [doIndex, operation]);
  }
  public readDI(): string { return this.buildPacket(0x09, [0]); }
  public setAddress(newAddress: number): string {
    if (newAddress < 1 || newAddress > 8) throw new Error('New address must be 1-8');
    const packet = this.buildPacket(0xFF, [newAddress]);
    return 'FF' + packet.slice(2);
  }
}