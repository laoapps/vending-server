import { Injectable } from '@angular/core';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, ISerialService, IResModel } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import { Toast } from '@capacitor/toast';
import { DebugService } from './debug.service';

@Injectable({
  providedIn: 'root'
})
export class ADH814Service implements ISerialService {
  machineId = '11111111';
  portName = '/dev/ttyS1';
  baudRate = 9600;
  log: IlogSerial = { data: '', limit: 50 };
  otp = '111111';
  machinestatus = { data: '' };
  private pollInterval?: NodeJS.Timeout;
  private currentInterval: number = 100;
  private readonly DEFAULT_TEMPERATURE = 7;
  private readonly COOLING_MODE = 0x01;
  private pendingCommand: { command: EMACHINE_COMMAND, transactionID: number, resolve: (value: IResModel) => void, reject: (reason: any) => void } | null = null;

  constructor(private serialService: SerialServiceService, private debugService: DebugService) { }

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    Toast.show({ text: message, duration: 'long' });
    this.debugService.addDebugMessage(message);
    if (consoleMessage) {
      console.log(consoleMessage);
    }
  }

  private calculateCrc16(data: string[]): string {
    let crc = 0xFFFF;
    for (const hex of data) {
      const byte = parseInt(hex, 16);
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


  private processResponse(rawData: string): any {
    try {
      const hexData = rawData.replace(/\s/g, '').toLowerCase();
      if (hexData.length < 8) {
        this.addLogMessage(this.log, 'Invalid response: Too short');
        return null;
      }

      const address = parseInt(hexData.slice(0, 2), 16);
      const command = parseInt(hexData.slice(2, 4), 16);
      const crcReceived = hexData.slice(-4);
      const data = hexData.slice(4, -4).match(/.{2}/g) || [];

      const frameWithoutCrc = hexData.slice(0, -4);
      const calculatedCrc = this.calculateCrc16(frameWithoutCrc.match(/.{2}/g) || []);
      if (crcReceived !== calculatedCrc) {
        this.addLogMessage(this.log, `CRC mismatch: Expected ${calculatedCrc}, Received ${crcReceived}`);
        return null;
      }

      if (command !== 0x34 && command !== 0x35 && command !== 0x21 && address !== 0x00 && address !== 0x01) {
        this.addLogMessage(this.log, `Invalid address: Expected 0x00 or 0x01, got 0x${address.toString(16)}`);
        return null;
      }

      let result: any = { command, data: data.map(byte => parseInt(byte, 16)) };
      switch (command) {
        case 0xA1:
          if (data.length !== 16) {
            this.addLogMessage(this.log, `Invalid ID response: Expected 16 data bytes, got ${data.length}`);
            return null;
          }
          result = {
            command: EMACHINE_COMMAND.READ_ID,
            firmwareVersion: data.map(byte => String.fromCharCode(parseInt(byte, 16))).join('').trim()
          };
          break;
        case 0xA2: // Scan Door
          result = {
            command: EMACHINE_COMMAND.SCAN_DOOR,
            doorStatus: data.map(byte => parseInt(byte, 16))
          };
          break;
        case 0xA3: // Poll Status
          const statusData = data.map(byte => parseInt(byte, 16));
          if (statusData.length < 9) {
            this.addLogMessage(this.log, 'Invalid poll status data length');
            return null;
          }
          result = {
            command: EMACHINE_COMMAND.READ_EVENTS,
            status: statusData[0],
            motorNumber: statusData[1] || 0,
            executionResult: statusData[2] || 0,
            dropSuccess: !(statusData[2] & 0x04),
            faultCode: statusData[2] & 0x03,
            maxCurrent: (statusData[3] << 8) | statusData[4],
            avgCurrent: (statusData[5] << 8) | statusData[6],
            runTime: statusData[7] || 0,
            temperature: statusData[8] || 0
          };
          if (result.temperature === -40) {
            this.addLogMessage(this.log, 'Temperature sensor disconnected');
          } else if (result.temperature === 120) {
            this.addLogMessage(this.log, 'Temperature sensor shorted');
          }
          if (result.faultCode !== 0) {
            this.addLogMessage(this.log, `Fault code: ${result.faultCode === 1 ? 'Overcurrent' : result.faultCode === 2 ? 'Open circuit' : 'Timeout'}`);
          }
          this.machinestatus.data = JSON.stringify(result);
          break;
        case 0xA4:
          if (data.length !== 3) return null;
          result = {
            command: EMACHINE_COMMAND.SET_TEMP,
            mode: parseInt(data[0], 16),
            tempValue: (parseInt(data[1], 16) << 8) | parseInt(data[2], 16) // Single signed temperature value
          };
          break;
        case 0xA5: // Start Motor
          result = {
            command: EMACHINE_COMMAND.START_MOTOR,
            executionCode: parseInt(data[0], 16)
          };
          if (result.executionCode !== 0) {
            this.addLogMessage(this.log, `Motor error: Code ${result.executionCode}`);
          }
          break;
        case 0xB5: // Start Motor (Merged)
          result = {
            command: EMACHINE_COMMAND.START_MOTOR_MERGED,
            executionCode: parseInt(data[0], 16)
          };
          if (result.executionCode !== 0) {
            this.addLogMessage(this.log, `Merged motor error: Code ${result.executionCode}`);
          }
          break;
        case 0xA6: // Acknowledge Result
          result = {
            command: EMACHINE_COMMAND.CLEAR_RESULT,
            acknowledged: true
          };
          break;
        case 0x34: // Query Swap
        case 0x35: // Set Swap
          result = {
            command: command === 0x34 ? 'QUERY_SWAP' : 'SET_SWAP',
            swapStatus: parseInt(data[0], 16)
          };
          break;
        case 0x21: // Two Wire Mode
          result = {
            command: EMACHINE_COMMAND.SET_TWO_WIRE_MODE,
            mode: parseInt(data[0], 16)
          };
          break;
        default:
          this.addLogMessage(this.log, `Unknown command: 0x${command.toString(16)}`);
          return null;
      }

      if (this.pendingCommand && result.command === this.pendingCommand.command) {
        const { resolve, transactionID } = this.pendingCommand;
        resolve({
          command: result.command,
          data: result,
          status: result.executionCode === 0 || result.acknowledged ? 1 : 0,
          message: `Command 0x${command.toString(16)} executed`,
          transactionID
        });
        this.pendingCommand = null;
      }

      return result;
    } catch (error) {
      this.addLogMessage(this.log, `Error processing response: ${error.message}`);
      if (this.pendingCommand) {
        this.pendingCommand.reject(error);
        this.pendingCommand = null;
      }
      return null;
    }
  }

  private initADH814(): void {
    this.getSerialEvents().subscribe((event) => {
      // Toast.show({ text: `Event: ${event}`, duration: 'long' });

      if (event.event === 'dataReceived') {
        const rawData = event.data;
        this.addLogMessage(this.log, `Raw data: ${rawData}`);
        console.log('ADH814 Received from device:', rawData);

        const r = this.processResponse(rawData);
        this.addLogMessage(this.log, `Processed response: ${JSON.stringify(r)}`, `Response: ${JSON.stringify(r)}`);
      }
    });
  }

  async setupDevice(address: number = 0x01): Promise<any> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await this.command(EMACHINE_COMMAND.READ_ID, { address }, Date.now());
        this.addLogMessage(this.log, `Device ID: ${result?.data?.firmwareVersion}`);
        return result; // Explicit return
      } catch (err) {
        this.addLogMessage(this.log, `Setup attempt ${attempt} failed: ${err.message}`);
      }
    }
    // throw new Error('Failed to setup device after 3 attempts');
  }

  async setDefaultTemperature(address: number = 0x01): Promise<any> {
    try {
      const result = await this.command(EMACHINE_COMMAND.SET_TEMP, {
        address,
        mode: this.COOLING_MODE,
        tempValue: this.DEFAULT_TEMPERATURE
      }, Date.now());
      this.addLogMessage(this.log, `Default temperature set to ${this.DEFAULT_TEMPERATURE}°C: ${JSON.stringify(result)}`);
      return result; // Explicit return
    } catch (err) {
      this.addLogMessage(this.log, `Failed to set default temperature: ${err.message}`);
      // throw err;
    }
  }

  setPolling(address: number = 0x01, interval: number = 1000): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.currentInterval = interval < 100 ? 100 : interval;
    this.addLogMessage(this.log, `Starting polling with interval ${this.currentInterval}ms`);

    let errorCount = 0;
    this.pollInterval = setInterval(async () => {
      try {
        const result = await this.command(EMACHINE_COMMAND.READ_EVENTS, { address }, Date.now());
        if (result?.data?.status === 0x02) {
          this.addLogMessage(this.log, `Delivery ended for motor ${result?.data?.motorNumber}: Drop ${result?.data?.dropSuccess ? 'successful' : 'failed'}${result?.data?.faultCode ? `, Fault code: ${result?.data?.faultCode}` : ''}`);
          await this.command(EMACHINE_COMMAND.CLEAR_RESULT, { address }, Date.now());
          this.addLogMessage(this.log, 'ACK sent for delivery end');
        }
        errorCount = 0; // Reset on success
      } catch (err) {
        errorCount++;
        this.addLogMessage(this.log, `Polling error: ${err.message}`);
        if (errorCount >= 3) {
          this.addLogMessage(this.log, 'Stopping polling due to repeated errors');
          clearInterval(this.pollInterval!);
          this.pollInterval = undefined;
        }
      }
    }, this.currentInterval);
    return; // Explicit return
  }

  initializeSerialPort(
    portName: string,
    baudRate: number,
    log: IlogSerial,
    machineId: string,
    otp: string,
    isNative: ESerialPortType,
    pollInterval: number = 300
  ): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      this.machineId = machineId;
      this.otp = otp;
      this.portName = portName || this.portName;
      this.baudRate = baudRate || this.baudRate;
      this.log = log;

      try {
        const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
        await this.serialService.startReading();
        if (init === this.portName) {
          this.initADH814();
          this.addLogMessage(this.log, `Serial port initialized: ${init}`);
          await this.setupDevice();
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for serial port to stabilize

          this.setPolling(0x01, pollInterval);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for serial port to stabilize

          await this.setDefaultTemperature();
          setTimeout(() => {
            this.command(EMACHINE_COMMAND.shippingcontrol, { address: 0x01, slot: 1 }, Date.now())
            this.addLogMessage(this.log, 'Shipping control command sent '+` for address 0x01 and slot 0`);
          }, 30000);
          resolve(init);
        } else {
          this.addLogMessage(this.log, `Serial port mismatch: Expected ${this.portName}, got ${init}`);
          reject(new Error(`Serial port mismatch: Expected ${this.portName}, got ${init}`));
        }
      } catch (err) {
        this.addLogMessage(this.log, `Initialization failed: ${err.message}`);
        reject(err);
      }
    });
  }

  async command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
              this.addLogMessage(this.log, `************ Executing command: ${EMACHINE_COMMAND[command]} `);

      if (command != EMACHINE_COMMAND.READ_EVENTS) {
        this.addLogMessage(this.log, `Executing command: ${EMACHINE_COMMAND[command]} with params: ${JSON.stringify(params)}`, `Command: ${EMACHINE_COMMAND[command]}, Params: ${JSON.stringify(params)}`);
      }
      let buff: string[] = [];
      let check = '';
      const address = params?.address?.toString(16).padStart(2, '0') || '01';

      try {
        switch (command) {
          case EMACHINE_COMMAND.READ_ID:
            buff = [address, 'A1'];
            break;
          case EMACHINE_COMMAND.SET_SWAP:
            buff = [address, '35', '01'];
            break;
          case EMACHINE_COMMAND.SET_TWO_WIRE_MODE:
            buff = [address, '21', '10', '00'];
            break;
          case EMACHINE_COMMAND.SET_TEMP:
            const mode = params.mode?.toString(16).padStart(2, '0') || '01';
            const tempValue = params.lowTemp ?? 7; // Renamed from lowTemp
            if (tempValue < -127 || tempValue > 127) {
              throw new Error('Temperature must be between -127 and 127°C');
            }
            const tempHighByte = ((tempValue >> 8) & 0xFF).toString(16).padStart(2, '0'); // Renamed
            const tempLowByte = (tempValue & 0xFF).toString(16).padStart(2, '0'); // Renamed
            buff = [address, 'A4', mode, tempHighByte, tempLowByte];
            this.addLogMessage(this.log, `Setting temperature: Mode ${mode}, Value ${JSON.stringify(buff)}°C`);
            break;
          case EMACHINE_COMMAND.shippingcontrol:
            const slot = params.slot ? (params.slot - 1).toString(16).padStart(2, '0') : '00';
            buff = [address, 'A5', slot];
            break;
          case EMACHINE_COMMAND.CLEAR_RESULT:
            buff = [address, 'A6'];
            break;
          case EMACHINE_COMMAND.READ_EVENTS:
            buff = [address, 'A3'];
            break;
          case EMACHINE_COMMAND.SCAN_DOOR:
            buff = [address, 'A2'];
            break;
          case EMACHINE_COMMAND.RESET:
            resolve({ command, data: {}, status: 1, message: 'Reset command executed', transactionID });
            return;
          default:
            reject(new Error('Unknown command'));
            return;
        }

        check = this.calculateCrc16(buff);
        const request = buff.join('') + check;
        /// we don;t want to log events in production
        if (!EMACHINE_COMMAND.READ_EVENTS)
          this.addLogMessage(this.log, `Sending command: ${request}`);

        this.pendingCommand = { command, transactionID, resolve, reject };
        await this.serialService.write(request);
        resolve({ command, data: {}, status: 1, message: `Command ${EMACHINE_COMMAND[command]} executed`, transactionID });

      } catch (error) {
        this.addLogMessage(this.log, `Command failed: ${error.message}`);
        reject(error);
      }
    });
  }

  checkSum(data: string[]): string {
    return data.join('') + this.calculateCrc16(data);
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  getStatusUpdates() {
    return this.serialService.getSerialEvents();
  }

  close(): Promise<void> {
    if (this.pollInterval) clearInterval(this.pollInterval);
    return this.serialService.close();
  }

  async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
  }

  getCurrentInterval(): number {
    return this.currentInterval;
  }
}