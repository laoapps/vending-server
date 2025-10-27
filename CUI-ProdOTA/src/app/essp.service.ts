import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, hexToUint8Array, IBankNote, IlogSerial, IResModel, ISerialService } from './services/syste.model';
import { Subject } from 'rxjs';
import BigInt from 'big-integer';

// import { randomBytes } from 'crypto-es'; // Use crypto-es for random bytes
enum EEsspCommand {
  Sync = 'SYNC',
  SetChannelInhibits = 'SET_CHANNEL_INHIBITS',
  Enable = 'ENABLE',
  Disable = 'DISABLE',
  Reset = 'RESET',
  GetSerialNumber = 'GET_SERIAL_NUMBER',
  SetupRequest = 'SETUP_REQUEST',
  HostProtocolVersion = 'HOST_PROTOCOL_VERSION',
  SetGenerator = 'SET_GENERATOR',
  SetModulus = 'SET_MODULUS',
  RequestKeyExchange = 'REQ_KEY_EXCHANGE',
  Poll = 'POLL',
  DisplayOn = 'DISPLAY_ON',
  LastRejectCode = 'LAST_REJECT_CODE',
  UnitData = 'UNIT_DATA',
  ChannelValueRequest = 'CHANNEL_VALUE_REQUEST'
}
interface IEventInfo {
  name: EsspEvent;
  description: string;
  data: any;
}
enum EsspEvent {
  JAM_RECOVERY = 'JAM_RECOVERY',
  DISABLED = 'DISABLED',
  JAMMED = 'JAMMED',
  CREDIT_NOTE = 'CREDIT_NOTE',
  READ_NOTE = 'READ_NOTE',
  OK = 'OK',
  ERROR = 'ERROR',
  NOTE_REJECTED = 'NOTE_REJECTED',
  FRAUD_ATTEMPT = 'FRAUD_ATTEMPT',
  STACKING = 'STACKING',
  STACKED = 'STACKED',
  REJECTING = 'REJECTING',
  REJECTED = 'REJECTED',
  SAFE_JAM = 'SAFE_JAM',
  UNSAFE_JAM = 'UNSAFE_JAM',
  STACKER_FULL = 'STACKER_FULL',
  NOTE_CLEARED_FROM_FRONT = 'NOTE_CLEARED_FROM_FRONT',
  NOTE_CLEARED_TO_CASHBOX = 'NOTE_CLEARED_TO_CASHBOX',
  CASHBOX_REMOVED = 'CASHBOX_REMOVED',
  CASHBOX_REPLACED = 'CASHBOX_REPLACED',
  NOTE_PATH_OPEN = 'NOTE_PATH_OPEN',
  CHANNEL_DISABLE = 'CHANNEL_DISABLE',
  INITIALISING = 'INITIALISING',
  UNKNOWN = 'UNKNOWN',
}

@Injectable({
  providedIn: 'root'
})
export class EsspService implements ISerialService {
  sspId = 0x00;
  private machineId = '11111111';
  private portName = '/dev/ttyS1';
  private baudRate = 9600;
  public log: IlogSerial = { data: '', limit: 50 };
  private otp = '111111';
  private parity: string = 'none';
  private dataBits = 8;
  private stopBits = 2;
  private bufferSize = 1024;
  private flags = 0;
  private totalValue = 0;
  private counter = 0;
  private tCounter: any;
  private creditCount = 0;
  private creditValue = 0;
  private creditNotes: Array<IBankNote> = [];
  private sequenceFlag = false;
  private isEncrypted = false;
  private encryptKey?: Uint8Array;
  private sequenceCount = 0;
  notes = new Array<IBankNote>();
  private channels: number[] = [1, 1, 1, 1, 1, 1, 1];
  machinestatus = { data: '' };
  private responseSubject = new Subject<{ command: EEsspCommand; seqId: number; response: { status: number; data: number[] }; name?: string; description?: string }>();
  private eventSubject = new Subject<IEventInfo>();
  private fixedKey = new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x01, 0x23, 0x45, 0x67]);
  private generator = BigInt(0);
  private modulus = BigInt(0);
  private hostInter = BigInt(0);
  respTimeOut = 3000; // 30s for slower responses

  private pendingCommands: Map<number, { command: EEsspCommand; packet: string }> = new Map();
  private responseBuffer: string = '';
  private packetCounter = 0;
  private checkStuff = 0;
  private packetLength = 0;
  private buffer: Uint8Array = new Uint8Array(0);
  private bufferTimeout: any = null;
  private isPolling = false;

  constructor(private serialService: SerialServiceService) {
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexString = event.data?.toUpperCase();
        this.responseBuffer += hexString;
        this.addLogMessage(this.log, `Buffering response: ${this.responseBuffer}`);

        if (this.bufferTimeout) clearTimeout(this.bufferTimeout);
        this.bufferTimeout = setTimeout(() => {
          this.flushIncompleteBuffer();
        }, 2000);

        this.processBuffer();
      }
    });
    this.getEvents().subscribe(async (event) => {
      // GET THE CREDIT_NOTE here 

      // if(event.name== EsspEvent.CREDIT_NOTE){
      //   await this.disable();
      //   setTimeout(async()=>{
      //     await this.enable();
      //   },10000)
      // }
      console.log('COMMING DATA: ' + `name: ${event.name}, data: ${event.data}, description: ${event.description}`);
    })
  }
  isPrime(n: BigInt.BigInteger): boolean {
    if (n.lesserOrEquals(BigInt(1))) return false;
    if (n.equals(BigInt(2))) return true;
    if (n.mod(BigInt(2)).equals(BigInt(0))) return false;

    const sqrt = this.sqrtBigInt(n);
    for (let i = BigInt(3); i.lesserOrEquals(sqrt); i = i.plus(2)) {
      if (n.mod(i).equals(BigInt(0))) return false;
    }
    return true;
  }
  sqrtBigInt(n: BigInt.BigInteger): BigInt.BigInteger {
    if (n.lesser(BigInt(0))) {
      throw new Error('Square root of negative number is not supported');
    }
    if (n.equals(BigInt(0))) {
      return BigInt(0);
    }

    let low = BigInt(1);
    let high = n;
    let mid: BigInt.BigInteger;

    while (low.lesserOrEquals(high)) {
      mid = low.plus(high).divide(BigInt(2));
      const square = mid.times(mid);

      if (square.equals(n)) {
        return mid;
      } else if (square.lesser(n)) {
        low = mid.plus(1);
      } else {
        high = mid.minus(1);
      }
    }

    return high; // Return the floor of the square root
  }
  generatePrime(bits: number = 64): BigInt.BigInteger {
    const min = BigInt(1).shiftLeft(bits - 1); // 2^(bits-1)
    const max = BigInt(1).shiftLeft(bits).minus(1); // 2^bits - 1

    while (true) {
      const randomBuffer = new Uint8Array(Math.ceil(bits / 8));
      window.crypto.getRandomValues(randomBuffer);
      let num = BigInt(0);
      for (let i = 0; i < randomBuffer.length; i++) {
        num = num.shiftLeft(8).plus(randomBuffer[i]);
      }
      num = num.mod(max.minus(min)).plus(min); // Fit within range

      if (this.isPrime(num)) return num;
      num = num.plus(2); // Try next odd number
      if (num.greater(max)) num = min.plus(1); // Reset to min+1 if exceeds max
    }
  }
  private processBuffer(): void {
    const STX = 0x7F;
    while (this.responseBuffer.length >= 2) {
      const bytes = hexToUint8Array(this.responseBuffer);
      let processed = false;

      for (let ndx = 0; ndx < bytes.length; ndx++) {
        const byte = bytes[ndx];

        if (byte === STX && this.packetCounter === 0) {
          this.buffer = new Uint8Array([byte]);
          this.packetCounter++;
          this.addLogMessage(this.log, `Starting packet with STX at buffer: ${this.toHexString(this.buffer)}`);
        } else if (byte === STX && this.packetCounter > 0) {
          this.addLogMessage(this.log, `New STX detected, resetting packet`);
          this.resetPacket();
          this.buffer = new Uint8Array([byte]);
          this.packetCounter = 1;
        } else if (this.packetCounter > 0) {
          this.buffer = this.concatUint8Array(this.buffer, new Uint8Array([byte]));
          this.packetCounter++;

          if (this.packetCounter === 3) {
            this.packetLength = this.buffer[2] + 5;
            this.addLogMessage(this.log, `Packet length set to: ${this.packetLength}`);
          }

          if (this.packetLength > 0 && this.buffer.length >= this.packetLength) {
            const packetHex = this.toHexString(this.buffer);
            try {
              const parsed = this.parsePacket(packetHex);
              const decodedResponse = this.decodeEvents(parsed.command, parsed.seqId, parsed.data);
              console.log(' decodedResponse COMMING DATA: ' + `name: ${this.responseMap[parsed.command]?.name}, Parsed packet: ${packetHex}, Decoded: ${JSON.stringify(decodedResponse)}`)
              this.addLogMessage(this.log, `Parsed packet: ${packetHex}, Decoded: ${decodedResponse}`);
              const commandEntry = this.pendingCommands.get(parsed.seqId);
              this.eventSubject.next({ name: decodedResponse.name, data: decodedResponse.data, description: decodedResponse.description });

              if (commandEntry) {
                this.responseSubject.next({
                  command: commandEntry.command,
                  seqId: parsed.seqId,
                  response: { status: parsed.command, data: parsed.data },
                  name: this.responseMap[parsed.command]?.name,
                  description: JSON.stringify(decodedResponse)
                });
                this.pendingCommands.delete(parsed.seqId);
              } else {
                this.addLogMessage(this.log, `No pending command for seqId ${parsed.seqId}, likely a POLL event: ${decodedResponse}`);
              }
              this.resetPacket();
              this.responseBuffer = this.responseBuffer.substring(packetHex.length);
              processed = true;
              this.addLogMessage(this.log, `Remaining buffer: ${this.responseBuffer}`);
              break;
            } catch (e) {
              this.addLogMessage(this.log, `Failed to parse packet: ${packetHex}, Error: ${e.message}`);
              this.resetPacket();
              this.responseBuffer = this.responseBuffer.substring(ndx + 1);
              processed = true;
              break;
            }
          }
        }
      }

      if (!processed && this.packetCounter === 0 && this.responseBuffer.length >= 2 && bytes[0] !== STX) {
        this.responseBuffer = this.responseBuffer.substring(2);
        this.addLogMessage(this.log, `Cleared invalid data (no STX), new buffer: ${this.responseBuffer}`);
      } else if (!processed) {
        break;
      }
    }
  }

  private async flushIncompleteBuffer(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        if (this.responseBuffer.length > 0 && this.packetCounter > 0) {
          this.addLogMessage(this.log, `Flushing incomplete buffer: ${this.responseBuffer}`);
          this.resetPacket();
          const bufferCopy = this.responseBuffer;
          this.responseBuffer = '';

          this.pendingCommands.forEach(async (entry, seqId) => {
            this.addLogMessage(this.log, `Retrying command ${entry.command} due to incomplete response: ${bufferCopy}`);
            try {
              await this.serialService.write(entry.packet);
              this.addLogMessage(this.log, `Resent packet: ${entry.packet}`);
            } catch (e) {
              this.addLogMessage(this.log, `Retry write failed: ${e.message}`);
              this.responseSubject.error({ command: entry.command, seqId, message: 'Retry write failed' });
              this.pendingCommands.delete(seqId);
            }
          });
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

  }

  private resetPacket(): void {
    this.packetCounter = 0;
    this.checkStuff = 0;
    this.packetLength = 0;
    this.buffer = new Uint8Array(0);
  }

  private concatUint8Array(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
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
        console.log('Initializing serial port ' + this.portName + ' ' + this.baudRate);
        const init = await this.serialService.initializeSerialPort(
          this.portName,
          this.baudRate,
          this.log,
          ESerialPortType.Serial,
          this.dataBits,
          this.stopBits,
          this.parity,
          this.bufferSize,
          this.flags
        );

        if (init === this.portName) {
          await this.serialService.startReading();
          await this.initEssp();
          resolve(init)
        } else {
          reject(new Error(`Initialization failed: ${init}`));
        }
      } catch (err) {
        reject(new Error(`Initialization failed: ${err.message}`));
      }
    });
  }

  getResponses() {
    return this.responseSubject.asObservable();
  }
  getEvents() {
    return this.eventSubject.asObservable();
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  private stopPolling(): void {
    if (this.tCounter) {
      clearInterval(this.tCounter);
      this.tCounter = null;
    }
    this.isPolling = false;
    this.addLogMessage(this.log, 'Polling stopped');
  }

  // [Updated] close method
  close(): Promise<void> {
    this.stopPolling();
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
    }
    return this.serialService.close();
  }

  listPorts() {
    return this.serialService.listPorts();
  }

  public checkSum(data: string[]): string {
    return this.serialService.checkSumCRC(data);
  }

  async initEssp(): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      let retries = 20;
      while (retries > 0) {
        try {
          this.initBankNotes();
          const results = new Array<IResModel>();
          this.addLogMessage(this.log, 'Starting initialization...');

          results.push(await this.retryCommand(EEsspCommand.Sync, {}));
          this.addLogMessage(this.log, 'SYNC completed');
          // await this.delay(100);
          results.push(await this.retryCommand(EEsspCommand.HostProtocolVersion, { version: 6 }));
          this.addLogMessage(this.log, 'HostProtocolVersion completed');
          // await this.delay(100);
          await this.initEncryption();
          this.addLogMessage(this.log, 'Encryption completed');
          results.push(await this.retryCommand(EEsspCommand.GetSerialNumber, {}));
          this.addLogMessage(this.log, 'GetSerialNumber completed');
          // await this.delay(100);
          results.push(await this.retryCommand(EEsspCommand.Reset, {}));
          this.addLogMessage(this.log, 'Reset completed');
          // await this.delay(500);
          results.push(await this.retryCommand(EEsspCommand.DisplayOn, {}));
          this.addLogMessage(this.log, 'DisplayOn completed');
          // await this.delay(100);
          results.push(await this.retryCommand(EEsspCommand.Enable, {}));
          this.addLogMessage(this.log, 'Enable completed');
          // await this.delay(100);
          results.push(await this.retryCommand(EEsspCommand.SetupRequest, {}));
          this.addLogMessage(this.log, 'SetupRequest completed');
          // await this.delay(100);
          results.push(await this.retryCommand(EEsspCommand.SetChannelInhibits, { channels: this.channels }));
          this.addLogMessage(this.log, 'SetChannelInhibits completed');

          this.startPolling();
          this.addLogMessage(this.log, `Initialization completed: ${JSON.stringify(results)}`);
          resolve(results[0]);
          return;
        } catch (error) {
          retries--;
          this.addLogMessage(this.log, `Init attempt ${6 - retries} failed: ${error.message}, retries left: ${retries}`);
          if (retries === 0) {
            reject(new Error(`Initialization failed after 5 retries: ${error.message}`));
          } else {
            await this.delay(1000);
          }
        }
      }
    });
  }
  private async generateKeys(): Promise<{ generator: BigInt.BigInteger; modulus: BigInt.BigInteger; hostRandom: BigInt.BigInteger; hostInter: BigInt.BigInteger }> {
    try {
      const generator = this.generatePrime(16);
      const modulus = this.generatePrime(16);

      if (generator.eq(BigInt(0)) || modulus.eq(BigInt(0))) {
        throw new Error('GENERATOR and MODULUS should be > 0');
      }

      let gen = generator;
      let mod = modulus;
      if (gen.lt(mod)) {
        [mod, gen] = [gen, mod];
      }

      const randomBuffer = new Uint8Array(2);
      window.crypto.getRandomValues(randomBuffer);
      const randomValue = new DataView(randomBuffer.buffer).getUint16(0, true);
      const hostRandom = BigInt(randomValue).mod(BigInt('2147483648'));
      const hostInter = gen.modPow(hostRandom, mod);


      return new Promise((resolve, reject) => {
        resolve({ generator, modulus, hostRandom, hostInter });
      });
    } catch (error) {
      return new Promise((resolve, reject) => {
        reject(error);
      });
    }

  }
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateCrc16(data: Uint8Array): Uint8Array {
    let crc = 0xFFFF;
    const poly = 0x8005;

    for (const byte of data) {
      crc ^= (byte & 0xFF) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ poly : crc << 1;
      }
    }
    crc &= 0xFFFF;

    const crcBytes = new Uint8Array(2);
    crcBytes[0] = crc & 0xFF;         // LSB
    crcBytes[1] = (crc >> 8) & 0xFF;  // MSB
    return crcBytes;
  }

  private toHexString(bytes: Uint8Array): string {
    return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')?.toUpperCase()).join('');
  }

  private hexToUint8Array(hex: string): Uint8Array {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  }


  private async retryCommand(command: EEsspCommand, params: any = {}, retries: number = 20): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      try {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            return resolve( await this.commandEssp(command, params));
          } catch (e) {
            this.addLogMessage(this.log, `Attempt ${attempt} failed for ${command}: ${e.message}`);
            if (attempt === retries) throw e;
            await this.delay(100);
          }
        }
        throw new Error(`Failed to execute ${command} after ${retries} attempts`);
      } catch (error) {
        reject(error);
      }
    });


  }

  private async commandEssp(command: EEsspCommand, params: any = {}): Promise<IResModel> {
    console.log(`Sending ESSP command: ${command}`)
    this.addLogMessage(this.log, `Sending ESSP command: ${command}`);

    const STX = 0x7F;
    const seqId = this.sequenceFlag ? 0x80 | this.sspId : this.sspId;
    this.sequenceFlag = !this.sequenceFlag;

    let data: Uint8Array;
    let cmdByte: number;
    switch (command) {
      case EEsspCommand.Sync:
        cmdByte = 0x11;
        data = new Uint8Array([seqId, 0x01, cmdByte]);
        break;
      case EEsspCommand.HostProtocolVersion:
        cmdByte = 0x06;
        data = new Uint8Array([seqId, 0x02, cmdByte, params.version || 6]);
        break;
      case EEsspCommand.GetSerialNumber:
        cmdByte = 0x04;
        data = new Uint8Array([seqId, 0x01, cmdByte]);
        break;
      case EEsspCommand.Reset:
        cmdByte = 0x47;
        data = new Uint8Array([seqId, 0x01, cmdByte]);
        break;
      case EEsspCommand.Enable:
        cmdByte = 0x0A;
        data = new Uint8Array([seqId, 0x01, cmdByte]);
        break;
      case EEsspCommand.Disable:
        cmdByte = 0x09;
        data = new Uint8Array([seqId, 0x01, cmdByte]);
        break;
      case EEsspCommand.DisplayOn:
        cmdByte = 0x03;
        data = new Uint8Array([seqId, 0x01, cmdByte]);
        break;
      case EEsspCommand.SetupRequest:
        cmdByte = 0x05;
        data = new Uint8Array([seqId, 0x01, cmdByte]);
        break;
      case EEsspCommand.SetChannelInhibits:
        const channels = params.channels || [1, 1, 1, 1, 1, 1, 1];
        cmdByte = 0x02;
        data = new Uint8Array([seqId, channels.length + 1, cmdByte, ...channels]);
        break;
      case EEsspCommand.Poll:
        cmdByte = 0x07;
        data = new Uint8Array([seqId, 0x01, cmdByte]);
        break;
      case EEsspCommand.SetGenerator:
      case EEsspCommand.SetModulus:
      case EEsspCommand.RequestKeyExchange:
        cmdByte = command === EEsspCommand.SetGenerator ? 0x4A : command === EEsspCommand.SetModulus ? 0x4B : 0x4C;
        const keyBytes = this.numberToBytes(params.value || BigInt(0));
        data = new Uint8Array([seqId, keyBytes.length + 1, cmdByte, ...keyBytes]);
        break;
      default:
        throw new Error(`Unsupported command: ${command}`);
    }

    const crc = this.calculateCrc16(data);
    const packet = new Uint8Array([STX, ...data, ...crc]);
    const hexPacket = this.toHexString(packet);

    try {
      this.pendingCommands.set(seqId, { command, packet: hexPacket });
      await this.serialService.write(hexPacket);
      this.addLogMessage(this.log, `Sent packet: ${hexPacket}`);

      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          this.pendingCommands.delete(seqId);
          reject({ command, data: hexPacket, message: 'No response received', status: 0 });
        }, this.respTimeOut);

        const subscription = this.responseSubject.subscribe({
          next: (res) => {
            if (res.seqId === seqId) {
              clearTimeout(timeout);
              subscription.unsubscribe();
              this.pendingCommands.delete(seqId);
              let responseData = res.response.data.length > 0 ? res.response.data : ['OK'];
              if (command === EEsspCommand.GetSerialNumber && res.response.data.length > 0) {
                responseData = [this.bytesToNumber(res.response.data).toJSNumber()];
              }
              resolve({
                command,
                data: responseData.join(''),
                message: 'Command executed successfully',
                status: res.response.status === 0xF0 ? 1 : 0
              });
            }
          },
          error: (err) => {
            clearTimeout(timeout);
            subscription.unsubscribe();
            this.pendingCommands.delete(seqId);
            reject({ command, data: hexPacket, message: err.message, status: 0 });
          }
        });
      });
    } catch (e) {
      this.pendingCommands.delete(seqId);
      this.addLogMessage(this.log, `Write failed: ${e.message}`);
      return new Promise<IResModel>((resolve, reject) => {
        reject(e);
      });
    }
  }

  private async initEncryption(): Promise<void> {
    try {
      const newKeys = await this.generateKeys();
      // Assign keys directly to properties (similar to Node.js this.keys)
      this.generator = newKeys.generator;
      this.modulus = newKeys.modulus;
      this.hostInter = newKeys.hostInter;
      this.encryptKey = null; // Reset encryptKey
      this.sequenceCount = 0; // Reset sequenceCount (like eCount)



      const commands = [
        { command: EEsspCommand.SetGenerator, args: { value: this.generator } },
        { command: EEsspCommand.SetModulus, args: { value: this.modulus } },
        { command: EEsspCommand.RequestKeyExchange, args: { value: this.hostInter } },
      ];
      let result: IResModel;
      for (const { command, args } of commands) {
        result = await this.commandEssp(command, args);
        if (!result || result.status !== 1) { // Check status instead of success
          throw result;
        }
      }

      const slaveInterKey = this.bytesToNumber(result.data.slice(1));
      const sharedKey = slaveInterKey.modPow(newKeys.hostRandom, this.modulus);
      const keyBytes = this.numberToBytes(sharedKey, 8);
      this.encryptKey = new Uint8Array([...this.fixedKey, ...keyBytes.slice(-8)]);
      this.isEncrypted = true;
      this.addLogMessage(this.log, `Encryption initialized with key: ${this.toHexString(this.encryptKey)}`);
      return new Promise((resolve, reject) => {        resolve();
      });
    } catch (error) {
      console.error('initEncryption ' + JSON.stringify(error));
      return new Promise((resolve, reject) => {        reject(error);
      });
    }
  }

  private numberToBytes(num: BigInt.BigInteger, byteLength: number = 8): Uint8Array {
    const bytes = new Uint8Array(byteLength);
    let value = num;
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Number(value.and(0xFF));
      value = value.shiftRight(8);
    }
    return bytes;
  }

  private parsePacket(hexString: string): { seqId: number; command: number; data: number[] } {
    const bytes = this.hexToUint8Array(hexString);
    const unstuffed = [bytes[0]];
    for (let i = 1; i < bytes.length; i++) {
      if (bytes[i] === 0x7F && bytes[i - 1] === 0x7F) continue;
      unstuffed.push(bytes[i]);
    }
    const packet = new Uint8Array(unstuffed);
    if (packet[0] !== 0x7F) throw new Error('Invalid STX');
    if (packet.length < 5) throw new Error('Packet too short');

    const crcData = packet.slice(1, -2);
    const crcReceived = (packet[packet.length - 1] << 8) | packet[packet.length - 2];
    const crcCalculated = this.calculateCrc16(crcData);
    const crcCalcInt = (crcCalculated[1] << 8) | crcCalculated[0];

    if (crcCalcInt !== crcReceived) {
      console.log('CRC mismatch - Expected:', crcCalcInt.toString(16), 'Received:', crcReceived.toString(16));
      throw new Error('CRC mismatch');
    }

    const seqId = packet[1];
    const length = packet[2];
    const command = packet[3];
    const data = Array.from(packet.slice(4, 4 + length - 1));

    return { seqId, command, data };
  }

  private bytesToNumber(bytes: number[]): BigInt.BigInteger {
    let result = BigInt(0);
    for (let i = bytes.length - 1; i >= 0; i--) {
      result = result.shiftLeft(8).add(bytes[i]);
    }
    return result;
  }



  command(command: EMACHINE_COMMAND, params: any): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      switch (command) {
        case EMACHINE_COMMAND.INIT:
          return resolve(await this.initializeSerialPort(
            params.portName,
            params.baudRate,
            params.log,
            params.machineId,
            params.otp,
            params.isNative
          ).then(port => ({ command, data: port, message: 'Initialized', status: 1 })));
        case EMACHINE_COMMAND.CLOSE:
          return resolve({ command, data: await this.close(), message: '', status: -1 });
        case EMACHINE_COMMAND.LISTPORTS:
          return resolve({ command, data: await this.listPorts(), message: '', status: -1 });
        case EMACHINE_COMMAND.SETCHANNELINHIBITS:
          return resolve(await this.setChannelInhibits(params.channels));
        case EMACHINE_COMMAND.ENABLE:
          return resolve(await this.enable());
        case EMACHINE_COMMAND.DISABLE:
          return resolve(await this.disable());
        case EMACHINE_COMMAND.RESET:
          return resolve(await this.reset());
        case EMACHINE_COMMAND.GETSERIALNUMBER:
          return resolve(await this.getSerialNumber());
        case EMACHINE_COMMAND.SETUPREQUEST:
          return resolve(await this.setupRequest());
        default:
          return reject({ command, message: 'Command not found', status: 0 });
      }
    });
  }

  initBankNotes() {
    this.notes.push({ value: 1000, amount: 0, currency: 'LAK', channel: 1, image: 'lak1000.jpg' });
    this.notes.push({ value: 2000, amount: 0, currency: 'LAK', channel: 2, image: 'lak2000.jpg' });
    this.notes.push({ value: 5000, amount: 0, currency: 'LAK', channel: 3, image: 'lak5000.jpg' });
    this.notes.push({ value: 10000, amount: 0, currency: 'LAK', channel: 4, image: 'lak10000.jpg' });
    this.notes.push({ value: 20000, amount: 0, currency: 'LAK', channel: 5, image: 'lak20000.jpg' });
    this.notes.push({ value: 50000, amount: 0, currency: 'LAK', channel: 6, image: 'lak50000.jpg' });
    this.notes.push({ value: 100000, amount: 0, currency: 'LAK', channel: 7, image: 'lak100000.jpg' });
  }

  async syncEssp(): Promise<IResModel> {
    return this.retryCommand(EEsspCommand.Sync, {});
  }

  async setHostProtocol(): Promise<IResModel> {
    return this.retryCommand(EEsspCommand.HostProtocolVersion, { version: 6 });
  }

  async setChannelInhibits(channels: number[]): Promise<IResModel> {
    return this.retryCommand(EEsspCommand.SetChannelInhibits, { channels });
  }

  async reset(): Promise<IResModel> {
    return await this.retryCommand(EEsspCommand.Reset, {});
  }

  async getSerialNumber(): Promise<IResModel> {
    return await this.retryCommand(EEsspCommand.GetSerialNumber, {});
  }

  async setupRequest(): Promise<IResModel> {
    return await this.retryCommand(EEsspCommand.SetupRequest, {});
  }

  // [Updated] disable method
  async disable(): Promise<IResModel> {
    this.stopPolling();
    return await this.retryCommand(EEsspCommand.Disable, {});
  }

  // [Updated] enable method
  async enable(): Promise<IResModel> {
    const result = await this.retryCommand(EEsspCommand.Enable, {});
    if (result.status === 1) {
      this.startPolling();
    }
    return new Promise<IResModel>((resolve, reject) => {
      resolve(result);
    });
  }



  private addLogMessage(log: IlogSerial, message: string): void {
    addLogMessage(log, message);
  }

  public setChannels(channels = [1, 1, 1, 1, 1, 1, 1]) {
    this.channels = channels;
  }
  private convertBytesToInt32(bytes: number[]): number {
    if (bytes.length < 4) throw new Error('Insufficient bytes for Int32 conversion');
    // Big-endian: [MSB, ..., LSB]
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  }
  // Helper for unit type
  private getUnitType(type: number): string {
    const unitTypes: { [key: number]: string } = {
      0: "Banknote validator",
      3: "Smart Hopper",
      6: "SMART payout fitted",
      7: "Note Float fitted",
      8: "Addon Printer",
      11: "Stand Alone Printer",
      13: "TEBS",
      14: "TEBS with SMART Payout",
      15: "TEBS with SMART Ticket"
    };
    return unitTypes[type] || `Unknown (${type})`;
  }

  private decodeEvents(command: number, seqId: number, data: number[]): IEventInfo {
    console.log('seqId ' + seqId + ' command ' + command + ' status ' + command);
    const response = this.responseMap[command];
    let decoded = {} as IEventInfo
    decoded = response ? { name: response.name as EsspEvent, description: response.description, data } as IEventInfo : { name: 'UNKNOWN' as EsspEvent, description: command.toString(16), data } as IEventInfo;

    if (command === 0xF0) { // OK response
      if (data.length === 0) {
        decoded = { name: response.name as EsspEvent, description: response.description, data }; // Simple OK
      } else if (data.length >= 4 && this.pendingCommands.get(seqId)?.command === EEsspCommand.GetSerialNumber) {
        const serialNumber = this.convertBytesToInt32(data.slice(0, 4));
        decoded = { name: response.name as EsspEvent, description: serialNumber + '', data };
      } else if (data.length > 0) { // Poll events
        const eventCode = data[0];
        const eventInfo = this.responseMap[eventCode];
        decoded = eventInfo ? { name: eventInfo.name as EsspEvent, description: eventInfo.description, data } as IEventInfo : { name: 'UNKNOWN' as EsspEvent, description: eventCode.toString(16), data } as IEventInfo;;
        if (data.length > 1) {
          switch (eventCode) {
            case 238: // CREDIT_NOTE
            case 239: // READ_NOTE
              decoded.data = data[1];
              break;
            case 225: // NOTE_CLEARED_FROM_FRONT
            case 226: // NOTE_CLEARED_TO_CASHBOX
              decoded.data = data[1];
              break;
            case 230: // FRAUD_ATTEMPT
              if (data.length >= 2) decoded.data = data[1];
              break;
            default:
              decoded.data = this.toHexString(new Uint8Array(data.slice(1)));
          }
        }
      }
    } else if (data.length > 0) { // Non-OK events (unlikely for POLL, but kept for robustness)
      const eventCode = data[0];
      const eventInfo = this.responseMap[eventCode];
      decoded = eventInfo ? { name: eventInfo.name as EsspEvent, description: eventInfo.description, data } as IEventInfo : { name: 'UNKNOWN' as EsspEvent, description: eventCode.toString(16), data } as IEventInfo;
    }

    this.addLogMessage(this.log, `Decoded event: ${decoded}`);
    return decoded;
  }
  private startPolling(): void {
    if (this.tCounter) clearInterval(this.tCounter);
    this.isPolling = true;
    let retryCount = 0;
    const maxRetries = 5;
    let lastResponseTime = Date.now();

    this.tCounter = setInterval(async () => {
      if (!this.isPolling) return;
      try {
        this.addLogMessage(this.log, 'POLLING');
        const result = await this.retryCommand(EEsspCommand.Poll, {}, 20);
        this.addLogMessage(this.log, `Poll result: ${JSON.stringify(result)}`);
        retryCount = 0;
        lastResponseTime = Date.now();
      } catch (error) {
        retryCount++;
        this.addLogMessage(this.log, `Polling failed (attempt ${retryCount}/${maxRetries}): ${error.message}`);
        if (retryCount >= maxRetries) {
          this.stopPolling();
          console.log(`Polling failed after ${maxRetries} retries: ${error.message}`);
          this.eventSubject.error(new Error(`Polling failed after ${maxRetries} retries: ${error.message}`));
          // throw new Error(`Polling failed after ${maxRetries} retries: ${error.message}`);
        }
        if (Date.now() - lastResponseTime > 10000) { // 10s silence
          this.addLogMessage(this.log, 'No response from device for 10s, restarting polling...');
          this.stopPolling();
          this.startPolling();
        }
      }
    }, 300);
  }
  private readonly responseMap: { [key: number]: { name: string; description: string } } = {
    // Status Codes (240-250)
    240: { name: "OK", description: "Returned when a command from the host is understood and has been, or is in the process of, being executed." },
    241: { name: "SLAVE_RESET", description: "The device has undergone a power reset." },
    242: { name: "COMMAND_NOT_KNOWN", description: "Returned when an invalid command is received by a peripheral." },
    243: { name: "WRONG_NO_PARAMETERS", description: "A command was received by a peripheral, but an incorrect number of parameters were received." },
    244: { name: "PARAMETER_OUT_OF_RANGE", description: "One of the parameters sent with a command is out of range." },
    245: { name: "COMMAND_CANNOT_BE_PROCESSED", description: "A command sent could not be processed at that time. E.g. sending a dispense command before the last dispense operation has completed." },
    246: { name: "SOFTWARE_ERROR", description: "Reported for errors in the execution of software e.g. Divide by zero. This may also be reported if there is a problem resulting from a failed remote firmware upgrade." },
    248: { name: "FAIL", description: "Command failure" },
    250: { name: "KEY_NOT_SET", description: "The slave is in encrypted communication mode but the encryption keys have not been negotiated." },

    // Event Codes (176-239)
    176: { name: "JAM_RECOVERY", description: "The SMART Payout unit is in the process of recovering from a detected jam." },
    177: { name: "ERROR_DURING_PAYOUT", description: "Returned if an error is detected whilst moving a note inside the SMART Payout unit." },
    179: { name: "SMART_EMPTYING", description: "The device is in the process of carrying out its Smart Empty command from the host." },
    180: { name: "SMART_EMPTIED", description: "The device has completed its Smart Empty command." },
    181: { name: "CHANNEL_DISABLE", description: "The device has had all its note channels inhibited and has become disabled for note insertion." },
    182: { name: "INITIALISING", description: "Given when the BNV is powered up and setting its sensors and mechanisms to be ready for Note acceptance." },
    183: { name: "COIN_MECH_ERROR", description: "The attached coin mechanism has generated an error." },
    194: { name: "EMPTYING", description: "The device is in the process of emptying its content to the system cashbox in response to an Empty command." },
    195: { name: "EMPTIED", description: "The device has completed its Empty process in response to an Empty command from the host." },
    196: { name: "COIN_MECH_JAMMED", description: "The attached coin mechanism has been detected as having a jam." },
    197: { name: "COIN_MECH_RETURN_PRESSED", description: "The attached coin mechanism has been detected as having its reject or return button pressed." },
    198: { name: "PAYOUT_OUT_OF_SERVICE", description: "This event is given if the payout goes out of service during operation." },
    199: { name: "NOTE_FLOAT_REMOVED", description: "Reported when a note float unit has been detected as removed from its validator." },
    200: { name: "NOTE_FLOAT_ATTACHED", description: "Reported when a note float unit has been detected as attached to its validator." },
    201: { name: "NOTE_TRANSFERED_TO_STACKER", description: "Reported when a note has been successfully moved from the payout store into the stacker cashbox." },
    202: { name: "NOTE_PAID_INTO_STACKER_AT_POWER-UP", description: "Reported when a note has been detected as paid into the cashbox stacker as part of the power-up procedure." },
    203: { name: "NOTE_PAID_INTO_STORE_AT_POWER-UP", description: "Reported when a note has been detected as paid into the payout store as part of the power-up procedure." },
    204: { name: "NOTE_STACKING", description: "The note is being moved from the escrow position to the host exit section of the device." },
    205: { name: "NOTE_DISPENSED_AT_POWER-UP", description: "Reported when a note has been dispensed as part of the power-up procedure." },
    206: { name: "NOTE_HELD_IN_BEZEL", description: "Reported when a dispensing note is held in the bezel of the payout device." },
    207: { name: "DEVICE_FULL", description: "This event is reported when the Note Float has reached its limit of stored notes." },
    209: { name: "BAR_CODE_TICKET_ACKNOWLEDGE", description: "The bar code ticket has been passed to a safe point in the device stacker." },
    210: { name: "DISPENSED", description: "The device has completed its pay-out request." },
    213: { name: "JAMMED", description: "The device has detected that coins are jammed in its mechanism and cannot be removed other than by manual intervention." },
    214: { name: "HALTED", description: "This event is given when the host has requested a halt to the device." },
    215: { name: "FLOATING", description: "The device is in the process of executing a float command." },
    216: { name: "FLOATED", description: "The device has completed its float command." },
    217: { name: "TIME_OUT", description: "The device has been unable to complete a request." },
    218: { name: "DISPENSING", description: "The device is in the process of paying out a requested value." },
    219: { name: "NOTE_STORED_IN_PAYOUT", description: "The note has been passed into the note store of the payout unit." },
    220: { name: "INCOMPLETE_PAYOUT", description: "The device has detected a discrepancy on power-up that the last payout request was interrupted." },
    221: { name: "INCOMPLETE_FLOAT", description: "The device has detected a discrepancy on power-up that the last float request was interrupted." },
    222: { name: "CASHBOX_PAID", description: "Shows the value of stored coins that were routed to the cashbox during the payout cycle." },
    223: { name: "COIN_CREDIT", description: "A coin has been detected as added to the system via the attached coin mechanism." },
    224: { name: "NOTE_PATH_OPEN", description: "The device has detected that its note transport path has been opened." },
    225: { name: "NOTE_CLEARED_FROM_FRONT", description: "At power-up, a note was detected as being rejected out of the front of the device." },
    226: { name: "NOTE_CLEARED_TO_CASHBOX", description: "At power up, a note was detected as being moved into the stacker unit or host exit of the device." },
    227: { name: "CASHBOX_REMOVED", description: "A device with a detectable cashbox has detected that it has been removed." },
    228: { name: "CASHBOX_REPLACED", description: "A device with a detectable cashbox has detected that it has been replaced." },
    229: { name: "BAR_CODE_TICKET_VALIDATED", description: "A validated barcode ticket has been scanned and is available at the escrow point of the device." },
    230: { name: "FRAUD_ATTEMPT", description: "The device has detected an attempt to tamper with the normal validation/stacking/payout process." },
    231: { name: "STACKER_FULL", description: "The banknote stacker unit attached to this device has been detected as at its full limit." },
    232: { name: "DISABLED", description: "The device is not active and unavailable for normal validation functions." },
    233: { name: "UNSAFE_NOTE_JAM", description: "The note is stuck in a position where the user could possibly remove it from the front of the device." },
    234: { name: "SAFE_NOTE_JAM", description: "The note is stuck in a position not retrievable from the front of the device (user side)." },
    235: { name: "NOTE_STACKED", description: "The note has exited the device on the host side or has been placed within its note stacker." },
    236: { name: "NOTE_REJECTED", description: "The note has been rejected from the validator and is available for the user to retrieve." },
    237: { name: "NOTE_REJECTING", description: "The note is in the process of being rejected from the validator." },
    238: { name: "CREDIT_NOTE", description: "A note has passed through the device, past the point of possible recovery and the host can safely issue its credit amount." },
    239: { name: "READ_NOTE", description: "A note is in the process of being scanned by the device (byte value 0) or a valid note has been scanned and is in escrow (byte value gives the channel number)." },
  };
  // Reject code map from your second document
  private readonly rejectCodeMap: { [key: number]: { name: string; description: string } } = {
    0: { name: "NOTE_ACCEPTED", description: "The banknote has been accepted. No reject has occurred." },
    1: { name: "LENGTH_FAIL", description: "A validation fail: The banknote has been read but its length registers over the max length parameter." },
    2: { name: "AVERAGE_FAIL", description: "Internal validation failure - banknote not recognised." },
    3: { name: "COASTLINE_FAIL", description: "Internal validation failure - banknote not recognised." },
    4: { name: "GRAPH_FAIL", description: "Internal validation failure - banknote not recognised." },
    5: { name: "BURIED_FAIL", description: "Internal validation failure - banknote not recognised." },
    6: { name: "CHANNEL_INHIBIT", description: "This banknote has been inhibited for acceptance in the dataset configuration." },
    7: { name: "SECOND_NOTE_DETECTED", description: "A second banknote was inserted into the validator while the first one was still being transported." },
    8: { name: "REJECT_BY_HOST", description: "The host system issued a Reject command when this banknote was held in escrow." },
    9: { name: "CROSS_CHANNEL_DETECTED", description: "This bank note was identified as existing in two or more separate channel definitions in the dataset." },
    10: { name: "REAR_SENSOR_ERROR", description: "An inconsistency in a position sensor detection was seen." },
    11: { name: "NOTE_TOO_LONG", description: "The banknote failed dataset length checks." },
    12: { name: "DISABLED_BY_HOST", description: "The bank note was validated on a channel that has been inhibited for acceptance by the host system." },
    13: { name: "SLOW_MECH", description: "The internal mechanism was detected as moving too slowly for correct validation." },
    14: { name: "STRIM_ATTEMPT", description: "The internal mechanism was detected as moving too slowly for correct validation." },
    15: { name: "FRAUD_CHANNEL", description: "Obsolete response." },
    16: { name: "NO_NOTES_DETECTED", description: "A banknote detection was initiated but no banknotes were seen at the validation section." },
    17: { name: "PEAK_DETECT_FAIL", description: "Internal validation fail. Banknote not recognised." },
    18: { name: "TWISTED_NOTE_REJECT", description: "Internal validation fail. Banknote not recognised." },
    19: { name: "ESCROW_TIME-OUT", description: "A banknote held in escrow was rejected due to the host not communicating within the timeout period." },
    20: { name: "BAR_CODE_SCAN_FAIL", description: "Internal validation fail. Banknote not recognised." },
    21: { name: "NO_CAM_ACTIVATE", description: "A banknote did not reach the internal note path for validation during transport." },
    22: { name: "SLOT_FAIL_1", description: "Internal validation fail. Banknote not recognised." },
    23: { name: "SLOT_FAIL_2", description: "Internal validation fail. Banknote not recognised." },
    24: { name: "LENS_OVERSAMPLE", description: "The banknote was transported faster than the system could sample the note." },
    25: { name: "WIDTH_DETECTION_FAIL", description: "The banknote failed a measurement test." },
    26: { name: "SHORT_NOTE_DETECT", description: "The banknote measured length fell outside of the validation parameter for minimum length." },
    27: { name: "PAYOUT_NOTE", description: "The reject code command was issued after a note was paid out using a note payout device." },
    28: { name: "DOUBLE_NOTE_DETECTED", description: "More than one banknote was detected as overlayed during note entry." },
    29: { name: "UNABLE_TO_STACK", description: "The bank was unable to reach its correct stacking position during transport." }
  };
}