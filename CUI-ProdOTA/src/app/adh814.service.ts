import { Injectable } from '@angular/core';
import { SerialPortListResult } from 'SerialConnectionCapacitor/dist/esm/definitions';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, ISerialService, IResModel } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import { Toast } from '@capacitor/toast';
import { DebugService } from './debug.service';
import { stat } from 'fs';

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
  private currentInterval: number = 250;
  private readonly DEFAULT_TEMPERATURE = 7;
  private readonly COOLING_MODE = 0x01;

  constructor(public serialService: SerialServiceService,
    private debugService: DebugService) { }

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
      this.addLogMessage(this.log, `Raw response: ${hexData}`);
      console.log(`Raw response: ${hexData}`);

      if (hexData.length < 8) {
        this.addLogMessage(this.log, `Invalid response: Too short (${hexData.length / 2} bytes)`);
        return {command:'',status:0, data: {}, message: 'Invalid response: Too short', transactionID: 0};
      }

      const address = parseInt(hexData.slice(0, 2), 16);
      const command = parseInt(hexData.slice(2, 4), 16);
      const crcReceived = hexData.slice(-4);
      const data = hexData.slice(4, -4).match(/.{2}/g) || [];

      const frameWithoutCrc = hexData.slice(0, -4);
      const calculatedCrc = this.calculateCrc16(frameWithoutCrc.match(/.{2}/g) || []);
      if (crcReceived !== calculatedCrc) {
        this.addLogMessage(this.log, `CRC mismatch: Expected ${calculatedCrc}, Received ${crcReceived}`);
        return { command, status: 0, data: {}, message: 'CRC mismatch', transactionID: 0 };
      }

      // Allow 0x01-0x04 for 0xA1, 0x34, 0x35, 0x21; 0x00 for others
      if (command !== 0xA1 && command !== 0x34 && command !== 0x35 && command !== 0x21 && address !== 0x00) {
        this.addLogMessage(this.log, `Invalid address for command 0x${command.toString(16)}: Expected 0x00, got 0x${address.toString(16)}`);
        return { command, status: 0, data: {}, message: 'Invalid address', transactionID: 0};
      }
      if ((command === 0xA1 || command === 0x34 || command === 0x35 || command === 0x21) && (address < 0x01 || address > 0x04)) {
        this.addLogMessage(this.log, `Invalid address for command 0x${command.toString(16)}: Expected 0x01-0x04, got 0x${address.toString(16)}`);
        return { command, status: 0, data: {}, message: 'Invalid address', transactionID: 0  };
      }

      let result: any;
      switch (command) {
        case 0xA1: // Request ID
          if (data.length !== 16) {
            this.addLogMessage(this.log, `Invalid ID response: Expected 16 data bytes, got ${data.length}`);
            result = { command, status: 0, data: {}, message: 'Invalid ID response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.READ_ID,
            firmwareVersion: data.map(byte => String.fromCharCode(parseInt(byte, 16))).join('').trim(),
            status: 1,
            message: 'ID retrieved successfully',
          };
          break;
        case 0xA2: // Scan Door Feedback
          if (data.length !== 18) {
            this.addLogMessage(this.log, `Invalid SCAN response: Expected 18 data bytes, got ${data.length}`);
            result= { command, status: 0, data: {}, message: 'Invalid SCAN response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.SCAN_DOOR,
            data: data.map(byte => parseInt(byte, 16)),
            status:1,
            message:'Scan door feedback retrieved successfully'
          };
          break;
        case 0xA3: // Poll Status
          if (data.length !== 9) {
            this.addLogMessage(this.log, `Invalid POLL status data length: ${data.length}`);
            result= { command, status: 0, data: {}, message: 'Invalid POLL status data length', transactionID: 0 };
            break;
          }
          const statusData = data.map(byte => parseInt(byte, 16));
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
            temperature: statusData[8] > 127 ? statusData[8] - 256 : statusData[8],
            message:'Poll status retrieved successfully',
          };
          if (result.temperature === -40) {
            this.addLogMessage(this.log, 'Temperature sensor disconnected');
          } else if (result.temperature === 120) {
            this.addLogMessage(this.log, 'Temperature sensor shorted');
          }
          if (result.faultCode !== 0) {
            this.addLogMessage(this.log, `Fault code: ${result.faultCode === 1 ? 'Overcurrent' : result.faultCode === 2 ? 'Open circuit' : 'Timeout'}`);
          }
          this.machinestatus.data = result;
          break;
        case 0xA4: // Set Temperature
          if (data.length !== 3) {
            this.addLogMessage(this.log, `Invalid TEMP response: Expected 3 data bytes, got ${data.length}`);
            result= { command, status: 0, data: {}, message: 'Invalid TEMP response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.SET_TEMP,
            mode: parseInt(data[0], 16),
            data: (parseInt(data[1], 16) << 8) | parseInt(data[2], 16),
            status: 1,
            message: 'Temperature set successfully',
          };
          break;
        case 0xA5: // Start Motor
          if (data.length !== 1) {
            this.addLogMessage(this.log, `Invalid RUN response: Expected 1 data byte, got ${data.length}`);
            result= { command, status: 0, data: {}, message: 'Invalid RUN response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.shippingcontrol,
            data: parseInt(data[0], 16),
            status:1,
            message: 'Motor started successfully',
          };
          if (result.executionCode !== 0) {
            this.addLogMessage(this.log, `Motor error: Code ${result.executionCode}`);
          }
          break;
        case 0xB5: // Start Motor (Merged)
          if (data.length !== 1) {
            this.addLogMessage(this.log, `Invalid RUN2 response: Expected 1 data byte, got ${data.length}`);
            result= { command, status: 0, data: {}, message: 'Invalid RUN2 response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.START_MOTOR_MERGED,
            data: parseInt(data[0], 16),
            status: 1,
            message: 'START_MOTOR_MERGED successfully',
          };
          if (result.executionCode !== 0) {
            this.addLogMessage(this.log, `Merged motor error: Code ${result.executionCode}`);
          }
          break;
        case 0xA6: // Acknowledge Result
          if (data.length !== 0) {
            this.addLogMessage(this.log, `Invalid ACK response: Expected 0 data bytes, got ${data.length}`);
            result= { command, status: 0, data: {}, message: 'Invalid ACK response length', transactionID: 0 };
            break;

          }
          result = {
            command: EMACHINE_COMMAND.CLEAR_RESULT,
            acknowledged: true,
            status:1,
            message: 'Result acknowledged successfully',
          };
          break;
        case 0x34: // Query Swap
          if (data.length !== 1) {
            this.addLogMessage(this.log, `Invalid QUERY_SWAP response: Expected 1 data byte, got ${data.length}`);
            result= { command, status: 0, data: {}, message: 'Invalid QUERY_SWAP response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.QUERY_SWAP,
            data: parseInt(data[0], 16),
            status: 1,
            message: 'Swap status retrieved successfully',
          };
          break;
        case 0x35: // Set Swap
          if (data.length !== 1) {
            this.addLogMessage(this.log, `Invalid SET_SWAP response: Expected 1 data byte, got ${data.length}`);
            result= { command, status: 0, data: {}, message: 'Invalid SET_SWAP response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.SET_SWAP,
            data: parseInt(data[0], 16),
            status: 1,
            message: 'Swap status set successfully',
          };
          break;
        case 0x21: // Switch to Two-Wire Mode
          if (data.length !== 2) {
            this.addLogMessage(this.log, `Invalid TWO_WIRE_MODE response: Expected 2 data bytes, got ${data.length}`);
            result={ command, status: 0, data: {}, message: 'Invalid TWO_WIRE_MODE response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.SET_TWO_WIRE_MODE,
            mode: parseInt(data[0], 16),
            data: parseInt(data[1], 16),
            status: 1,
            message: 'Switched to two-wire mode successfully',
          };
          break;
        default:
          this.addLogMessage(this.log, `Unsupported command: 0x${command.toString(16)}`);
          result={ command, status: 0, data: {}, message: 'Unsupported command', transactionID: 0 };
      }
      return result;
    } catch (error) {
      this.addLogMessage(this.log, `Error processing response: ${error.message}`);
      return { command: '', status: 0, data: {}, message: `Error processing response: ${error.message}`, transactionID: 0 };
    }
  }

  private initADH814(): void {
    this.getSerialEvents().subscribe(async (event) => {
      if (event.event === 'dataReceived') {
        const rawData = event.data;
        this.addLogMessage(this.log, `Raw data: ${rawData}`);
        console.log('ADH814 Received from device:', rawData);
        const result = this.processResponse(rawData);
        if (result) {
          this.addLogMessage(this.log, `Processed response: ${JSON.stringify(result)}`, `Response: ${JSON.stringify(result)}`);
          // Send ACK for POLL status 0x02
          if (result.command === EMACHINE_COMMAND.READ_EVENTS && result.status === 0x02) {
            try {
              await this.command(EMACHINE_COMMAND.CLEAR_RESULT, { address: 0x01 }, Date.now());
              this.addLogMessage(this.log, 'Sent ACK for POLL status 0x02');
            } catch (error) {
              this.addLogMessage(this.log, `Failed to send ACK: ${error.message}`);
            }
          }
        }
      }
    });
  }

  async setupDevice(address: number = 0x01): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        this.addLogMessage(this.log, `Setting up device at address 0x${address.toString(16)}`);
        const result = await this.command(EMACHINE_COMMAND.READ_ID, { address }, Date.now());
        if (result?.data?.firmwareVersion) {
          this.addLogMessage(this.log, `Device ID: ${result.data.firmwareVersion}`);
          resolve(result); // Explicit return
        } else {
          reject(new Error('Failed to read device ID'));
        }
      } catch (err) {
        this.addLogMessage(this.log, `Setup failed: ${err.message}`);
        reject(err);
      }
    })

  }

  async setDefaultTemperature(address: number = 0x01): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.command(EMACHINE_COMMAND.SET_TEMP, {
          address,
          mode: this.COOLING_MODE,
          tempValue: this.DEFAULT_TEMPERATURE
        }, Date.now());
        this.addLogMessage(this.log, `Default temperature set to ${this.DEFAULT_TEMPERATURE}°C: ${JSON.stringify(result)}`);
        resolve(result); // Explicit return
      } catch (err) {
        this.addLogMessage(this.log, `Failed to set default temperature: ${err.message}`);
        reject(err);
      }
    })

  }

  setPolling(address: number = 0x01, interval: number = 200): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.currentInterval = interval < 100 ? 100 : interval;
    this.addLogMessage(this.log, `Starting polling with interval ${this.currentInterval}ms`);

    let errorCount = 0;
    const that = this;
    this.pollInterval = setInterval(async () => {
      try {
        const result = await that.command(EMACHINE_COMMAND.READ_EVENTS, { address }, Date.now());
        if (result?.data?.status === 0x02) {
          // that.addLogMessage(that.log, `Delivery ended for motor ${result?.data?.motorNumber}: Drop ${result?.data?.dropSuccess ? 'successful' : 'failed'}${result?.data?.faultCode ? `, Fault code: ${result?.data?.faultCode}` : ''}`);
          await that.command(EMACHINE_COMMAND.CLEAR_RESULT, { address }, Date.now());
          // that.addLogMessage(that.log, 'ACK sent for delivery end');
        }
        errorCount = 0; // Reset on success
      } catch (err) {
        // errorCount++;
        that.addLogMessage(that.log, `Polling error: ${err.message}`);
        // if (errorCount >= 3) {
        //   that.addLogMessage(that.log, 'Stopping polling due to repeated errors');
        //   clearInterval(that.pollInterval!);
        //   that.pollInterval = undefined;
        // }
      }
    }, that.currentInterval);
    return; // Explicit return
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
        const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
        await this.serialService.startReading();
        if (init === this.portName) {
          this.initADH814();
          this.addLogMessage(this.log, `Serial port initialized: ${init}`);
          // await this.setupDevice();
          //this.setPolling(); // Start polling with default address 0x01
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for stabilization
          // await this.setDefaultTemperature();
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
      if (command !== EMACHINE_COMMAND.READ_EVENTS) {
        this.addLogMessage(this.log, `Command: ${EMACHINE_COMMAND[command]}, Params: ${JSON.stringify(params)}`);
      }
      let buff: string[] = [];
      let check = '';
      const address = params?.address?.toString(16).padStart(2, '0') || '01';

      try {
        switch (command) {
          case EMACHINE_COMMAND.READ_ID:
            buff = [address, 'A1'];
            break;
          case EMACHINE_COMMAND.QUERY_SWAP:
            buff = [address, '34'];
            break;
          case EMACHINE_COMMAND.SET_SWAP:
            const swapEnabled = params.swapEnabled ?? 1; // 0x01 = enabled, 0x00 = disabled
            if (swapEnabled !== 0 && swapEnabled !== 1) {
              throw new Error('swapEnabled must be 0 or 1');
            }
            buff = [address, '35', swapEnabled.toString(16).padStart(2, '0')];
            break;
          case EMACHINE_COMMAND.SET_TWO_WIRE_MODE:
            buff = [address, '21', '10', '00'];
            break;
          case EMACHINE_COMMAND.SET_TEMP:
            const mode = params.mode?.toString(16).padStart(2, '0') || '01';
            const tempValue = params.tempValue ?? 7;
            if (tempValue < -127 || tempValue > 127) {
              throw new Error('Temperature must be between -127 and 127°C');
            }
            const tempHighByte = ((tempValue >> 8) & 0xFF).toString(16).padStart(2, '0');
            const tempLowByte = (tempValue & 0xFF).toString(16).padStart(2, '0');
            buff = [address, 'A4', mode, tempHighByte, tempLowByte];
            this.addLogMessage(this.log, `Setting temperature: Mode ${mode}, Value ${tempValue}°C`);
            break;
          case EMACHINE_COMMAND.shippingcontrol:
            const slotNum = params.slot ? params.slot - 1 : 0;
            if (slotNum < 0 || slotNum > 0x3C) throw new Error('Motor number must be 1–61');
            const slot = slotNum.toString(16).padStart(2, '0');
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
        this.serialService.write(request).then(() => {
          console.log('zdm service  Command succeeded:', request);
          resolve({ command, data: params, message: 'Command sent successfully' } as IResModel);
        }).catch(e => {
          console.log('zdm service  Command failed:', e);
          reject({ command, params, result: e.message });
        });
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