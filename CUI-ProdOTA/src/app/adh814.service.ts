import { Injectable } from '@angular/core';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, hexToUint8Array, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import { Subject } from 'rxjs';

// FOR RS485 only (Ionic Capacitor compatible)
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
  private pollInterval?: NodeJS.Timeout; // To manage the software-initiated polling interval
  private statusSubject = new Subject<IResModel>(); // For real-time status updates
  private currentInterval: number = 1000; // Current polling interval in ms

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

    // Log raw data and response times for debugging
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = event.data;
        const time = new Date().toISOString();
        this.addLogMessage(this.log, `Raw data: ${hexData} at ${time}`);
      } else if (event.event === 'serialOpened') {
        this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
      }
    });
  }

  private async setupDevice(): Promise<void> {
    try {
      const idResponse = await this.adh814.requestID(0x01); // Default to address 1
      this.addLogMessage(this.log, `Device ID response: ${JSON.stringify(idResponse)}`);
      return Promise.resolve();
    } catch (err) {
      this.addLogMessage(this.log, `Setup error: ${err.message}`);
      return Promise.reject(err);
    }
  }

  private startPolling(address: number, interval: number = 1000): void {
    if (this.pollInterval) clearInterval(this.pollInterval); // Clear existing interval if any
    this.currentInterval = interval; // Update current interval
    this.pollInterval = setInterval(() => {
      const startTime = Date.now();
      // Software-initiated polling (ping) for ADH814E_PLUS status
      this.adh814.pollStatus(address, (response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const result: IResModel = {
          command: EMACHINE_COMMAND.READ_EVENTS,
          data: {
            status: response.data[0], // 0=Idle, 1=Delivering, 2=Delivery End
            motorNumber: response.data[1],
            executionResult: response.data[2], // Bit0-1: Fault, Bit2: Drop Success/Failure
            maxCurrent: (response.data[3] << 8) | response.data[4], // mA, high byte first
            avgCurrent: (response.data[5] << 8) | response.data[6], // mA, high byte first
            runTime: response.data[7], // 0-255, unit 0.1s
            temperature: response.data[8] // -127 to 127, unit °C
          },
          status: 1,
          message: `Software-initiated poll status retrieved (Response time: ${responseTime}ms)`,
          transactionID: Date.now() // Use timestamp as transaction ID
        };
        this.statusSubject.next(result); // Emit status update
        this.addLogMessage(this.log, `Response time: ${responseTime}ms for interval ${this.currentInterval}ms`);
        if (response.data[0] === 0x02) { // Delivery End state
          this.adh814.acknowledgeResult(address, () => {
            this.addLogMessage(this.log, 'Automatic ACK sent for delivery end');
          }).catch(err => {
            this.addLogMessage(this.log, `ACK failed: ${err.message}`);
          });
        }
      }).catch(err => {
        this.addLogMessage(this.log, `Polling error: ${err.message}`);
      });
    }, interval); // Use provided interval
  }

  // Method to adjust polling interval dynamically
  setPollingInterval(interval: number): void {
    if (interval < 100) {
      this.addLogMessage(this.log, 'Interval too low, setting to minimum 100ms');
      interval = 100;
    }
    this.currentInterval = interval;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.startPolling(0x01, this.currentInterval); // Restart with new interval
      this.addLogMessage(this.log, `Polling interval updated to ${interval}ms`);
    }
  }

  initializeSerialPort(
    portName: string,
    baudRate: number,
    log: IlogSerial,
    machineId: string,
    otp: string,
    isNative: ESerialPortType,
    pollInterval: number = 1000 // Configurable polling interval in ms, default to 1000ms
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
        await this.setupDevice().then(() => {
          this.startPolling(0x01, pollInterval); // Start software-initiated polling (ping)
        }).catch(err => {
          this.addLogMessage(this.log, `Setup failed during polling start: ${err.message}`);
          reject(err);
        });
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

      const { motorNumber = 0x00, mode = 0x00, tempValue = 8, address = 0x01 } = params || {};
      const onError = (error: Error) => {
        reject(new Error(`Command failed: ${error.message}`));
      };

      const onResponse = (response: IADH814) => {
        this.addLogMessage(this.log, `Response: ${JSON.stringify(response)}`);
        let status = 1;
        let message = `Command 0x${response.command.toString(16).padStart(2, '0')} executed`;
        if ([0xA5, 0xB5].includes(response.command) && response.data[0] !== 0) {
          status = 0;
          message += `: Error code ${response.data[0]}`;
        }
        const result: IResModel = {
          command,
          data: { response },
          status,
          message,
          transactionID
        };
        resolve(result);
      };

      switch (command) {
        case EMACHINE_COMMAND.SET_TEMP:
          if (![0x00, 0x01, 0x02].includes(mode)) {
            reject(new Error('Mode must be 0x00-0x02'));
            return;
          }
          if (tempValue < -127 || tempValue > 127) {
            reject(new Error('Temp value must be -127 to 127'));
            return;
          }
          this.adh814.setTemperature(address, mode, tempValue, onResponse).catch(onError);
          break;
        case EMACHINE_COMMAND.START_MOTOR:
          if (motorNumber < 0x00 || motorNumber > 0x8C) {
            reject(new Error('Motor number must be 0x00-0x8C'));
            return;
          }
          this.adh814.pollStatus(address, (statusResponse) => {
            if (statusResponse.data[0] === 0x02) {
              this.adh814.acknowledgeResult(address, () => {
                this.adh814.startMotor(address, motorNumber, onResponse).catch(onError);
              }).catch(onError);
            } else if (statusResponse.data[0] === 0x00) {
              this.adh814.startMotor(address, motorNumber, onResponse).catch(onError);
            } else {
              reject(new Error('Board is busy (state: ' + statusResponse.data[0] + ')'));
            }
          }).catch(onError);
          break;
        case EMACHINE_COMMAND.CLEAR_RESULT:
          this.adh814.acknowledgeResult(address, onResponse).catch(onError);
          break;
        case EMACHINE_COMMAND.RESET:
          this.totalValue = 0;
          resolve(PrintSucceeded(command, {}, 'reset'));
          break;
        case EMACHINE_COMMAND.READ_EVENTS:
          const { address: pollAddress = 0x01 } = params || {};
          this.adh814.pollStatus(pollAddress, (response) => {
            const result: IResModel = {
              command,
              data: {
                status: response.data[0], // 0=Idle, 1=Delivering, 2=Delivery End
                motorNumber: response.data[1],
                executionResult: response.data[2], // Bit0-1: Fault, Bit2: Drop Success/Failure
                maxCurrent: (response.data[3] << 8) | response.data[4], // mA, high byte first
                avgCurrent: (response.data[5] << 8) | response.data[6], // mA, high byte first
                runTime: response.data[7], // 0-255, unit 0.1s
                temperature: response.data[8] // -127 to 127, unit °C
              },
              status: 1,
              message: 'Poll status retrieved',
              transactionID
            };
            resolve(result);
          }).catch(onError);
          break;
        case EMACHINE_COMMAND.SCAN_DOOR:
          const { address: scanAddress = 0x01 } = params || {};
          this.adh814.scanDoorFeedback(scanAddress, onResponse).catch(onError);
          break;
        case EMACHINE_COMMAND.START_MOTOR_MERGED:
          const { motorNumber1 = 0x00, motorNumber2 = 0x00, address: mergedAddress = 0x01 } = params || {};
          if (motorNumber1 < 0x00 || motorNumber1 > 0x8C || motorNumber2 < 0x00 || motorNumber2 > 0x8C) {
            reject(new Error('Motor numbers must be 0x00-0x8C'));
            return;
          }
          this.adh814.pollStatus(mergedAddress, (statusResponse) => {
            if (statusResponse.data[0] === 0x02) {
              this.adh814.acknowledgeResult(mergedAddress, () => {
                this.adh814.startMotorMerged(mergedAddress, motorNumber1, motorNumber2, onResponse).catch(onError);
              }).catch(onError);
            } else if (statusResponse.data[0] === 0x00) {
              this.adh814.startMotorMerged(mergedAddress, motorNumber1, motorNumber2, onResponse).catch(onError);
            } else {
              reject(new Error('Board is busy (state: ' + statusResponse.data[0] + ')'));
            }
          }).catch(onError);
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

  getStatusUpdates() {
    return this.statusSubject.asObservable(); // Provide observable for software-initiated status updates
  }

  close(): Promise<void> {
    if (this.pollInterval) clearInterval(this.pollInterval); // Stop software-initiated polling on close
    if (this.adh814) this.adh814.dispose();
    this.statusSubject.complete(); // Complete the subject to clean up subscribers
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
  }

  // Getter for current interval (for debugging or UI)
  getCurrentInterval(): number {
    return this.currentInterval;
  }
}

// Interface for ADH814E_PLUS protocol message
interface IADH814 {
  address: number;
  command: number;
  data: number[];
  crc: number;
}

// Custom Modbus CRC-16 function
function checkSumCRC(d: string[]): string {
  const data = d.join('');
  let crc = 0xFFFF; // Initial CRC value
  for (let i = 0; i < data.length; i += 2) {
    const byte = parseInt(data.substring(i, i + 2), 16); // Convert hex string to byte
    crc ^= byte; // XOR with the current byte
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) { // Check if the least significant bit is set
        crc = (crc >> 1) ^ 0xA001; // Shift right and XOR with polynomial
      } else {
        crc >>= 1; // Just shift right
      }
    }
  }
  // Convert the CRC to a 4-character hexadecimal string
  const crcHex = crc.toString(16).padStart(4, '0');
  // Swap the bytes (little-endian to big-endian)
  return crcHex.substring(2) + crcHex.substring(0, 2);
}

// Utility to convert hex string array to Uint8Array for CRC calculation
function hexArrayToUint8Array(hexArray: string[]): Uint8Array {
  return new Uint8Array(hexArray.map(hex => parseInt(hex, 16)));
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
        console.log('ADH814E_PLUS Error parsing response:', error);
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
    // Convert number array to hex string array for CRC calculation
    const hexPayload = payload.map(byte => byte.toString(16).padStart(2, '0').toUpperCase());
    const crc = checkSumCRC(hexPayload); // Get CRC as "HHLL" string (e.g., "4059")
    const crcBytes = [
      parseInt(crc.substring(0, 2), 16), // Low byte
      parseInt(crc.substring(2, 4), 16)  // High byte
    ];
    return new Uint8Array([...payload, ...crcBytes]);
  }

  private parseResponse(buffer: Uint8Array): IADH814 {
    if (buffer.length < 4) throw new Error(`Invalid response length: ${buffer.length}`);
    const address = buffer[0];
    const command = buffer[1];
    const data = Array.from(buffer.slice(2, buffer.length - 2));
    const receivedCRC = (buffer[buffer.length - 1] << 8) | buffer[buffer.length - 2]; // High byte first for comparison
    // Convert buffer to hex string array for CRC calculation (exclude CRC bytes)
    const hexData = Array.from(buffer.slice(0, buffer.length - 2))
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase());
    const calculatedCRC = parseInt(checkSumCRC(hexData), 16); // Convert "HHLL" to number
    if (receivedCRC !== calculatedCRC) {
      console.warn(`CRC mismatch: received 0x${receivedCRC.toString(16).padStart(4, '0')}, calculated 0x${calculatedCRC.toString(16).padStart(4, '0')}`);
      throw new Error('CRC validation failed');
    }
    return { address, command, data, crc: receivedCRC };
  }
}