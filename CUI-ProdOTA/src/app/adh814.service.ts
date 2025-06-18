import { Injectable } from '@angular/core';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, hexToUint8Array, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';

// FOR RS485 only
@Injectable({
  providedIn: 'root'
})
export class ADH814Service implements ISerialService {
  machineId = '11111111';
  portName = '/dev/ttyS1';
  baudRate = 9600; // Default baud rate, supports 9600 or 38400
  log: IlogSerial = { data: '', limit: 50 };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;
  private adh814: ADH814Protocol;
  private totalValue = 0; // Optional: track value if needed for future extensions
  machinestatus = { data: '' };

  constructor(private serialService: SerialServiceService) { }

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }

  private initADH814(): void {
    const portAdapter: CommunicationPort = {
      send: async (data: string) => {
        await this.serialService.write(data);
        this.addLogMessage(this.log, `Sent: ${data}`);
      },
      on: (event: 'data', listener: (data: Uint8Array) => void) => {
        this.serialService.getSerialEvents().subscribe((serialEvent) => {
          if (serialEvent.event === 'dataReceived') {
            const buffer = new Uint8Array(hexToUint8Array(serialEvent.data));
            listener(buffer);
          }
        });
      },
      off: () => {
        // No-op; Angular subscriptions handle cleanup
      }
    };

    this.adh814 = new ADH814Protocol(portAdapter);

    // Log raw data for debugging
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = event.data;
        this.addLogMessage(this.log, `Raw data: ${hexData}`);
      } else if (event.event === 'serialOpened') {
        this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
        this.setupDevice().catch(err => {
          this.addLogMessage(this.log, `Setup failed: ${err.message}`);
        });
      }
    });
  }

  private async setupDevice(): Promise<void> {
    try {
      const idResponse = await this.adh814.requestID(0x01); // Default to address 1
      this.addLogMessage(this.log, `Device ID response: ${JSON.stringify(idResponse)}`);
      this.addLogMessage(this.log, 'ADH814 setup complete');
      return Promise.resolve();
    } catch (err) {
      this.addLogMessage(this.log, `Setup error: ${err.message}`);
      return Promise.reject(err);
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

      if (this.adh814) this.adh814.dispose();

      const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      this.serialService.startReading();

      if (init === this.portName) {
        this.initADH814();
        resolve(init);
      } else {
        reject(init);
      }
    });
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>((resolve, reject) => {
      if (!this.adh814) {
        reject(new Error('Serial port not initialized'));
        return;
      }

      const onResponse = (response: IADH814) => {
        const result: IResModel = {
          command,
          data: { response },
          status: response.data.length > 0 && response.data[0] === 0 ? 1 : 0, // 0 typically indicates success
          message: `Command 0x${response.command.toString(16).padStart(2, '0')} executed`,
          transactionID
        };
        resolve(result);
      };

      const { motorNumber = 0x00, mode = 0x00, tempValue = 0x0008, address = 0x01 } = params || {};
      const onError = (error: Error) => {
        reject(new Error(`Command failed: ${error.message}`));
      };

      switch (command) {
        case EMACHINE_COMMAND.SET_TEMP:
          
          this.adh814.setTemperature(address, mode, tempValue, onResponse).catch(onError);
          break;
        case EMACHINE_COMMAND.START_MOTOR:

          this.adh814.startMotor(address, motorNumber, onResponse).catch(onError);
          break;
        case EMACHINE_COMMAND.CLEAR_RESULT:

          this.adh814.acknowledgeResult(address, onResponse).catch(onError);
          break;
        case EMACHINE_COMMAND.RESET:
          this.totalValue = 0;
          resolve(PrintSucceeded(command, {}, 'reset'));
          break;
        case EMACHINE_COMMAND.READ_EVENTS:
          this.adh814.pollStatus(0x01, (response) => {
            const result: IResModel = {
              command,
              data: {
                status: response.data[0],
                motorNumber: response.data[1],
                executionResult: response.data[2],
                maxCurrent: (response.data[3] << 8) | response.data[4],
                avgCurrent: (response.data[5] << 8) | response.data[6],
                runTime: response.data[7],
                temperature: response.data[8]
              },
              status: 1,
              message: 'Poll status retrieved',
              transactionID
            };
            resolve(result);
          }).catch(onError);
          break;
        case EMACHINE_COMMAND.SCAN_DOOR:
          this.adh814.scanDoorFeedback(0x01, onResponse).catch(onError);
          break;
        case EMACHINE_COMMAND.START_MOTOR_MERGED:
          const { motorNumber1 = 0x00, motorNumber2 = 0x00, address: mergedAddress = 0x01 } = params || {};
          this.adh814.startMotorMerged(mergedAddress, motorNumber1, motorNumber2, onResponse).catch(onError);
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
    if (this.adh814) this.adh814.dispose();
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
  }
}

// Interface for ADH814 protocol message (reusing IADH815 for compatibility)
interface IADH814 {
  address: number;
  command: number;
  data: number[];
  crc: number;
}

// Utility to calculate CRC-16 (IBM polynomial: 0xA001)
function calculateCRC16(data: number[]): number {
  let crc = 0xFFFF;
  const polynomial = 0xA001;

  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      const lsb = crc & 0x0001;
      crc >>= 1;
      if (lsb) crc ^= polynomial;
    }
  }
  return ((crc >> 8) & 0xFF) | ((crc << 8) & 0xFF00); // Byte swap
}

// Utility to convert Uint8Array to hex string
function toHexString(data: Uint8Array): string {
  return Array.from(data)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// CommunicationPort interface
interface CommunicationPort {
  send(data: string): Promise<void>;
  on(event: 'data', listener: (data: Uint8Array) => void): void;
  off(event: 'data', listener: (data: Uint8Array) => void): void;
}

class ADH814Protocol {
  private port: CommunicationPort;
  private responseListeners: Map<number, (response: IADH814) => void>;

  constructor(port: CommunicationPort) {
    this.port = port;
    this.responseListeners = new Map();
    this.setupListener();
  }

  private setupListener() {
    this.port.on('data', (data: Uint8Array) => {
      try {
        const response = this.parseResponse(data);
        const command = response.command;
        const listener = this.responseListeners.get(command);
        if (listener) {
          listener(response);
          this.responseListeners.delete(command);
        } else {
          console.warn(`No listener for command: 0x${command.toString(16)}`);
        }
      } catch (error) {
        console.log('ADH814 Error parsing response:', error);
      }
    });
  }

  private async sendRequest(request: Uint8Array, onResponse: (response: IADH814) => void): Promise<void> {
    const command = request[1];
    this.responseListeners.set(command, onResponse);
    const hexRequest = toHexString(request);
    return this.port.send(hexRequest);
  }

  async requestID(address: number): Promise<IADH814> {
    return new Promise((resolve, reject) => {
      const request = this.createRequest(address, 0xA1, []);
      this.sendRequest(request, resolve).catch(reject);
    });
  }

  async scanDoorFeedback(address: number, onResponse: (response: IADH814) => void): Promise<void> {
    const request = this.createRequest(address, 0xA2, []);
    return this.sendRequest(request, onResponse);
  }

  async pollStatus(address: number, onResponse: (response: IADH814) => void): Promise<void> {
    const request = this.createRequest(address, 0xA3, []);
    return this.sendRequest(request, onResponse);
  }

  async setTemperature(
    address: number,
    mode: number,
    tempValue: number,
    onResponse: (response: IADH814) => void
  ): Promise<void> {
    if (![0x00, 0x01, 0x02].includes(mode)) throw new Error('Mode must be 0x00-0x02');
    if (tempValue < -127 || tempValue > 127) throw new Error('Temp value must be -127 to 127');
    const data = [mode, (tempValue >> 8) & 0xFF, tempValue & 0xFF];
    const request = this.createRequest(address, 0xA4, data);
    return this.sendRequest(request, onResponse);
  }

  async startMotor(
    address: number,
    motorNumber: number,
    onResponse: (response: IADH814) => void
  ): Promise<void> {
    if (motorNumber < 0x00 || motorNumber > 0x8C) throw new Error('Motor number must be 0x00-0x8C');
    const data = [motorNumber];
    const request = this.createRequest(address, 0xA5, data);
    return this.sendRequest(request, onResponse);
  }

  async acknowledgeResult(
    address: number,
    onResponse: (response: IADH814) => void
  ): Promise<void> {
    const request = this.createRequest(address, 0xA6, []);
    return this.sendRequest(request, onResponse);
  }

  async startMotorMerged(
    address: number,
    motorNumber1: number,
    motorNumber2: number,
    onResponse: (response: IADH814) => void
  ): Promise<void> {
    if (motorNumber1 < 0x00 || motorNumber1 > 0x8C || motorNumber2 < 0x00 || motorNumber2 > 0x8C) {
      throw new Error('Motor numbers must be 0x00-0x8C');
    }
    const data = [motorNumber1, motorNumber2];
    const request = this.createRequest(address, 0xB5, data);
    return this.sendRequest(request, onResponse);
  }

  dispose() {
    this.responseListeners.clear();
  }

  private createRequest(address: number, command: number, data: number[]): Uint8Array {
    if (address < 0x01 || address > 0x04) throw new Error('Address must be 0x01-0x04');
    const payload = [address, command, ...data];
    const crc = calculateCRC16(payload);
    return new Uint8Array([...payload, crc & 0xFF, (crc >> 8) & 0xFF]);
  }

  private parseResponse(buffer: Uint8Array): IADH814 {
    if (buffer.length < 4) throw new Error(`Invalid response length: ${buffer.length}`);
    const address = buffer[0];
    const command = buffer[1];
    const data = Array.from(buffer.slice(2, buffer.length - 2));
    const receivedCRC = (buffer[buffer.length - 1] << 8) | buffer[buffer.length - 2];
    const calculatedCRC = calculateCRC16(Array.from(buffer.slice(0, buffer.length - 2)));
    if (receivedCRC !== calculatedCRC) {
      console.warn(`CRC mismatch: received 0x${receivedCRC.toString(16)}, calculated 0x${calculatedCRC.toString(16)}`);
      throw new Error('CRC validation failed');
    }
    return { address, command, data, crc: receivedCRC };
  }
}