import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { Buffer } from 'buffer';

@Injectable({
  providedIn: 'root'
})
export class EsspNV9USBService implements ISerialService {
  machineId = '11111111';
  portName = '/dev/ttyS0';
  baudRate = 9600;
  log: IlogSerial = { data: '' };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;

  private essp: EsspProtocol;
  private totalValue = 0; // Total value from credited notes

  constructor(private serialService: SerialServiceService) {}

  private initEssp(): void {
    // Initialize eSSP with fixed key
    this.essp = new EsspProtocol({ id: 0x00, fixedKey: '0123456701234567', timeout: 3000 });

    // Event listeners
    this.essp.on('READ_NOTE', ({ details }) => {
      this.log.data += `Reading note, channel: ${details?.[0]}\n`;
      console.log(`Reading note, channel: ${details?.[0]}`);
    });
    this.essp.on('CREDIT_NOTE', ({ details }) => {
      const channel = details?.[0];
      const value = this.getValueFromChannel(channel || 0);
      this.totalValue += value;
      this.log.data += `Credited note, channel: ${channel}, Value: ${value}, Total: ${this.totalValue}\n`;
      console.log(`Credited note, channel: ${channel}, Value: ${value}, Total: ${this.totalValue}`);
    });
    this.essp.on('JAMMED', () => {
      this.log.data += 'Jammed!\n';
      console.log('Jammed!');
    });
    this.essp.on('JAM_RECOVERY', () => {
      this.log.data += 'Jam recovered\n';
      console.log('Jam recovered');
    });
    this.essp.on('DISABLED', () => {
      this.log.data += 'Disabled\n';
      console.log('Disabled');
    });
    this.essp.on('DISPENSED', () => {
      this.log.data += 'Dispensed\n';
      console.log('Dispensed');
    });
    this.essp.on('OK', () => {
      this.log.data += 'OK\n';
      console.log('OK');
    });
    this.essp.on('ERROR', ({ details }) => {
      this.log.data += `Error: ${details?.[0]}\n`;
      console.log(`Error: ${details?.[0]}`);
    });

    // Subscribe to serial events
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = Buffer.from(event.data as any).toString('hex');
        this.log.data += `Raw data: ${hexData}\n`;
        console.log('Received:', hexData);
        const response = this.essp.parsePacket(hexData);
        this.handleResponse(response.command, response.data);
      }
    });

    // Initial setup sequence
    this.setupDevice();
  }

  private async setupDevice(): Promise<void> {
    try {
      await this.serialService.write(this.essp.sync());
      await this.serialService.write(this.essp.hostProtocolVersion(6));
      await this.serialService.write(this.essp.getSerialNumber());
      await this.serialService.write(this.essp.reset());
      await this.serialService.write(this.essp.setupRequest());
      await this.serialService.write(this.essp.setInhibits(0xFF, 0x00)); // Enable all channels
      await this.serialService.write(this.essp.enable());
      console.log('NV9 USB setup complete');
    } catch (err) {
      console.error('Setup error:', err);
      this.log.data += `Setup error: ${err}\n`;
    }
  }

  private handleResponse(command: number, data: number[]): void {
    // Handle specific responses if needed
    switch (command) {
      case 0x20: // Serial Number
        const sn = data.reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
        this.log.data += `Serial Number: ${sn}\n`;
        console.log(`Serial Number: ${sn}`);
        break;
      case 0x05: // Setup Request
        this.log.data += `Setup Data: ${data.map(d => d.toString(16).padStart(2, '0')).join('')}\n`;
        console.log('Setup Data:', data);
        break;
    }
  }

  private getValueFromChannel(channel: number): number {
    // Example mapping (adjust per NV9 USB configuration)
    const channelMap: { [key: number]: number } = {
      1: 20,  // 20 THB
      2: 50,  // 50 THB
      3: 100, // 100 THB
    };
    return channelMap[channel] || 0;
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

    return this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative)
      .then(() => this.initEssp());
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      try {
        let data: string;
        let result: any = {};

        switch (command) {
          case EMACHINE_COMMAND.sync: // Assuming EMACHINE_COMMAND.sync is SYNC
            data = this.essp.sync();
            await this.serialService.write(data);
            result = { synced: true };
            break;
          case EMACHINE_COMMAND.SET_POLL: // Assuming setpoll is POLL
            data = this.essp.poll();
            await this.serialService.write(data);
            result = { polling: true };
            break;
          case EMACHINE_COMMAND.enable:
            data = this.essp.enable();
            await this.serialService.write(data);
            result = { enabled: true };
            break;
          case EMACHINE_COMMAND.GET_SN:
            data = this.essp.getSerialNumber();
            await this.serialService.write(data);
            // Serial number is logged in handleResponse
            result = { serialNumberRequested: true };
            break;
          case EMACHINE_COMMAND.RESET:
            data = this.essp.reset();
            await this.serialService.write(data);
            this.totalValue = 0;
            result = { reset: true };
            break;
          case EMACHINE_COMMAND.READ_EVENTS:
            // Events are handled via poll responses; return current total
            result = { totalValue: this.totalValue };
            break;
          default:
            resolve(PrintSucceeded(command, params, 'unknown command'));
            return;
        }

        resolve(PrintSucceeded(command, result, 'command executed'));
      } catch (err) {
        reject(err);
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
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return await this.serialService.listPorts();
  }
}

type EsspEvent =
  | 'JAM_RECOVERY'
  | 'DISABLED'
  | 'DISPENSED'
  | 'JAMMED'
  | 'CREDIT_NOTE'
  | 'READ_NOTE'
  | 'OK'
  | 'ERROR';

type ListenerCallback = (data: { event: EsspEvent; details?: number[] }) => void;

class EsspProtocol {
  private sequenceCounter: number = 0;
  private id: number;
  private fixedKey: Uint8Array | null;
  private timeout: number;
  private listeners: Map<EsspEvent, ListenerCallback[]> = new Map();

  constructor(options: { id?: number; fixedKey?: string; timeout?: number } = {}) {
    this.id = options.id ?? 0x00;
    this.fixedKey = options.fixedKey
      ? new Uint8Array(options.fixedKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
      : null;
    this.timeout = options.timeout ?? 3000;
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

  public buildPacket(command: number, data: number[] = []): string {
    const length = data.length + 1;
    const packet = new Uint8Array(5 + data.length);

    packet[0] = 0x7F;
    packet[1] = 0x80 | (this.sequenceCounter & 0x7F);
    packet[2] = length;
    packet[3] = command;
    packet.set(data, 4);

    const crcData = packet.slice(1, 4 + data.length);
    const crc = this.calculateCrc16(crcData);
    packet[4 + data.length] = crc & 0xFF;
    packet[5 + data.length] = (crc >> 8) & 0xFF;

    this.sequenceCounter = (this.sequenceCounter + 1) % 0x80;

    if (this.fixedKey && this.isEncryptionEnabled(command)) {
      console.warn('Encryption placeholder - implement AES-128 ECB here');
      // TODO: Encrypt packet[1..end-2] with AES-128 ECB using fixedKey
    }

    return this.toHexString(packet);
  }

  public parsePacket(hexString: string): { command: number; data: number[] } {
    const matches = hexString.match(/.{1,2}/g);
    if (!matches) throw new Error('Invalid hex string format');
    const packet = new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    if (packet[0] !== 0x7F) throw new Error('Invalid STX');
    const length = packet[2];
    const dataEnd = 3 + length;
    if (dataEnd + 2 > packet.length) throw new Error('Packet too short');
    const crc = (packet[dataEnd + 1] << 8) | packet[dataEnd];
    const crcData = packet.slice(1, dataEnd);
    if (this.calculateCrc16(crcData) !== crc) throw new Error('CRC mismatch');

    const command = packet[3];
    const data = Array.from(packet.slice(4, dataEnd));

    if (command === 0x07) {
      this.processPollResponse(data);
    }

    return { command, data };
  }

  public resetCounter(): void {
    this.sequenceCounter = 0;
  }

  private isEncryptionEnabled(command: number): boolean {
    return command !== 0x11 && command !== 0x06; // SYNC and Protocol Version are unencrypted
  }

  // Core Commands
  public sync(): string { return this.buildPacket(0x11); }
  public getSerialNumber(): string { return this.buildPacket(0x20); }
  public enable(): string { return this.buildPacket(0x0A); }
  public poll(): string { return this.buildPacket(0x07); }
  public disable(): string { return this.buildPacket(0x09); }
  public reset(): string { return this.buildPacket(0x01); }
  public setInhibits(channelMaskLow: number, channelMaskHigh: number): string {
    return this.buildPacket(0x02, [channelMaskLow, channelMaskHigh]);
  }
  public displayOn(): string { return this.buildPacket(0x03); }
  public displayOff(): string { return this.buildPacket(0x04); }
  public hostProtocolVersion(version: number): string { return this.buildPacket(0x06, [version]); }
  public setupRequest(): string { return this.buildPacket(0x05); }

  private processPollResponse(data: number[]) {
    for (let i = 0; i < data.length; i++) {
      switch (data[i]) {
        case 0xF0: this.emit('OK'); break;
        case 0xEF:
          if (i + 1 < data.length) { this.emit('READ_NOTE', [data[++i]]); } else { this.emit('ERROR', [data[i]]); }
          break;
        case 0xEE:
          if (i + 1 < data.length) { this.emit('CREDIT_NOTE', [data[++i]]); } else { this.emit('ERROR', [data[i]]); }
          break;
        case 0xE8: this.emit('JAMMED'); break;
        case 0xE7: this.emit('JAM_RECOVERY'); break;
        case 0xE6: this.emit('DISABLED'); break;
        case 0xD6: this.emit('DISPENSED'); break;
        default: this.emit('ERROR', [data[i]]); break;
      }
    }
  }

  public on(event: EsspEvent, callback: ListenerCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: EsspEvent, details?: number[]): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      callback({ event, details });
    }
  }
}