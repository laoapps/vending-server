import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, hexToUint8Array, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import * as CryptoJS from 'crypto-js';
import BigInt from 'big-integer';

@Injectable({
  providedIn: 'root'
})
export class EsspNV9USBService implements ISerialService {
  private machineId = '11111111';
  private portName = '/dev/ttyS1';
  private baudRate: number;
  public log: IlogSerial = { data: '', limit: 50 };
  private otp = '111111';
  private parity: 'none' = 'none';
  private dataBits: 8 = 8;
  private stopBits: 1 = 1;
  private essp: EsspProtocol;
  private totalValue = 0;
  private transactionID = -1;
  private counter = 0;
  private tCounter: any;
  private creditCount = 0;
  private creditValue = 0;
  private creditNotes: { value: number; channel: number }[] = [];
  private channelMap: { [key: number]: number } = {};
  private channels: number[]=[1, 1, 1, 1, 1, 1, 1];
  machinestatus = { data: '' };

  constructor(
    private serialService: SerialServiceService
  ) {
  }

  async initializeSerialPort(
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
        const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
        if (init !== this.portName) throw new Error(`Port initialization failed: ${init}`);
        
        this.serialService.startReading();
        this.initEssp(this.channels);
        await this.setupDevice(this.channels);
        resolve(init);
      } catch (err) {
        reject(new Error(`Initialization failed: ${err.message}`));
      }
    });
  }

  setChannels(channels: number[]): void {
    this.channels = channels;
  }

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }

  private initEssp(channels: number[]): void {
    console.log('eSSP Initializing NV9 USB');
    this.essp = new EsspProtocol({ id: 0x00, fixedKey: '0123456701234567', timeout: 3000 });
    this.channelMap = {}; // Initialize dynamically later

    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = event.data;
        this.addLogMessage(this.log, `Raw data: ${hexData}`);
        console.log('eSSP Received:', hexData);
        try {
          const response = this.essp.parsePacket(hexData);
          this.handleResponse(response.command, response.data);
        } catch (err) {
          this.addLogMessage(this.log, `Parse error: ${err.message}`, `Stack: ${err.stack}`);
          console.error('eSSP Parse error:', err);
        }
      } else if (event.event === 'serialOpened') {
        this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
      }
    });

    this.registerEventListeners();

    setInterval(async () => {
      if (this.transactionID !== -1 && (await this.serialService.isPortOpen())) {
        const pollPacket = this.essp.poll();
        this.addLogMessage(this.log, `Polling with packet: ${pollPacket}`);
        await this.serialService.write(pollPacket);
      }
    }, 1000);
  }

  private registerEventListeners(): void {
    this.essp.on('CREDIT_NOTE', ({ details }) => {
      const channel = details![0];
      const value = this.getValueFromChannel(channel);
      this.creditCount++;
      this.creditValue += value;
      this.creditNotes.push({ value, channel });
      this.addLogMessage(this.log, `CREDIT_NOTE: channel=${channel}, value=${value}, total=${this.creditValue}`);
    });
    this.essp.on('READ_NOTE', ({ details }) => this.addLogMessage(this.log, `READ_NOTE: channel=${details![0]}`));
    this.essp.on('NOTE_REJECTED', () => this.addLogMessage(this.log, 'NOTE_REJECTED'));
    this.essp.on('JAMMED', () => this.addLogMessage(this.log, 'JAMMED'));
    this.essp.on('JAM_RECOVERY', () => this.addLogMessage(this.log, 'JAM_RECOVERY'));
    this.essp.on('DISABLED', () => this.addLogMessage(this.log, 'DISABLED'));
    this.essp.on('FRAUD_ATTEMPT', ({ details }) => this.addLogMessage(this.log, `FRAUD_ATTEMPT: channel=${details?.[0]}`));
    this.essp.on('OK', () => this.addLogMessage(this.log, 'OK'));
    this.essp.on('ERROR', ({ details }) => this.addLogMessage(this.log, `ERROR: code=${details![0].toString(16)}`));
  }

  private async setupDevice(channels: number[]): Promise<void> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const generator = this.hexToBytes('D4E2F63A5B7C1900');
        const modulus = this.hexToBytes('F7A9B3C8D1E4F200');
        const hostIntKey = this.hexToBytes('1234567890ABCDEF');

        this.logCommand('SYNC', this.essp.sync());
        await this.serialService.write(this.essp.sync());
        await this.waitForResponse(0xF0, 'SYNC');

        this.logCommand('HOST_PROTOCOL_VERSION', this.essp.hostProtocolVersion(7));
        await this.serialService.write(this.essp.hostProtocolVersion(7));
        await this.waitForResponse(0xF0, 'HOST_PROTOCOL_VERSION');

        this.logCommand('SET_GENERATOR', this.essp.setGenerator(generator));
        await this.serialService.write(this.essp.setGenerator(generator));
        await this.waitForResponse(0xF0, 'SET_GENERATOR');

        this.logCommand('SET_MODULUS', this.essp.setModulus(modulus));
        await this.serialService.write(this.essp.setModulus(modulus));
        await this.waitForResponse(0xF0, 'SET_MODULUS');

        this.logCommand('REQUEST_KEY_EXCHANGE', this.essp.requestKeyExchange(hostIntKey));
        await this.serialService.write(this.essp.requestKeyExchange(hostIntKey));
        await this.waitForResponse(0x4C, 'REQUEST_KEY_EXCHANGE');

        this.logCommand('GET_SERIAL_NUMBER', this.essp.getSerialNumber());
        await this.serialService.write(this.essp.getSerialNumber());
        await this.waitForResponse(0x20, 'SERIAL_NUMBER');

        this.logCommand('RESET', this.essp.reset());
        await this.serialService.write(this.essp.reset());
        await this.waitForResponse(0xF0, 'RESET');

        this.logCommand('SETUP_REQUEST', this.essp.setupRequest());
        await this.serialService.write(this.essp.setupRequest());
        await this.waitForResponse(0x05, 'SETUP_REQUEST');

        this.logCommand('SET_INHIBITS', this.essp.setInhibits(channels));
        await this.serialService.write(this.essp.setInhibits(channels));
        await this.waitForResponse(0xF0, 'SET_INHIBITS');

        this.logCommand('ENABLE', this.essp.enable());
        await this.serialService.write(this.essp.enable());
        await this.waitForResponse(0xF0, 'ENABLE');

        this.addLogMessage(this.log, 'NV9 USB setup complete');
        return;
      } catch (err) {
        this.addLogMessage(this.log, `Setup attempt ${attempt} failed: ${err.message}`);
        if (attempt === maxRetries) throw new Error(`Setup failed after ${maxRetries} attempts: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
      }
    }
  }

  private logCommand(commandName: string, packet: string): void {
    this.addLogMessage(this.log, `Sending ${commandName}: ${packet}`);
  }

  private hexToBytes(hex: string): number[] {
    return hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
  }

  private waitForResponse(expectedCommand: number, commandName: string, timeoutMs = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`${commandName} timeout`)), timeoutMs);
      const sub = this.getSerialEvents().subscribe(event => {
        if (event.event === 'dataReceived') {
          try {
            const response = this.essp.parsePacket(event.data);
            if (response.command === expectedCommand) {
              clearTimeout(timeout);
              sub.unsubscribe();
              resolve();
            } else if (response.command === 0xF8) {
              clearTimeout(timeout);
              sub.unsubscribe();
              reject(new Error(`${commandName} failed with data: ${response.data}`));
            }
          } catch (err) {
            this.addLogMessage(this.log, `${commandName} parse error: ${err.message}`);
          }
        }
      });
    });
  }

  private handleResponse(command: number, data: number[]): void {
    switch (command) {
      case 0x20: // SERIAL_NUMBER
        const sn = data.reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
        this.addLogMessage(this.log, `Serial Number: ${sn}`);
        break;
      case 0x05: // SETUP_REQUEST
        this.parseSetupRequest(data);
        break;
      case 0x07: // POLL
        this.essp.processPollResponse(data); // Delegate to EsspProtocol
        break;
      case 0xF0: // OK
        break;
      case 0x4C: // REQUEST_KEY_EXCHANGE
        this.essp.completeKeyNegotiation(data);
        this.addLogMessage(this.log, 'Encryption key negotiated');
        break;
      default:
        this.addLogMessage(this.log, `Unhandled command: ${command.toString(16)}`);
    }
  }

  private parseSetupRequest(data: number[]): void {
    const channelCount = data[11];
    const channelValues = data.slice(12, 12 + channelCount);
    const valueMultiplier = data.slice(8, 11).reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
    channelValues.forEach((value, i) => {
      this.channelMap[i + 1] = value * valueMultiplier;
    });
    this.addLogMessage(this.log, `Setup: Channels=${JSON.stringify(this.channelMap)}`);
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
      if (this.counter <= 0) {
        clearInterval(this.tCounter);
        this.transactionID = -1;
        this.serialService.write(this.essp.disable());
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
    return this.serialService.listPorts();
  }
}



type EsspEvent =
  | 'JAM_RECOVERY'
  | 'DISABLED'
  | 'JAMMED'
  | 'CREDIT_NOTE'
  | 'READ_NOTE'
  | 'OK'
  | 'ERROR'
  | 'NOTE_REJECTED'
  | 'FRAUD_ATTEMPT'
  | 'STACKING'
  | 'STACKED'
  | 'REJECTING'
  | 'REJECTED'
  | 'SAFE_JAM'
  | 'UNSAFE_JAM'
  | 'STACKER_FULL'
  | 'NOTE_CLEARED_FROM_FRONT'
  | 'NOTE_CLEARED_TO_CASHBOX'
  | 'CASHBOX_REMOVED'
  | 'CASHBOX_REPLACED'
  | 'NOTE_PATH_OPEN'
  | 'CHANNEL_DISABLE';

type ListenerCallback = (data: { event: EsspEvent; details?: number[] }) => void;

class EsspProtocol {
  private sequenceCounter: number = 0;
  private id: number;
  private fixedKey: Uint8Array;
  private timeout: number;
  private key: Uint8Array | null = null;
  private encryptCounter: number = 0;
  private generator: BigInt.BigInteger;
  private modulus: BigInt.BigInteger;
  private hostInter: BigInt.BigInteger;

  private listeners: Map<EsspEvent, ListenerCallback[]> = new Map();

  constructor(options: { id?: number; fixedKey?: string; timeout?: number } = {}) {
    this.id = options.id ?? 0x00;
    this.fixedKey = options.fixedKey
      ? new Uint8Array(options.fixedKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
      : new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x01, 0x23, 0x45, 0x67]);
    this.timeout = options.timeout ?? 3000;
    this.generator = BigInt(0);
    this.modulus = BigInt(0);
    this.hostInter = BigInt(0);
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

  private padTo16Bytes(data: Uint8Array): Uint8Array {
    const paddingLength = 16 - (data.length % 16);
    const padded = new Uint8Array(data.length + (paddingLength === 16 ? 0 : paddingLength));
    padded.set(data);
    for (let i = data.length; i < padded.length; i++) padded[i] = 0; // Use 0 padding for PKCS#7
    return padded;
  }

  public buildPacket(command: number, data: number[] = []): string {
    const length = data.length + 1;
    const seqId = (this.sequenceCounter << 7) | this.id;
    const packetBody = new Uint8Array(2 + length);
    packetBody[0] = seqId;
    packetBody[1] = length;
    packetBody[2] = command;
    packetBody.set(data, 3);

    let result: Uint8Array;
    if (this.key && this.isEncryptionEnabled(command)) {
      const counterBytes = new Uint8Array(4);
      counterBytes[0] = this.encryptCounter & 0xFF;
      counterBytes[1] = (this.encryptCounter >> 8) & 0xFF;
      counterBytes[2] = (this.encryptCounter >> 16) & 0xFF;
      counterBytes[3] = (this.encryptCounter >> 24) & 0xFF;
      const plainText = new Uint8Array([0x7E, length + 4, ...counterBytes, command, ...data]);
      const padded = this.padTo16Bytes(plainText);
      const encrypted = CryptoJS.AES.encrypt(
        CryptoJS.lib.WordArray.create(padded),
        CryptoJS.enc.Hex.parse(this.toHexString(this.key)),
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
      ).ciphertext.toString(CryptoJS.enc.Hex);
      const encryptedBytes = hexToUint8Array(encrypted);
      result = new Uint8Array(1 + encryptedBytes.length + 2);
      result[0] = 0x7F;
      result.set(encryptedBytes, 1);
      const crcData = result.slice(1, -2);
      const crc = this.calculateCrc16(crcData);
      result[result.length - 2] = crc & 0xFF;
      result[result.length - 1] = (crc >> 8) & 0xFF;
      this.encryptCounter++;
    } else {
      result = new Uint8Array(1 + packetBody.length + 2);
      result[0] = 0x7F;
      result.set(packetBody, 1);
      const crc = this.calculateCrc16(packetBody);
      result[result.length - 2] = crc & 0xFF;
      result[result.length - 1] = (crc >> 8) & 0xFF;
    }

    const stuffed = [0x7F];
    for (let i = 1; i < result.length; i++) {
      stuffed.push(result[i]);
      if (result[i] === 0x7F) stuffed.push(0x7F);
    }

    this.sequenceCounter = (this.sequenceCounter + 1) % 2;
    return this.toHexString(new Uint8Array(stuffed));
  }

  public completeKeyNegotiation(slaveInterKey: number[]): void {
    const slaveKeyBig = BigInt.fromArray(slaveInterKey, 256);
    const hostKey = this.hostInter.modPow(slaveKeyBig, this.modulus);
    const hostKeyBytes = this.bigIntToBytes(hostKey, 8);
    this.key = new Uint8Array([...this.fixedKey, ...hostKeyBytes]);
  }

  private bigIntToBytes(big: BigInt.BigInteger, length: number): Uint8Array {
    const hex = big.toString(16).padStart(length * 2, '0');
    return new Uint8Array(this.hexToBytes(hex));
  }

  private hexToBytes(hex: string): number[] {
    return hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
  }

  public parsePacket(hexString: string): { command: number; data: number[] } {
    const bytes = hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
    const unstuffed = [bytes[0]];
    for (let i = 1; i < bytes.length; i++) {
      if (bytes[i] === 0x7F && bytes[i - 1] === 0x7F) continue;
      unstuffed.push(bytes[i]);
    }
    const packet = new Uint8Array(unstuffed);
    if (packet[0] !== 0x7F) throw new Error('Invalid STX');

    const crcData = packet.slice(1, -2);
    const crcReceived = (packet[packet.length - 1] << 8) | packet[packet.length - 2];
    if (this.calculateCrc16(crcData) !== crcReceived) throw new Error('CRC mismatch');

    let command: number;
    let data: number[];
    if (this.key && packet[1] === 0x7E) {
      const encryptedData = packet.slice(1, -2);
      const encryptedHex = this.toHexString(encryptedData);
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Hex.parse(encryptedHex) } as CryptoJS.lib.CipherParams,
        CryptoJS.enc.Hex.parse(this.toHexString(this.key)),
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
      );
      const decryptedHex = decrypted.toString(CryptoJS.enc.Hex);
      const decryptedBytes = hexToUint8Array(decryptedHex);
      if (decryptedBytes[0] !== 0x7E) throw new Error('Invalid STEX');
      const length = decryptedBytes[1];
      const counter = decryptedBytes.slice(2, 6).reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
      if (counter !== this.encryptCounter) throw new Error('Sequence counter mismatch');
      this.encryptCounter++;
      command = decryptedBytes[6];
      data = Array.from(decryptedBytes.slice(7, 6 + length));
    } else {
      const seqId = packet[1];
      const length = packet[2];
      command = packet[3];
      data = Array.from(packet.slice(4, 3 + length));
    }

    return { command, data };
  }

  private isEncryptionEnabled(command: number): boolean {
    return ![0x11, 0x06, 0x4A, 0x4B, 0x4C].includes(command);
  }

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
    const highByte = 0;
    return this.buildPacket(0x02, [lowByte, highByte]);
  }
  public hostProtocolVersion(version: number): string { return this.buildPacket(0x06, [version]); }
  public setupRequest(): string { return this.buildPacket(0x05); }
  public setGenerator(generator: number[]): string {
    this.generator = BigInt.fromArray(generator, 256);
    return this.buildPacket(0x4A, generator);
  }
  public setModulus(modulus: number[]): string {
    this.modulus = BigInt.fromArray(modulus, 256);
    return this.buildPacket(0x4B, modulus);
  }
  public requestKeyExchange(key: number[]): string {
    this.hostInter = BigInt.fromArray(key, 256);
    return this.buildPacket(0x4C, key);
  }

  public processPollResponse(data: number[]): void {
    let i = 0;
    while (i < data.length) {
      switch (data[i]) {
        case 0xF0: this.emit('OK'); i++; break;
        case 0xEF: this.emit('READ_NOTE', [data[++i]]); i++; break;
        case 0xEE: this.emit('CREDIT_NOTE', [data[++i]]); i++; break;
        case 0xED: this.emit('REJECTING'); i++; break;
        case 0xEC: this.emit('REJECTED'); i++; break;
        case 0xEB: this.emit('STACKING'); i++; break;
        case 0xEA: this.emit('STACKED'); i++; break;
        case 0xE8: this.emit('JAMMED'); i++; break;
        case 0xE7: this.emit('JAM_RECOVERY'); i++; break;
        case 0xE6: this.emit('DISABLED'); i++; break;
        case 0xE2: this.emit('SAFE_JAM'); i++; break;
        case 0xE1: this.emit('FRAUD_ATTEMPT', [data[++i]]); i++; break;
        case 0xCC: this.emit('UNSAFE_JAM'); i++; break;
        case 0xE9: this.emit('STACKER_FULL'); i++; break;
        case 0xE3: this.emit('NOTE_CLEARED_FROM_FRONT', [data[++i]]); i++; break;
        case 0xE4: this.emit('NOTE_CLEARED_TO_CASHBOX', [data[++i]]); i++; break;
        case 0xDA: this.emit('CASHBOX_REMOVED'); i++; break;
        case 0xD9: this.emit('CASHBOX_REPLACED'); i++; break;
        case 0xB2: this.emit('NOTE_PATH_OPEN'); i++; break;
        case 0xB6: this.emit('CHANNEL_DISABLE'); i++; break;
        default: this.emit('ERROR', [data[i]]); i++; break;
      }
    }
  }

  public on(event: EsspEvent, callback: ListenerCallback): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: EsspEvent, details?: number[]): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      callback({ event, details });
    }
  }
}



///BAK
// import { Injectable } from '@angular/core';
// import { SerialServiceService } from './services/serialservice.service';
// import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, hexToUint8Array, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
// import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
// import * as CryptoJS from 'crypto-js';
// import BigInt from 'big-integer'; // For Diffie-Hellman key exchange

// @Injectable({
//   providedIn: 'root'
// })
// export class EsspNV9USBService implements ISerialService {
//   machineId = '11111111';
//   portName = '/dev/ttyS1';
//   baudRate = 9600;
//   log: IlogSerial = { data: '', limit: 50 };
//   otp = '111111';
//   parity: 'none' = 'none';
//   dataBits: 8 = 8;
//   stopBits: 1 = 1;
//   private essp: EsspProtocol;
//   private totalValue = 0;
//   private transactionID = -1;
//   private counter = 0;
//   private tCounter: any;
//   private creditCount = 0;
//   private creditValue = 0;
//   private creditNotes: { value: number; channel: number }[] = [];
//   private channelMap: { [key: number]: number } = {};
//   private channels = [1, 1, 1, 1, 1, 1, 1];
//   machinestatus = {data:''};
//   constructor(private serialService: SerialServiceService) {}

//   async initializeSerialPort(
//     portName: string,
//     baudRate: number,
//     log: IlogSerial,
//     machineId: string,
//     otp: string,
//     isNative: ESerialPortType
    
//   ): Promise<string> {
//     return new Promise<string>(async (resolve, reject) => {
//       this.machineId = machineId;
//       this.otp = otp;
//       this.portName = portName || this.portName;
//       this.baudRate = baudRate || this.baudRate;
//       this.log = log;

//       const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
//       this.serialService.startReading();

//       if (init === this.portName) {
//         this.initEssp(this.channels);
//         resolve(init);
//       } else {
//         reject(init);
//       }
//     });
//   }

//   setChannels(channels: number[]): void {
//     this.channels = channels;
//   }

//   private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
//     addLogMessage(log, message, consoleMessage);
//   }

//   private initEssp(channels = [1, 1, 1, 1, 1, 1, 1]): void {
//     console.log('eSSP Initializing NV9 USB');
//     this.essp = new EsspProtocol({ id: 0x00, fixedKey: '0123456701234567', timeout: 3000 });
//     this.initBankNotes();

//     this.getSerialEvents().subscribe((event) => {
//       if (event.event === 'dataReceived') {
//         const hexData = event.data;
//         this.addLogMessage(this.log, `Raw data: ${hexData}`);
//         console.log('eSSP Received:', hexData);
//         try {
//           const response = this.essp.parsePacket(hexData);
//           this.handleResponse(response.command, response.data);
//         } catch (err) {
//           this.addLogMessage(this.log, `Parse error: ${err.message}`, `Stack: ${err.stack}`);
//           console.error('eSSP Parse error:', err);
//         }
//       } else if (event.event === 'serialOpened') {
//         this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
//         this.setupDevice(channels).catch(err => {
//           this.addLogMessage(this.log, `Setup failed: ${err.message}`);
//           console.error('eSSP Setup failed:', err);
//         });
//       }
//     });

//     // Register event listeners
//     this.registerEventListeners();

//     setInterval(async () => {
//       if (this.transactionID !== -1) {
//         const pollPacket = this.essp.poll();
//         this.addLogMessage(this.log, `Polling with packet: ${pollPacket}`);
//         await this.serialService.write(pollPacket);
//       }
//     }, 1000);
//   }

//   private registerEventListeners(): void {
//     this.essp.on('CREDIT_NOTE', ({ details }) => {
//       const channel = details![0];
//       const value = this.getValueFromChannel(channel);
//       this.creditCount++;
//       this.creditValue += value;
//       this.creditNotes.push({ value, channel });
//       this.addLogMessage(this.log, `CREDIT_NOTE: channel=${channel}, value=${value}, total=${this.creditValue}`);
//     });

//     this.essp.on('READ_NOTE', ({ details }) => {
//       this.addLogMessage(this.log, `READ_NOTE: channel=${details![0]}`);
//     });

//     this.essp.on('NOTE_REJECTED', () => {
//       this.addLogMessage(this.log, 'NOTE_REJECTED');
//     });

//     this.essp.on('JAMMED', () => {
//       this.addLogMessage(this.log, 'JAMMED');
//     });

//     this.essp.on('JAM_RECOVERY', () => {
//       this.addLogMessage(this.log, 'JAM_RECOVERY');
//     });

//     this.essp.on('DISABLED', () => {
//       this.addLogMessage(this.log, 'DISABLED');
//     });

//     this.essp.on('FRAUD_ATTEMPT', ({ details }) => {
//       this.addLogMessage(this.log, `FRAUD_ATTEMPT: channel=${details?.[0]}`);
//     });

//     this.essp.on('OK', () => {
//       this.addLogMessage(this.log, 'OK');
//     });

//     this.essp.on('ERROR', ({ details }) => {
//       this.addLogMessage(this.log, `ERROR: code=${details![0].toString(16)}`);
//     });

//     // Add more NV9USB-specific events as needed from the protocol manual
//   }

//   private async setupDevice(channels = [1, 1, 1, 1, 1, 1, 1]): Promise<void> {
//     try {
//       // Key negotiation using Diffie-Hellman
//       const generator = this.hexToBytes('D4E2F63A5B7C1900');
//       const modulus = this.hexToBytes('F7A9B3C8D1E4F200');
//       const hostIntKey = this.hexToBytes('1234567890ABCDEF');

//       this.logCommand('SYNC', this.essp.sync());
//       await this.serialService.write(this.essp.sync());
//       await this.waitForResponse(0xF0, 'SYNC');

//       this.logCommand('HOST_PROTOCOL_VERSION', this.essp.hostProtocolVersion(7)); // Use protocol version 7 for NV9USB
//       await this.serialService.write(this.essp.hostProtocolVersion(7));
//       await this.waitForResponse(0xF0, 'HOST_PROTOCOL_VERSION');

//       this.logCommand('SET_GENERATOR', this.essp.setGenerator(generator));
//       await this.serialService.write(this.essp.setGenerator(generator));
//       await this.waitForResponse(0xF0, 'SET_GENERATOR');

//       this.logCommand('SET_MODULUS', this.essp.setModulus(modulus));
//       await this.serialService.write(this.essp.setModulus(modulus));
//       await this.waitForResponse(0xF0, 'SET_MODULUS');

//       this.logCommand('REQUEST_KEY_EXCHANGE', this.essp.requestKeyExchange(hostIntKey));
//       await this.serialService.write(this.essp.requestKeyExchange(hostIntKey));
//       const keyResponse = await this.waitForResponse(0x4C, 'REQUEST_KEY_EXCHANGE');
//       // Key negotiation completed in parsePacket

//       this.logCommand('GET_SERIAL_NUMBER', this.essp.getSerialNumber());
//       await this.serialService.write(this.essp.getSerialNumber());
//       await this.waitForResponse(0x20, 'SERIAL_NUMBER');

//       this.logCommand('RESET', this.essp.reset());
//       await this.serialService.write(this.essp.reset());
//       await this.waitForResponse(0xF0, 'RESET');

//       this.logCommand('SETUP_REQUEST', this.essp.setupRequest());
//       await this.serialService.write(this.essp.setupRequest());
//       await this.waitForResponse(0x05, 'SETUP_REQUEST');

//       this.logCommand('SET_INHIBITS', this.essp.setInhibits(channels));
//       await this.serialService.write(this.essp.setInhibits(channels));
//       await this.waitForResponse(0xF0, 'SET_INHIBITS');

//       this.logCommand('ENABLE', this.essp.enable());
//       await this.serialService.write(this.essp.enable());
//       await this.waitForResponse(0xF0, 'ENABLE');

//       this.addLogMessage(this.log, 'NV9 USB setup complete');
//       return new Promise<void>(resolve => resolve());
//     } catch (err) {
//       this.addLogMessage(this.log, `Setup error: ${err.message}`, `Stack: ${err.stack}`);
//       return new Promise<void>((resolve, reject) => reject(err));
//     }
//   }

//   private logCommand(commandName: string, packet: string): void {
//     this.addLogMessage(this.log, `Sending ${commandName}: ${packet}`);
//   }

//   private hexToBytes(hex: string): number[] {
//     return hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
//   }

//   private waitForResponse(expectedCommand: number, commandName: string): Promise<void> {
//     return new Promise((resolve, reject) => {
//       const timeout = setTimeout(() => {
//         reject(new Error(`${commandName} timeout`));
//       }, 1000);

//       const sub = this.getSerialEvents().subscribe(event => {
//         if (event.event === 'dataReceived') {
//           const hexData = event.data;
//           try {
//             const response = this.essp.parsePacket(hexData);
//             if (response.command === expectedCommand) {
//               clearTimeout(timeout);
//               sub.unsubscribe();
//               resolve();
//             } else if (response.command === 0xF8) { // FAIL
//               clearTimeout(timeout);
//               sub.unsubscribe();
//               reject(new Error(`${commandName} failed with data: ${response.data}`));
//             }
//           } catch (err) {
//             this.addLogMessage(this.log, `${commandName} parse error: ${err.message}`);
//           }
//         }
//       });
//     });
//   }

//   private handleResponse(command: number, data: number[]): void {
//     switch (command) {
//       case 0x20: // SERIAL_NUMBER
//         const sn = data.reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
//         this.addLogMessage(this.log, `Serial Number: ${sn}`);
//         break;
//       case 0x05: // SETUP_REQUEST
//         this.parseSetupRequest(data);
//         break;
//       case 0x07: // POLL
//         break; // Handled by processPollResponse
//       case 0xF0: // OK
//         break; // Handled by event
//       case 0x4C: // REQUEST_KEY_EXCHANGE
//         this.essp.completeKeyNegotiation(data);
//         this.addLogMessage(this.log, 'Encryption key negotiated');
//         break;
//       default:
//         this.addLogMessage(this.log, `Unhandled command: ${command.toString(16)}`);
//     }
//   }

//   private parseSetupRequest(data: number[]): void {
//     const channelCount = data[11];
//     const channelValues = data.slice(12, 12 + channelCount);
//     const valueMultiplier = data.slice(8, 11).reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
//     channelValues.forEach((value, i) => {
//       this.channelMap[i + 1] = value * valueMultiplier;
//     });
//     this.addLogMessage(this.log, `Setup: Channels=${JSON.stringify(this.channelMap)}`);
//   }

//   private initBankNotes(): void {
//     this.channelMap = {
//       1: 1000, 2: 2000, 3: 5000, 4: 10000, 5: 20000, 6: 50000, 7: 100000
//     };
//   }

//   private getValueFromChannel(channel: number): number {
//     return this.channelMap[channel] || 0;
//   }

//   setTransactionID(transactionID: number, counter: number = 30): void {
//     this.transactionID = transactionID;
//     this.setCounter(counter);
//     if (this.transactionID !== -1) {
//       this.serialService.write(this.essp.reset()).then(() => {
//         this.serialService.write(this.essp.enable());
//         this.creditCount = 0;
//         this.creditValue = 0;
//         this.creditNotes = [];
//       });
//     } else {
//       this.serialService.write(this.essp.disable());
//     }
//   }

//   private setCounter(v: number): void {
//     this.counter = v;
//     if (this.tCounter) clearInterval(this.tCounter);
//     this.tCounter = setInterval(() => {
//       this.counter--;
//       if (this.counter <= 0) {
//         clearInterval(this.tCounter);
//         this.transactionID = -1;
//         this.serialService.write(this.essp.disable());
//       }
//     }, 1000);
//   }

//   command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
//     return new Promise<IResModel>(async (resolve, reject) => {
//       try {
//         let data: string;
//         let result: any = {};

//         switch (command) {
//           case EMACHINE_COMMAND.SYNC:
//             data = this.essp.sync();
//             await this.serialService.write(data);
//             result = { synced: true };
//             break;
//           case EMACHINE_COMMAND.SET_POLL:
//             data = this.essp.poll();
//             await this.serialService.write(data);
//             result = { polling: true };
//             break;
//           case EMACHINE_COMMAND.ENABLE:
//             data = this.essp.enable();
//             await this.serialService.write(data);
//             result = { enabled: true };
//             break;
//           case EMACHINE_COMMAND.GET_SN:
//             data = this.essp.getSerialNumber();
//             await this.serialService.write(data);
//             result = { serialNumberRequested: true };
//             break;
//           case EMACHINE_COMMAND.RESET:
//             data = this.essp.reset();
//             await this.serialService.write(data);
//             this.totalValue = 0;
//             this.creditCount = 0;
//             this.creditValue = 0;
//             this.creditNotes = [];
//             result = { reset: true };
//             break;
//           case EMACHINE_COMMAND.READ_EVENTS:
//             result = { totalValue: this.totalValue, creditCount: this.creditCount, creditNotes: this.creditNotes };
//             break;
//           default:
//             resolve(PrintSucceeded(command, params, 'unknown command'));
//             return;
//         }

//         resolve(PrintSucceeded(command, result, 'command executed'));
//       } catch (err) {
//         reject(err);
//       }
//     });
//   }

//   checkSum(data?: any[]): string {
//     return data ? data.join('') : '';
//   }

//   getSerialEvents() {
//     return this.serialService.getSerialEvents();
//   }

//   close(): Promise<void> {
//     if (this.tCounter) clearInterval(this.tCounter);
//     return this.serialService.close();
//   }

//   async listPorts(): Promise<SerialPortListResult> {
//     return  this.serialService.listPorts();
//   }
// }

// type EsspEvent =
//   | 'JAM_RECOVERY'
//   | 'DISABLED'
//   | 'JAMMED'
//   | 'CREDIT_NOTE'
//   | 'READ_NOTE'
//   | 'OK'
//   | 'ERROR'
//   | 'NOTE_REJECTED'
//   | 'FRAUD_ATTEMPT'
//   | 'STACKING'
//   | 'STACKED'
//   | 'REJECTING'
//   | 'REJECTED'
//   | 'SAFE_JAM'
//   | 'UNSAFE_JAM'
//   | 'STACKER_FULL'
//   | 'NOTE_CLEARED_FROM_FRONT'
//   | 'NOTE_CLEARED_TO_CASHBOX'
//   | 'CASHBOX_REMOVED'
//   | 'CASHBOX_REPLACED'
//   | 'NOTE_PATH_OPEN'
//   | 'CHANNEL_DISABLE';

// type ListenerCallback = (data: { event: EsspEvent; details?: number[] }) => void;

// class EsspProtocol {
//   private sequenceCounter: number = 0;
//   private id: number;
//   public fixedKey: Uint8Array;
//   private timeout: number;
//   public key: Uint8Array | null = null;
//   private encryptCounter: number = 0;
//   private generator: BigInt.BigInteger;
//   private modulus: BigInt.BigInteger;
//   private hostInter: BigInt.BigInteger;

//   private listeners: Map<EsspEvent, ListenerCallback[]> = new Map();

//   constructor(options: { id?: number; fixedKey?: string; timeout?: number } = {}) {
//     this.id = options.id ?? 0x00;
//     this.fixedKey = options.fixedKey
//       ? new Uint8Array(options.fixedKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
//       : new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x01, 0x23, 0x45, 0x67]);
//     this.timeout = options.timeout ?? 3000;
//     this.generator = BigInt(0);
//     this.modulus = BigInt(0);
//     this.hostInter = BigInt(0);
//   }

//   private calculateCrc16(data: Uint8Array): number {
//     let crc = 0xFFFF;
//     for (let byte of data) {
//       crc ^= byte;
//       for (let i = 0; i < 8; i++) {
//         if (crc & 0x0001) {
//           crc = (crc >> 1) ^ 0x8408;
//         } else {
//           crc >>= 1;
//         }
//       }
//     }
//     return crc;
//   }

//   private toHexString(bytes: Uint8Array): string {
//     return Array.from(bytes)
//       .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
//       .join('');
//   }

//   private padTo16Bytes(data: Uint8Array): Uint8Array {
//     const paddingLength = 16 - (data.length % 16);
//     const padded = new Uint8Array(data.length + (paddingLength === 16 ? 0 : paddingLength));
//     padded.set(data);
//     for (let i = data.length; i < padded.length; i++) padded[i] = Math.floor(Math.random() * 256);
//     return padded;
//   }

//   public buildPacket(command: number, data: number[] = []): string {
//     const length = data.length + 1;
//     const seqId = (this.sequenceCounter << 7) | this.id;
//     const packetBody = new Uint8Array(2 + length);
//     packetBody[0] = seqId;
//     packetBody[1] = length;
//     packetBody[2] = command;
//     packetBody.set(data, 3);

//     let result: Uint8Array;
//     if (this.key && this.isEncryptionEnabled(command)) {
//       const counterBytes = new Uint8Array(4);
//       counterBytes[0] = this.encryptCounter & 0xFF;
//       counterBytes[1] = (this.encryptCounter >> 8) & 0xFF;
//       counterBytes[2] = (this.encryptCounter >> 16) & 0xFF;
//       counterBytes[3] = (this.encryptCounter >> 24) & 0xFF;
//       const plainText = new Uint8Array([0x7E, length + 4, ...counterBytes, command, ...data]);
//       const padded = this.padTo16Bytes(plainText);
//       const encrypted = CryptoJS.AES.encrypt(
//         CryptoJS.lib.WordArray.create(padded),
//         CryptoJS.enc.Hex.parse(this.toHexString(this.key)),
//         { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
//       ).ciphertext.toString(CryptoJS.enc.Hex);
//       const encryptedBytes = hexToUint8Array(encrypted);
//       result = new Uint8Array(1 + encryptedBytes.length + 2);
//       result[0] = 0x7F;
//       result.set(encryptedBytes, 1);
//       const crcData = result.slice(1, -2);
//       const crc = this.calculateCrc16(crcData);
//       result[result.length - 2] = crc & 0xFF;
//       result[result.length - 1] = (crc >> 8) & 0xFF;
//       this.encryptCounter++;
//     } else {
//       result = new Uint8Array(1 + packetBody.length + 2);
//       result[0] = 0x7F;
//       result.set(packetBody, 1);
//       const crc = this.calculateCrc16(packetBody);
//       result[result.length - 2] = crc & 0xFF;
//       result[result.length - 1] = (crc >> 8) & 0xFF;
//     }

//     const stuffed = [0x7F];
//     for (let i = 1; i < result.length; i++) {
//       stuffed.push(result[i]);
//       if (result[i] === 0x7F) stuffed.push(0x7F);
//     }

//     this.sequenceCounter = (this.sequenceCounter + 1) % 2;
//     return this.toHexString(new Uint8Array(stuffed));
//   }

//   public completeKeyNegotiation(slaveInterKey: number[]): void {
//     const slaveKeyBig = BigInt.fromArray(slaveInterKey, 256);
//     const hostKey = this.hostInter.modPow(slaveKeyBig, this.modulus);
//     const hostKeyBytes = this.bigIntToBytes(hostKey, 8);
//     this.key = new Uint8Array([...this.fixedKey, ...hostKeyBytes]);
//   }

//   private bigIntToBytes(big: BigInt.BigInteger, length: number): Uint8Array {
//     const hex = big.toString(16).padStart(length * 2, '0');
//     return new Uint8Array(this.hexToBytes(hex));
//   }

//   private hexToBytes(hex: string): number[] {
//     return hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
//   }

//   public parsePacket(hexString: string): { command: number; data: number[] } {
//     const bytes = hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16));
//     const unstuffed = [bytes[0]];
//     for (let i = 1; i < bytes.length; i++) {
//       if (bytes[i] === 0x7F && bytes[i - 1] === 0x7F) continue;
//       unstuffed.push(bytes[i]);
//     }
//     const packet = new Uint8Array(unstuffed);
//     if (packet[0] !== 0x7F) throw new Error('Invalid STX');
  
//     const crcData = packet.slice(1, -2);
//     const crcReceived = (packet[packet.length - 1] << 8) | packet[packet.length - 2];
//     if (this.calculateCrc16(crcData) !== crcReceived) throw new Error('CRC mismatch');
  
//     let command: number;
//     let data: number[];
//     if (this.key && packet[1] === 0x7E) { // Encrypted packet
//       const encryptedData = packet.slice(1, -2);
//       // Convert encrypted data to hex string for decryption
//       const encryptedHex = this.toHexString(encryptedData);
//       // Decrypt using CryptoJS
//       const decrypted = CryptoJS.AES.decrypt(
//         { ciphertext: CryptoJS.enc.Hex.parse(encryptedHex) } as CryptoJS.lib.CipherParams, // Explicitly cast to CipherParams
//         CryptoJS.enc.Hex.parse(this.toHexString(this.key)),
//         { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
//       );
//       const decryptedHex = decrypted.toString(CryptoJS.enc.Hex);
//       const decryptedBytes = hexToUint8Array(decryptedHex);
//       if (decryptedBytes[0] !== 0x7E) throw new Error('Invalid STEX');
//       const length = decryptedBytes[1];
//       const counter = decryptedBytes.slice(2, 6).reduce((acc, byte, i) => acc + (byte << (i * 8)), 0);
//       if (counter !== this.encryptCounter) throw new Error('Sequence counter mismatch');
//       this.encryptCounter++;
//       command = decryptedBytes[6];
//       data = Array.from(decryptedBytes.slice(7, 6 + length));
//     } else {
//       const seqId = packet[1];
//       const length = packet[2];
//       command = packet[3];
//       data = Array.from(packet.slice(4, 3 + length));
//     }
  
//     if (command === 0x07) this.processPollResponse(data);
//     return { command, data };
//   }

//   private isEncryptionEnabled(command: number): boolean {
//     return ![0x11, 0x06, 0x4A, 0x4B, 0x4C].includes(command); // SYNC, PROTOCOL_VERSION, SET_GENERATOR, SET_MODULUS, REQUEST_KEY_EXCHANGE unencrypted
//   }

//   // Core Commands
//   public sync(): string { return this.buildPacket(0x11); }
//   public getSerialNumber(): string { return this.buildPacket(0x20); }
//   public enable(): string { return this.buildPacket(0x0A); }
//   public poll(): string { return this.buildPacket(0x07); }
//   public disable(): string { return this.buildPacket(0x09); }
//   public reset(): string { return this.buildPacket(0x01); }
//   public setInhibits(channels: number[]): string {
//     let lowByte = 0;
//     for (let i = 0; i < Math.min(channels.length, 8); i++) {
//       if (channels[i] === 1) lowByte |= (1 << i);
//     }
//     const highByte = 0;
//     return this.buildPacket(0x02, [lowByte, highByte]);
//   }
//   public hostProtocolVersion(version: number): string { return this.buildPacket(0x06, [version]); }
//   public setupRequest(): string { return this.buildPacket(0x05); }
//   public setGenerator(generator: number[]): string {
//     this.generator = BigInt.fromArray(generator, 256);
//     return this.buildPacket(0x4A, generator);
//   }
//   public setModulus(modulus: number[]): string {
//     this.modulus = BigInt.fromArray(modulus, 256);
//     return this.buildPacket(0x4B, modulus);
//   }
//   public requestKeyExchange(key: number[]): string {
//     this.hostInter = BigInt.fromArray(key, 256);
//     return this.buildPacket(0x4C, key);
//   }

//   private processPollResponse(data: number[]): void {
//     let i = 0;
//     while (i < data.length) {
//       switch (data[i]) {
//         case 0xF0: this.emit('OK'); i++; break;
//         case 0xEF: this.emit('READ_NOTE', [data[++i]]); i++; break;
//         case 0xEE: this.emit('CREDIT_NOTE', [data[++i]]); i++; break;
//         case 0xED: this.emit('REJECTING'); i++; break;
//         case 0xEC: this.emit('REJECTED'); i++; break;
//         case 0xEB: this.emit('STACKING'); i++; break;
//         case 0xEA: this.emit('STACKED'); i++; break;
//         case 0xE8: this.emit('JAMMED'); i++; break;
//         case 0xE7: this.emit('JAM_RECOVERY'); i++; break;
//         case 0xE6: this.emit('DISABLED'); i++; break;
//         case 0xE2: this.emit('SAFE_JAM'); i++; break;
//         case 0xE1: this.emit('FRAUD_ATTEMPT', [data[++i]]); i++; break;
//         case 0xCC: this.emit('UNSAFE_JAM'); i++; break;
//         case 0xE9: this.emit('STACKER_FULL'); i++; break;
//         case 0xE3: this.emit('NOTE_CLEARED_FROM_FRONT', [data[++i]]); i++; break;
//         case 0xE4: this.emit('NOTE_CLEARED_TO_CASHBOX', [data[++i]]); i++; break;
//         case 0xDA: this.emit('CASHBOX_REMOVED'); i++; break;
//         case 0xD9: this.emit('CASHBOX_REPLACED'); i++; break;
//         case 0xB2: this.emit('NOTE_PATH_OPEN'); i++; break;
//         case 0xB6: this.emit('CHANNEL_DISABLE'); i++; break;
//         default: this.emit('ERROR', [data[i]]); i++; break;
//       }
//     }
//   }

//   public on(event: EsspEvent, callback: ListenerCallback): void {
//     if (!this.listeners.has(event)) this.listeners.set(event, []);
//     this.listeners.get(event)!.push(callback);
//   }

//   private emit(event: EsspEvent, details?: number[]): void {
//     const callbacks = this.listeners.get(event) || [];
//     for (const callback of callbacks) {
//       callback({ event, details });
//     }
//   }
// }