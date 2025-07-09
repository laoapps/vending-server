import { Injectable } from '@angular/core';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, hexToUint8Array, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import { Subject } from 'rxjs';
import { Toast } from '@capacitor/toast';

// FOR RS485 only (Ionic Capacitor compatible)
@Injectable({
  providedIn: 'root'
})
export class ADH814Service implements ISerialService {
  machineId = '11111111';
  portName = '/dev/ttyS1';
  baudRate = 9600;
  log: IlogSerial = { data: '', limit: 50 };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;
  private adh814: ADH814Protocol | undefined;
  private totalValue = 0;
  machinestatus = { data: '' };
  private pollInterval?: NodeJS.Timeout;
  private statusSubject = new Subject<IResModel>();
  private currentInterval: number = 300;
  private readonly DEFAULT_TEMPERATURE = 7;
  private readonly COOLING_MODE = 0x01;
  private readonly MAX_RETRIES = 3;

  constructor(private serialService: SerialServiceService) { }

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
    Toast.show({ text: message });
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
    this.addLogMessage(this.log, 'ADH814Protocol initialized');
  }

  private async setupDevice(): Promise<void> {
    if (!this.adh814) {
      this.addLogMessage(this.log, 'ADH814Protocol not initialized');
    }


    try {


      // Verify device ID
      const idResponse = await this.adh814.requestID(0x01);
      this.addLogMessage(this.log, `Device ID response: ${JSON.stringify(idResponse)}`);

      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait before retry
      // Query row/column swap status
      // const swapResponse = await this.adh814.querySwap(0x01);
      // this.addLogMessage(this.log, `Query Swap response: ${JSON.stringify(swapResponse)}, `);

      // // Set row/column swap if not enabled
      // if (swapResponse.data) {
      //   if (swapResponse.data[0] !== 0x01) {
      //     const setSwapResponse = await this.adh814.setSwap(0x01);
      //     this.addLogMessage(this.log, `Set Swap response: ${JSON.stringify(setSwapResponse)}`);
      //   } else {
      //     this.addLogMessage(this.log, 'Row/column swap already enabled');
      //   }
      // }

      // await new Promise(resolve => setTimeout(resolve, 3000)); // Wait before retry


      // Switch to two-wire mode
      // const modeResponse = await this.adh814.switchToTwoWireMode(0x01);
      // this.addLogMessage(this.log, `Two-wire mode switch response (attempt 0): ${JSON.stringify(modeResponse)}`);

      return;
    } catch (err) {
      this.addLogMessage(this.log, `Setup attempt ${JSON.stringify(err)} failed: ${err?.message}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
    }

  }

  public async setDefaultTemperature(address: number = 0x01): Promise<void> {
    try {
      const response = await this.command(EMACHINE_COMMAND.SET_TEMP, {
        address,
        mode: this.COOLING_MODE,
        tempValue: this.DEFAULT_TEMPERATURE
      }, Date.now());
      this.addLogMessage(this.log, `Default temperature set to ${this.DEFAULT_TEMPERATURE}°C in cooling mode: ${JSON.stringify(response)}`);
    } catch (err) {
      this.addLogMessage(this.log, `Failed to set default temperature: ${err.message}`);
      throw err;
    }
  }

  public startPolling(address: number = 0x01, interval: number = 300): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.currentInterval = interval;
    this.pollInterval = setInterval(() => {
      if (!this.adh814) {
        this.addLogMessage(this.log, 'Polling skipped: ADH814Protocol not initialized');
        return;
      }
      const startTime = Date.now();
      this.adh814.pollStatus(address, (response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const executionResult = response.data[2] || 0;
        const dropSuccess = !(executionResult & 0x04);
        const faultCode = executionResult & 0x03;
        if (response === undefined || response?.data?.length < 9) {
          this.addLogMessage(this.log, 'Invalid response data length ' + JSON.stringify(response));
          return;
        }
        const result: IResModel = {
          command: EMACHINE_COMMAND.READ_EVENTS,
          data: {
            status: response.data[0],
            motorNumber: response.data[1] || 0,
            executionResult,
            dropSuccess,
            faultCode,
            maxCurrent: response.data[3] ? (response.data[3] << 8) | response.data[4] : 0,
            avgCurrent: response.data[5] ? (response.data[5] << 8) | response.data[6] : 0,
            runTime: response.data[7] || 0,
            temperature: response.data[8] || 0
          },
          status: 1,
          message: `Poll status retrieved (Response time: ${responseTime}ms, Drop: ${dropSuccess ? 'Success' : 'Failure'}, Fault: ${faultCode})`,
          transactionID: Date.now()
        };
        if (result.data.temperature === -40) {
          this.addLogMessage(this.log, 'Temperature sensor disconnected');
        } else if (result.data.temperature === 120) {
          this.addLogMessage(this.log, 'Temperature sensor shorted');
        }
        if (result.data.status === 0x02) {
          this.addLogMessage(this.log, `Delivery ended for motor ${result.data.motorNumber}: Drop ${dropSuccess ? 'successful' : 'failed'}${faultCode ? `, Fault code: ${faultCode}` : ''}`);
        }
        this.statusSubject.next(result);
        this.addLogMessage(this.log, `Response time: ${responseTime}ms for interval ${this.currentInterval}ms`);
        if (result.data.status === 0x02) {
          this.adh814.acknowledgeResult(address, () => {
            this.addLogMessage(this.log, 'Automatic ACK sent for delivery end');
          }).catch(err => {
            this.addLogMessage(this.log, `ACK failed: ${err.message}`);
          });
        }
      }).catch(err => {
        this.addLogMessage(this.log, `Polling error: ${err.message}`);
      });
    }, interval);
  }



  initializeSerialPort(
    portName: string,
    baudRate: number,
    log: IlogSerial,
    machineId: string,
    otp: string,
    isNative: ESerialPortType,
    pollInterval: number = 100
  ): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      this.machineId = machineId;
      this.otp = otp;
      this.portName = portName || this.portName;
      this.baudRate = baudRate || this.baudRate;
      this.log = log;

      try {
        // Ensure previous instance is cleaned up
        if (this.adh814) {
          this.addLogMessage(this.log, 'Disposing existing ADH814Protocol');
          this.adh814.dispose();
          this.adh814 = undefined;
        }

        // Initialize serial port
        const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
        if (init !== this.portName) {
          throw new Error(`Serial port initialization failed: Expected ${this.portName}, got ${init}`);
        }

        this.addLogMessage(this.log, 'Starting serial reading');
        await this.serialService.startReading();

        // Initialize ADH814Protocol
        this.initADH814();
        this.addLogMessage(this.log, 'ADH814Protocol initialized');

        // Perform setup
        await this.setupDevice();

        console.log('Device setup completed');
        this.addLogMessage(this.log, 'Device setup completed successfully');
        this.startPolling(0x01, pollInterval);
        console.log('Polling started');
        this.addLogMessage(this.log, `Polling started with interval ${pollInterval}ms`);

        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.setDefaultTemperature();
        this.addLogMessage(this.log, `Serial port ${init} initialized successfully`);
        resolve(init);
      } catch (err) {
        this.addLogMessage(this.log, `Initialization failed: ${err.message}`);
        reject(err);
      }
    });
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      if (!this.adh814) {
        const error = new Error('Serial port not initialized');
        this.addLogMessage(this.log, error.message);
        reject(error);
        return;
      }

      let { slot = 1, mode = 0x00, lowTemp = 8, address = 0x01 } = params || {};
      if (slot > 0) {
        slot = parseInt((slot - 1).toString(16), 16);
      } else {
        slot = 0x00;
      }
      const onError = (error: Error) => {
        this.addLogMessage(this.log, `Command failed: ${error.message}`);
        reject(new Error(`Command failed: ${error.message}`));
      };

      const onResponse = (response: IADH814) => {
        this.addLogMessage(this.log, `Response: ${JSON.stringify(response)}`);
        let status = 1;
        let message = `Command 0x${response.command.toString(16).padStart(2, '0')} executed`;
        if (response.command === 0xA5 && response.data[0] !== 0) {
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
        case EMACHINE_COMMAND.SET_SWAP:
          const swapResponse = await this.adh814.querySwap(0x01);
          this.addLogMessage(this.log, `Query Swap response: ${JSON.stringify(swapResponse)}, `);

          // Set row/column swap if not enabled
          if (swapResponse.data) {
            if (swapResponse.data[0] !== 0x01) {
              const setSwapResponse = await this.adh814.setSwap(0x01);
              this.addLogMessage(this.log, `Set Swap response: ${JSON.stringify(setSwapResponse)}`);
            } else {
              this.addLogMessage(this.log, 'Row/column swap already enabled');
            }
          }
          break;
        case EMACHINE_COMMAND.SET_TWO_WIRE_MODE:
          const modeResponse = await this.adh814.switchToTwoWireMode(0x01);
          this.addLogMessage(this.log, `Two-wire mode switch response (attempt 0): ${JSON.stringify(modeResponse)}`);
          break;
        case EMACHINE_COMMAND.SET_TEMP:
          if (![0x00, 0x01, 0x02].includes(mode)) {
            reject(new Error('Mode must be 0x00-0x02'));
            return;
          }
          if (lowTemp < -127 || lowTemp > 127) {
            reject(new Error('Temp value must be -127 to 127'));
            return;
          }
          this.adh814.setTemperature(address, mode, lowTemp, onResponse).catch(onError);
          break;
        case EMACHINE_COMMAND.START_MOTOR:
          if (slot < 0x00 || slot > 0x3C) {
            reject(new Error('Motor number must be 0x00-0x3C'));
            return;
          }
          this.adh814.pollStatus(address, (statusResponse) => {
            if (statusResponse.data[0] === 0x02) {
              this.adh814.acknowledgeResult(address, () => {
                this.adh814.startMotor(address, slot, onResponse).catch(onError);
              }).catch(onError);
            } else if (statusResponse.data[0] === 0x00) {
              this.adh814.startMotor(address, slot, onResponse).catch(onError);
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
            const executionResult = response.data[2] || 0;
            const dropSuccess = !(executionResult & 0x04);
            const faultCode = executionResult & 0x03;
            const result: IResModel = {
              command,
              data: {
                status: response.data[0],
                motorNumber: response.data[1] || 0,
                executionResult,
                dropSuccess,
                faultCode,
                maxCurrent: response.data[3] ? (response.data[3] << 8) | response.data[4] : 0,
                avgCurrent: response.data[5] ? (response.data[5] << 8) | response.data[6] : 0,
                runTime: response.data[7] || 0,
                temperature: response.data[8] || 0
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
    return this.statusSubject.asObservable();
  }

  close(): Promise<void> {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.adh814) this.adh814.dispose();
    this.statusSubject.complete();
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
  }

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
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i += 2) {
    const byte = parseInt(data.substring(i, i + 2), 16);
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  const crcHex = crc.toString(16).padStart(4, '0');
  return crcHex.substring(2) + crcHex.substring(0, 2);
}

// Utility to convert hex string array to Uint8Array
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

  async switchToTwoWireMode(address: number): Promise<IADH814> {
    return new Promise((resolve, reject) => {
      const command = 0x21;
      const data = [0x10, 0x00];
      const request = this.createRequest(address, command, data);
      this.sendRequest(request, resolve).catch(reject);
    });
  }

  private async sendRequest(request: Uint8Array, onResponse: (response: IADH814) => void): Promise<void> {
    const command = request[1];
    this.responseListeners.set(command, onResponse);
    const hexRequest = toHexString(request);
    const timeout = setTimeout(() => {
      this.responseListeners.delete(command);
      onResponse({ error: new Error('Response timeout') } as any);
    }, 2000);
    await this.port.send(hexRequest);
    this.responseListeners.set(command, (response) => {
      clearTimeout(timeout);
      onResponse(response);
    });
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
    if (motorNumber < 0x00 || motorNumber > 0x3C) throw new Error('Motor number must be 0x00-0x3C');
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

  async querySwap(address: number): Promise<IADH814> {
    return new Promise((resolve, reject) => {
      const request = this.createRequest(address, 0x34, []);
      this.sendRequest(request, resolve).catch(reject);
    });
  }

  async setSwap(address: number): Promise<IADH814> {
    return new Promise((resolve, reject) => {
      const request = this.createRequest(address, 0x35, [0x01]);
      this.sendRequest(request, resolve).catch(reject);
    });
  }

  dispose() {
    this.responseListeners.clear();
  }

  private createRequest(address: number, command: number, data: number[]): Uint8Array {
    if (address < 0x01 || address > 0x04) throw new Error('Address must be 0x01-0x04');
    const payload = [address, command, ...data];
    const hexPayload = payload.map(byte => byte.toString(16).padStart(2, '0').toUpperCase());
    const crc = checkSumCRC(hexPayload);
    const crcBytes = [
      parseInt(crc.substring(0, 2), 16),
      parseInt(crc.substring(2, 4), 16)
    ];
    return new Uint8Array([...payload, ...crcBytes]);
  }

  private parseResponse(buffer: Uint8Array): IADH814 {
    if (buffer.length < 4) throw new Error(`Invalid response length: ${buffer.length}`);
    const address = buffer[0];
    const command = buffer[1];
    const data = Array.from(buffer.slice(2, buffer.length - 2));
    const receivedCRC = (buffer[buffer.length - 1] << 8) | buffer[buffer.length - 2];
    const hexData = Array.from(buffer.slice(0, buffer.length - 2))
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase());
    const calculatedCRC = parseInt(checkSumCRC(hexData), 16);
    if (receivedCRC !== calculatedCRC) {
      console.warn(`CRC mismatch: received 0x${receivedCRC.toString(16).padStart(4, '0')}, calculated 0x${calculatedCRC.toString(16).padStart(4, '0')}`);
      throw new Error('CRC validation failed');
    }
    if (command === 0x34 || command === 0x35 || command === 0x21) {
      if (address !== 0x01) {
        throw new Error(`Invalid address for command 0x${command.toString(16)}: expected 0x01, got 0x${address.toString(16)}`);
      }
    } else if (address !== 0x00) {
      throw new Error(`Invalid address for command 0x${command.toString(16)}: expected 0x00, got 0x${address.toString(16)}`);
    }
    if (![0xA1, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0x34, 0x35, 0x21].includes(command)) {
      throw new Error(`Invalid command: got 0x${command.toString(16)}`);
    }
    return { address, command, data, crc: receivedCRC };
  }
}