import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { Buffer } from 'buffer';
import * as CryptoJS from 'crypto-js';
@Injectable({
  providedIn: 'root'
})
export class EsspNV9USBService implements ISerialService {
  machineId = '11111111';
  portName = '/dev/ttyS1'; // Matches logs
  baudRate = 9600;
  log: IlogSerial = { data: '' };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;
  private essp: EsspProtocol;
  private totalValue = 0;
  private transactionID = -1;
  private counter = 0;
  private tCounter: any;
  private creditCount = 0;
  private creditValue = 0;
  private creditNotes: { value: number; channel: number }[] = [];
  private channelMap: { [key: number]: number } = {};
  private channels = [1, 1, 1, 1, 1, 1, 1];
  constructor(private serialService: SerialServiceService) { }

  async initializeSerialPort(
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

    await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
    this.initEssp(this.channels);
  }
  setChannels(channels: number[]): void {
    this.channels = channels;
  }

  private initEssp(channels = [1, 1, 1, 1, 1, 1, 1]): void {
    console.log('Initializing NV9 USB');
    this.essp = new EsspProtocol({ id: 0x00, fixedKey: '0123456701234567', timeout: 3000 });
    this.initBankNotes();
    console.log('init bank notes');

    this.getSerialEvents().subscribe((event) => {
      console.log('Serial event:', JSON.stringify(event));
      if (event.event === 'dataReceived') {
        const hexData = Buffer.from(event.data as any).toString('hex');
        this.log.data += `Raw data: ${hexData}\n`;
        console.log('Received:', hexData);
        try {
          const response = this.essp.parsePacket(hexData);
          this.handleResponse(response.command, response.data);
        } catch (err) {
          this.log.data += `Parse error: ${err.message}\n`;
          console.error('Parse error:', err);
        }
      } else if (event.event === 'serialOpened') {
        this.log.data += `Serial port opened: ${this.portName}\n`;
        this.setupDevice(channels).catch(err => console.error('Setup failed:', err));
      }
    });

    console.log('set polling');
    setInterval(async () => {
      if (this.transactionID !== -1) {
        console.log('Polling...');
        await this.serialService.write(this.essp.poll());
      }
    }, 1000);

    this.essp.on('CREDIT_NOTE', ({ details }) => {
      const channel = details![0];
      const value = this.getValueFromChannel(channel);
      this.creditCount++;
      this.creditValue += value;
      this.creditNotes.push({ value, channel });
      this.log.data += `Credited note, channel: ${channel}, Value: ${value}, Total: ${this.creditValue}\n`;
    });
  }

  // In EsspNV9USBService
private async setupDevice(channels = [1, 1, 1, 1, 1, 1, 1]): Promise<void> {
  const generator = this.hexToBytes('D4E2F63A5B7C1900'); // Example 64-bit prime
  const modulus = this.hexToBytes('F7A9B3C8D1E4F200');
  const hostRandom = Buffer.from([Math.floor(Math.random() * 256), 0, 0, 0, 0, 0, 0, 0]); // Simplified
  const hostIntKey = this.hexToBytes('1234567890ABCDEF'); // Placeholder; compute properly in production

  await this.serialService.write(this.essp.sync());
  await this.waitForResponse(0xF0, 'SYNC');
  await this.serialService.write(this.essp.hostProtocolVersion(6));
  await this.waitForResponse(0xF0, 'HOST_PROTOCOL_VERSION');
  await this.serialService.write(this.essp.setGenerator(generator));
  await this.waitForResponse(0xF0, 'SET_GENERATOR');
  await this.serialService.write(this.essp.setModulus(modulus));
  await this.waitForResponse(0xF0, 'SET_MODULUS');
  await this.serialService.write(this.essp.requestKeyExchange(hostIntKey));
  await this.waitForResponse(0x4C, 'REQUEST_KEY_EXCHANGE');
  await this.serialService.write(this.essp.getSerialNumber());
  await this.waitForResponse(0x20, 'SERIAL_NUMBER');
  await this.serialService.write(this.essp.reset());
  await this.waitForResponse(0xF0, 'RESET');
  await this.serialService.write(this.essp.setupRequest());
  await this.waitForResponse(0x05, 'SETUP_REQUEST');
  await this.serialService.write(this.essp.setInhibits(channels));
  await this.waitForResponse(0xF0, 'SET_INHIBITS');
  await this.serialService.write(this.essp.enable());
  await this.waitForResponse(0xF0, 'ENABLE');
  this.log.data += 'NV9 USB setup complete\n';
  console.log('NV9 USB setup complete');
}

private hexToBytes(hex: string): number[] {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}
  private waitForResponse(expectedCommand: number, commandName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`${commandName} timeout`)), 1000);
      const sub = this.getSerialEvents().subscribe(event => {
        if (event.event === 'dataReceived') {
          const hexData = Buffer.from(event.data as any).toString('hex');
          try {
            const response = this.essp.parsePacket(hexData);
            if (response.command === expectedCommand) {
              clearTimeout(timeout);
              sub.unsubscribe();
              resolve();
            }
          } catch (err) {
            // Ignore parsing errors, wait for valid response
          }
        }
      });
    });
  }
  private handleResponse(command: number, data: number[]): void {
    switch (command) {
      case 0x20: // SERIAL_NUMBER
        const sn = data.reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
        this.log.data += `Serial Number: ${sn}\n`;
        console.log(`Serial Number: ${sn}`);
        break;
      case 0x05: // SETUP_REQUEST
        this.parseSetupRequest(data);
        break;
      case 0x07: // POLL responses handled by processPollResponse
        break;
      case 0xF0: // OK
        this.log.data += 'Command OK\n';
        break;
        case 0x4C: // REQUEST_KEY_EXCHANGE
        this.essp.key = Buffer.concat([Buffer.from(this.essp.fixedKey), Buffer.from(data)]);
        this.log.data += 'Encryption key set\n';
        break;
      default:
        this.log.data += `Unhandled command: ${command.toString(16)}\n`;
    }
  }

  private parseSetupRequest(data: number[]): void {
    const channelCount = data[11];
    const channelValues = data.slice(12, 12 + channelCount);
    const valueMultiplier = data.slice(8, 11).reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
    channelValues.forEach((value, i) => {
      this.channelMap[i + 1] = value * valueMultiplier; // Dynamic mapping
    });
    this.log.data += `Setup: Channels=${JSON.stringify(this.channelMap)}\n`;
    console.log('Setup:', this.channelMap);
  }

  private initBankNotes(): void {
    // Fallback static mapping from KiosESSP
    this.channelMap = {
      1: 1000, 2: 2000, 3: 5000, 4: 10000, 5: 20000, 6: 50000, 7: 100000
    };
  }

  private getValueFromChannel(channel: number): number {
    return this.channelMap[channel] || 0;
  }

  setTransactionID(transactionID: number, counter: number = 30): void {
    this.transactionID = transactionID;
    this.setCounter(counter);
    if (this.transactionID !== -1) {
      this.serialService.write(this.essp.reset()).then(() => {
        this.serialService.write(this.essp.enable());
        this.creditCount = 0;
        this.creditValue = 0;
        this.creditNotes = [];
      });
    } else {
      this.serialService.write(this.essp.disable());
    }
  }

  private setCounter(v: number): void {
    this.counter = v;
    if (this.tCounter) clearInterval(this.tCounter);
    this.tCounter = setInterval(() => {
      this.counter--;
      this.log.data += `Counter: ${this.counter}\n`;
      if (this.counter <= 0) {
        clearInterval(this.tCounter);
        this.transactionID = -1;
        this.serialService.write(this.essp.disable());
        this.log.data += 'Transaction timed out, disabled\n';
      }
    }, 1000);
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      try {
        let data: string;
        let result: any = {};

        switch (command) {
          case EMACHINE_COMMAND.SYNC:
            data = this.essp.sync();
            await this.serialService.write(data);
            result = { synced: true };
            break;
          case EMACHINE_COMMAND.SET_POLL:
            data = this.essp.poll();
            await this.serialService.write(data);
            result = { polling: true };
            break;
          case EMACHINE_COMMAND.ENABLE:
            data = this.essp.enable();
            await this.serialService.write(data);
            result = { enabled: true };
            break;
          case EMACHINE_COMMAND.GET_SN:
            data = this.essp.getSerialNumber();
            await this.serialService.write(data);
            result = { serialNumberRequested: true };
            break;
          case EMACHINE_COMMAND.RESET:
            data = this.essp.reset();
            await this.serialService.write(data);
            this.totalValue = 0;
            this.creditCount = 0;
            this.creditValue = 0;
            this.creditNotes = [];
            result = { reset: true };
            break;
          case EMACHINE_COMMAND.READ_EVENTS:
            result = { totalValue: this.totalValue, creditCount: this.creditCount, creditNotes: this.creditNotes };
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
    if (this.tCounter) clearInterval(this.tCounter);
    return this.serialService.close();
  }

  async listPorts(): Promise<SerialPortListResult> {
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
  | 'ERROR'
  | 'NOTE_REJECTED'
  | 'FRAUD_ATTEMPT';

type ListenerCallback = (data: { event: EsspEvent; details?: number[] }) => void;

class EsspProtocol {
  private sequenceCounter: number = 0;
  private id: number;
  public fixedKey: Uint8Array | null;
  private timeout: number;
  public key: Uint8Array | null = null;

  private listeners: Map<EsspEvent, ListenerCallback[]> = new Map();

  private channelMap: { [key: number]: number } = {};
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

    let result = packet;
    if (this.key && this.isEncryptionEnabled(command)) {
      const plaintext = packet.slice(1, -2);
      const padded = this.padTo16Bytes(plaintext);
      const encrypted = CryptoJS.AES.encrypt(
        CryptoJS.lib.WordArray.create(padded),
        CryptoJS.enc.Hex.parse(this.toHexString(this.key)),
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
      ).ciphertext.toString(CryptoJS.enc.Hex);
      const encryptedBytes = Buffer.from(encrypted, 'hex');
      const newPacket = new Uint8Array(1 + encryptedBytes.length + 2);
      newPacket[0] = 0x7F;
      newPacket.set(encryptedBytes, 1);
      const newCrcData = newPacket.slice(1, -2);
      const newCrc = this.calculateCrc16(newCrcData);
      newPacket[newPacket.length - 2] = newCrc & 0xFF;
      newPacket[newPacket.length - 1] = (newCrc >> 8) & 0xFF;
      result = newPacket;
    }

    const stuffed = [0x7F];
    for (let i = 1; i < result.length; i++) {
      stuffed.push(result[i]);
      if (result[i] === 0x7F) stuffed.push(0x7F);
    }

    this.sequenceCounter = (this.sequenceCounter + 1) % 0x80;
    return this.toHexString(new Uint8Array(stuffed));
  }

  private padTo16Bytes(data: Uint8Array): Uint8Array {
    const paddingLength = 16 - (data.length % 16);
    const padded = new Uint8Array(data.length + (paddingLength === 16 ? 0 : paddingLength));
    padded.set(data);
    for (let i = data.length; i < padded.length; i++) padded[i] = 0;
    return padded;
  }

  public setGenerator(generator: number[]): string { return this.buildPacket(0x4A, generator); }
  public setModulus(modulus: number[]): string { return this.buildPacket(0x4B, modulus); }
  public requestKeyExchange(key: number[]): string { return this.buildPacket(0x4C, key); }

  public parsePacket(hexString: string): { command: number; data: number[] } {
    const matches = hexString.match(/.{1,2}/g);
    if (!matches) throw new Error('Invalid hex string format');
    const bytes = matches.map(byte => parseInt(byte, 16));
    const unstuffed = [bytes[0]];
    for (let i = 1; i < bytes.length; i++) {
      if (bytes[i] === 0x7F && bytes[i - 1] === 0x7F) continue;
      unstuffed.push(bytes[i]);
    }
    const packet = new Uint8Array(unstuffed);
    if (packet[0] !== 0x7F) throw new Error('Invalid STX');
    const length = packet[2];
    const dataEnd = 3 + length;
    if (dataEnd + 2 > packet.length) throw new Error('Packet too short');
    const crc = (packet[dataEnd + 1] << 8) | packet[dataEnd];
    const crcData = packet.slice(1, dataEnd);
    if (this.calculateCrc16(crcData) !== crc) throw new Error('CRC mismatch');

    const command = packet[3];
    const data = Array.from(packet.slice(4, dataEnd));
    if (command === 0x07) this.processPollResponse(data);
    return { command, data };
  }

  private isEncryptionEnabled(command: number): boolean {
    return command !== 0x11 && command !== 0x06; // SYNC and Protocol Version unencrypted
  }

  // Core Commands
  public sync(): string { return this.buildPacket(0x11); }
  public getSerialNumber(): string { return this.buildPacket(0x20); }
  public enable(): string { return this.buildPacket(0x0A); }
  public poll(): string { return this.buildPacket(0x07); }
  public disable(): string { return this.buildPacket(0x09); }
  public reset(): string { return this.buildPacket(0x01); }
  public setInhibits(channels: number[]): string {
    let lowByte = 0;
    for (let i = 0; i < Math.min(channels.length, 8); i++) {
      if (channels[i] === 1) lowByte |= (1 << i);
    }
    const highByte = 0; // No channels 9-16
    return this.buildPacket(0x02, [lowByte, highByte]);
  }
  public hostProtocolVersion(version: number): string { return this.buildPacket(0x06, [version]); }
  public setupRequest(): string { return this.buildPacket(0x05); }

  private processPollResponse(data: number[]): void {
    for (let i = 0; i < data.length; i++) {
      switch (data[i]) {
        case 0xF0: this.emit('OK'); break;
        case 0xEF:
          if (i + 1 < data.length) { this.emit('READ_NOTE', [data[++i]]); } else { this.emit('ERROR', [data[i]]); }
          break;
        case 0xEE:
          if (i + 1 < data.length) { this.emit('CREDIT_NOTE', [data[++i]]); } else { this.emit('ERROR', [data[i]]); }
          break;
        case 0xEC: this.emit('NOTE_REJECTED'); break;
        case 0xE8: this.emit('JAMMED'); break;
        case 0xE7: this.emit('JAM_RECOVERY'); break;
        case 0xE6: this.emit('DISABLED'); break;
        case 0xE1: this.emit('FRAUD_ATTEMPT', i + 1 < data.length ? [data[++i]] : undefined); break;
        case 0xD6: this.emit('DISPENSED'); break;
        default: this.emit('ERROR', [data[i]]); break;
      }
    }
  }

  private getValueFromChannel(channel: number): number {
    return this.channelMap[channel] || 0;
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