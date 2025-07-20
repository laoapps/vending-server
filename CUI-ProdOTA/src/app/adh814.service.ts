import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { IResModel, ESerialPortType, ISerialService, EMACHINE_COMMAND, IlogSerial } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import { Toast } from '@capacitor/toast';
import * as moment from 'moment-timezone';

export enum EADH814_COMMAND {
  REQUEST_ID = 'A1',
  SCAN_DOOR = 'A2',
  POLL_STATUS = 'A3',
  SET_TEMP = 'A4',
  START_MOTOR = 'A5',
  ACKNOWLEDGE = 'A6',
  START_MOTOR_COMBINED = 'B5',
  SET_SWAP= '35',
  SET_TWO_WIRE_MODE = '21'
}

@Injectable({
  providedIn: 'root'
})
export class ADH814Service implements ISerialService {
  machineId: string = '11111111';
  otp: string = '111111';
  portName: string = '/dev/ttyS1';
  baudRate: number = 38400;
  parity: 'none' = 'none';
  dataBits: number = 8;
  stopBits: number = 1;
  log: IlogSerial = { data: '', limit: 50 };
  machinestatus = { data: '' };
  private currentInterval: number = 300;
  private readonly DEFAULT_TEMPERATURE = 3;
  private readonly COOLING_MODE = 0x01;

  constructor(private serialService: SerialServiceService) { }

  private addLogMessage(message: string, consoleMessage?: string, showToast = false): void {
    this.log.data += `${message}\n`;
    if (showToast) Toast.show({ text: message, duration: 'long' });
    if (consoleMessage) console.log(consoleMessage);
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


  private processResponse(rawData: string): IResModel {
    try {
      const hexData = rawData?.replace(/\s/g, '').toLowerCase();
      console.log(`Raw response: ${hexData}`);
      this.addLogMessage(`Raw data: ${hexData}`);

      if (hexData.length < 8) {
        this.addLogMessage(`Invalid response: Too short (${hexData.length / 2} bytes)`);
        return { command: '', status: 0, data: {}, message: 'Invalid response: Too short', transactionID: 0 };
      }

      const address = parseInt(hexData.slice(0, 2), 16);
      const command = parseInt(hexData.slice(2, 4), 16);
      const crcReceived = hexData.slice(-4);
      const data = hexData.slice(4, -4).match(/.{2}/g) || [];

      const frameWithoutCrc = hexData.slice(0, -4);
      const calculatedCrc = this.calculateCrc16(frameWithoutCrc.match(/.{2}/g) || []);
      if (crcReceived !== calculatedCrc) {
        this.addLogMessage(`CRC mismatch: Expected ${calculatedCrc}, Received ${crcReceived}`);
        return { command: '', status: 0, data: {}, message: 'CRC mismatch', transactionID: 0 };
      }

      if (command !== 0xA1 && address !== 0x00) {
        this.addLogMessage(`Invalid address for command 0x${command.toString(16)}: Expected 0x00, got 0x${address.toString(16)}`);
        return { command: '', status: 0, data: {}, message: 'Invalid address', transactionID: 0 };
      }
      if (command === 0xA1 && (address < 0x01 || address > 0x04)) {
        this.addLogMessage(`Invalid address for command 0xA1: Expected 0x01-0x04, got 0x${address.toString(16)}`);
        return { command: '', status: 0, data: {}, message: 'Invalid address', transactionID: 0 };
      }

      let result: IResModel;
      switch (command) {
        case 0xA1: // Request ID
          if (data.length !== 16) {
            this.addLogMessage(`Invalid ID response: Expected 16 data bytes, got ${data.length}`);
            result = { command: EMACHINE_COMMAND.READ_ID, status: 0, data: {}, message: 'Invalid ID response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.READ_ID,
            status: 1,
            data: { firmwareVersion: data.map(byte => String.fromCharCode(parseInt(byte, 16))).join('').trim() },
            message: 'ID retrieved successfully',
            transactionID: 0
          };
          this.addLogMessage(`Device ID: ${result.data.firmwareVersion}`);
          break;
        case 0xA2: // Scan Door Feedback
          if (data.length !== 18) {
            this.addLogMessage(`Invalid SCAN response: Expected 18 data bytes, got ${data.length}`);
            result = { command: EMACHINE_COMMAND.SCAN_DOOR, status: 0, data: {}, message: 'Invalid SCAN response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.SCAN_DOOR,
            status: 1,
            data: { doorFeedback: data.map(byte => parseInt(byte, 16)) },
            message: 'Scan door feedback retrieved successfully',
            transactionID: 0
          };
          this.addLogMessage(`Door feedback: ${JSON.stringify(result.data.doorFeedback)}`);
          break;
        case 0xA3: // Poll Status
          if (data.length !== 9) {
            this.addLogMessage(`Invalid POLL status data length: ${data.length}`);
            result = { command: EMACHINE_COMMAND.READ_EVENTS, status: 0, data: {}, message: 'Invalid POLL status data length', transactionID: 0 };
            break;
          }
          const statusData = data.map(byte => parseInt(byte, 16));
          result = {
            command: EMACHINE_COMMAND.READ_EVENTS,
            status: 1,
            data: {
              status: statusData[0],
              motorNumber: statusData[1],
              executionResult: statusData[2],
              dropSuccess: !(statusData[2] & 0x04),
              faultCode: statusData[2] & 0x03,
              maxCurrent: (statusData[3] << 8) | statusData[4],
              avgCurrent: (statusData[5] << 8) | statusData[6],
              runTime: statusData[7],
              temperature: statusData[8] > 127 ? statusData[8] - 256 : statusData[8]
            },
            message: 'Poll status retrieved successfully',
            transactionID: 0
          };
          this.addLogMessage(`Poll status: Motor ${result.data.motorNumber}, Status ${result.data.status}, Drop ${result.data.dropSuccess ? 'Success' : 'Failed'}, Temp ${result.data.temperature}°C`);
          if (result.data.temperature === -40) {
            this.addLogMessage('Temperature sensor disconnected');
          } else if (result.data.temperature === 120) {
            this.addLogMessage('Temperature sensor shorted');
          }
          if (result.data.faultCode !== 0) {
            this.addLogMessage(`Fault code: ${result.data.faultCode === 1 ? 'Overcurrent' : result.data.faultCode === 2 ? 'Open circuit' : 'Timeout'}`);
          }
          this.machinestatus.data = result.data;
          // this.addLogMessage(`Machine status: ${JSON.stringify(this.machinestatus?.data)}`,'',true);
          break;
        case 0xA4: // Set Temperature
          if (data.length !== 3) {
            this.addLogMessage(`Invalid TEMP response: Expected 3 data bytes, got ${data.length}`);
            result = { command: EMACHINE_COMMAND.SET_TEMP, status: 0, data: {}, message: 'Invalid TEMP response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.SET_TEMP,
            status: 1,
            data: {
              mode: parseInt(data[0], 16),
              tempValue: (parseInt(data[1], 16) << 8) | parseInt(data[2], 16)
            },
            message: 'Temperature set successfully',
            transactionID: 0
          };
          this.addLogMessage(`Temperature set: Mode ${result.data.mode}, Value ${result.data.tempValue}°C`);
          break;
        case 0xA5: // Start Motor
          if (data.length !== 1) {
            this.addLogMessage(`Invalid RUN response: Expected 1 data byte, got ${data.length}`);
            result = { command: EMACHINE_COMMAND.shippingcontrol, status: 0, data: {}, message: 'Invalid RUN response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.shippingcontrol,
            status: parseInt(data[0], 16) === 0 ? 1 : 0,
            data: { executionStatus: parseInt(data[0], 16) },
            message: parseInt(data[0], 16) === 0 ? 'Motor started successfully' : `Motor error: Code ${parseInt(data[0], 16)}`,
            transactionID: 0
          };
          this.addLogMessage(result.message);
          break;
        case 0xB5: // Start Motor Combined
          if (data.length !== 1) {
            this.addLogMessage(`Invalid RUN2 response: Expected 1 data byte, got ${data.length}`);
            result = { command: EMACHINE_COMMAND.START_MOTOR_MERGED, status: 0, data: {}, message: 'Invalid RUN2 response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.START_MOTOR_MERGED,
            status: parseInt(data[0], 16) === 0 ? 1 : 0,
            data: { executionStatus: parseInt(data[0], 16) },
            message: parseInt(data[0], 16) === 0 ? 'Merged motor started successfully' : `Merged motor error: Code ${parseInt(data[0], 16)}`,
            transactionID: 0
          };
          this.addLogMessage(result.message);
          break;
        case 0xA6: // Acknowledge Result
          if (data.length !== 0) {
            this.addLogMessage(`Invalid ACK response: Expected 0 data bytes, got ${data.length}`);
            result = { command: EMACHINE_COMMAND.CLEAR_RESULT, status: 0, data: {}, message: 'Invalid ACK response length', transactionID: 0 };
            break;
          }
          result = {
            command: EMACHINE_COMMAND.CLEAR_RESULT,
            status: 1,
            data: { acknowledged: true },
            message: 'Result acknowledged successfully',
            transactionID: 0
          };
          this.addLogMessage(result.message);
          break;
        default:
          this.addLogMessage(`Unsupported command: 0x${command.toString(16)}`);
          result = { command: '', status: 0, data: {}, message: 'Unsupported command', transactionID: 0 };
      }
      return result;
    } catch (error: any) {
      this.addLogMessage(`Error processing response: ${error.message}`);
      return { command: '', status: 0, data: {}, message: `Error processing response: ${error.message}`, transactionID: 0 };
    }
  }

  private initADH814(): void {
    // this.getSerialEvents().subscribe(async (event) => {
    //   if (event?.event === 'dataReceived') {
    //     const rawData = event?.data;
    //     this.addLogMessage(`Raw data: ${rawData}`);
    //     console.log('ADH814 Received from device:', rawData);
    //     if (rawData) {
    //       const result = this.processResponse(rawData);
    //       if (result && result.command !== EMACHINE_COMMAND.READ_EVENTS) {
    //         this.addLogMessage(`Processed response: ${JSON.stringify(result || {})}`);
    //       }
    //     }

    //   }
    // });
  }

  async command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    try {
      if (command !== EMACHINE_COMMAND.READ_EVENTS) {
        this.addLogMessage(`Command: ${EMACHINE_COMMAND[command]}, Params: ${JSON.stringify(params)}, Transaction ID: ${transactionID}`);
      }
      const address = params?.address || 0x01;
      let cmd: string;
      let data: any = {};

      switch (command) {
        case EMACHINE_COMMAND.READ_ID:
          cmd = EADH814_COMMAND.REQUEST_ID;
          break;
        case EMACHINE_COMMAND.SCAN_DOOR:
          cmd = EADH814_COMMAND.SCAN_DOOR;
          break;
        case EMACHINE_COMMAND.READ_EVENTS:
          cmd = EADH814_COMMAND.POLL_STATUS;
          break;
        case EMACHINE_COMMAND.SET_TEMP:
          cmd = EADH814_COMMAND.SET_TEMP;
          data = {
            mode: params?.mode ?? this.COOLING_MODE,
            tempValue: params?.lowTemp ?? this.DEFAULT_TEMPERATURE
          };
          if (data.mode < 0 || data.mode > 2) {
            this.addLogMessage(`Invalid mode: ${data.mode}. Must be 0-2`);
            return { command, data: params, status: 0, message: `Invalid mode: ${data.mode}`, transactionID };
          }
          if (data.tempValue < -127 || data.tempValue > 127) {
            this.addLogMessage(`Invalid temperature value: ${data.tempValue}. Must be -127 to 127`);
            return { command, data: params, status: 0, message: `Invalid temperature value: ${data.tempValue}`, transactionID };
          }
          break;
        case EMACHINE_COMMAND.shippingcontrol:
          cmd = EADH814_COMMAND.START_MOTOR;
          data = { motorNumber: params?.slot ? params.slot - 1 : 0 };
          if (data.motorNumber < 0 || data.motorNumber > 0xFE) {
            this.addLogMessage(`Invalid motor number: ${data.motorNumber}. Must be 0-254`);
            return { command, data: params, status: 0, message: `Invalid motor number: ${data.motorNumber}`, transactionID };
          }
          break;
        case EMACHINE_COMMAND.CLEAR_RESULT:
          cmd = EADH814_COMMAND.ACKNOWLEDGE;
          break;
        case EMACHINE_COMMAND.START_MOTOR_MERGED:
          cmd = EADH814_COMMAND.START_MOTOR_COMBINED;
          data = {
            motorNumber1: params?.motorNumber1 ?? 0,
            motorNumber2: params?.motorNumber2 ?? 0
          };
          if (data.motorNumber1 < 0 || data.motorNumber1 > 0xFE || data.motorNumber2 < 0 || data.motorNumber2 > 0xFE) {
            this.addLogMessage(`Invalid motor numbers: ${data.motorNumber1}, ${data.motorNumber2}. Must be 0-254`);
            return { command, data: params, status: 0, message: `Invalid motor numbers`, transactionID };
          }
          break;
        case EMACHINE_COMMAND.SET_SWAP:
          cmd = EADH814_COMMAND.SET_SWAP;
          params?params.on=[0x01]:params.on=[0x00];
          break;
        case EMACHINE_COMMAND.SET_TWO_WIRE_MODE:
          cmd = EADH814_COMMAND.SET_TWO_WIRE_MODE;
          params?params.swap=[0x10, 0x00]:params.swap=[0x00, 0x00];
          break;
        default:
          this.addLogMessage(`Unsupported command: ${command}`);
          return { command, data: params, status: 0, message: `Unsupported command`, transactionID };
      }

      const request = { command: cmd, params: { address, ...data } };
      await this.serialService.writeADH814(JSON.stringify(request));
      return { command, data: params, status: 1, message: 'Command sent successfully', transactionID };
    } catch (error: any) {
      this.addLogMessage(`Command failed: ${error.message}`);
      return { command, data: params, status: 0, message: `Command failed: ${error.message}`, transactionID };
    }
  }

  async initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, machineId: string, otp: string, isNative: ESerialPortType): Promise<string> {
    try {
      this.machineId = machineId;
      this.otp = otp;
      this.portName = portName || this.portName;
      this.baudRate = baudRate || this.baudRate;
      this.log = log;
      const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      await this.serialService.startReadingADH814();
      if (init === this.portName) {
        this.initADH814();
        await this.setupDevice();
        this.addLogMessage(`Device setup initiated for port: ${this.portName}`);
        return init;
      }
      this.addLogMessage(`Serial port initialization failed: ${init}`);
      return '';
    } catch (err: any) {
      this.addLogMessage(`Initialization failed: ${err.message}`);
      return '';
    }
  }

  async setupDevice(address: number = 0x01): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        this.addLogMessage(`Setting up device at address 0x${address.toString(16)}`);

        const result = await this.command(EMACHINE_COMMAND.READ_ID, { address }, Date.now());
        this.addLogMessage(`Device ID: ${result?.data?.firmwareVersion}`);

        this.addLogMessage(`Default temperature set`);

        setInterval(async () => {
          let pollResult = await this.command(EMACHINE_COMMAND.READ_EVENTS, { address }, Date.now());
          if (pollResult?.data?.status !== 0) {
            this.addLogMessage(`Board not in idle state (status: ${JSON.stringify(pollResult)})`);
          }
        }, 10000);

        resolve(result);
      } catch (err: any) {
        this.addLogMessage(`Setup failed: ${err.message}`);
        reject(err);
      }
    });
  }

  async setDefaultTemperature(address: number = 0x01): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.command(EMACHINE_COMMAND.SET_TEMP, {
          address,
          mode: this.COOLING_MODE,
          tempValue: this.DEFAULT_TEMPERATURE
        }, Date.now());
        this.addLogMessage(`Default temperature set to ${this.DEFAULT_TEMPERATURE}°C`);
        resolve(result);
      } catch (err: any) {
        this.addLogMessage(`Failed to set default temperature: ${err.message}`);
        reject(err);
      }
    });
  }
   public async setSwap(address: number = 0x01): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.command(EMACHINE_COMMAND.SET_SWAP, {
          address
        }, Date.now());
        this.addLogMessage(`Default temperature set to ${this.DEFAULT_TEMPERATURE}°C`);
        resolve(result);
      } catch (err: any) {
        this.addLogMessage(`Failed to set default temperature: ${err.message}`);
        reject(err);
      }
    });
  }
  public async setTwoWires(address: number = 0x01): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.command(EMACHINE_COMMAND.SET_TWO_WIRE_MODE, {
          address,
          mode: this.COOLING_MODE,
          tempValue: this.DEFAULT_TEMPERATURE
        }, Date.now());
        this.addLogMessage(`Default temperature set to ${this.DEFAULT_TEMPERATURE}°C`);
        resolve(result);
      } catch (err: any) {
        this.addLogMessage(`Failed to set default temperature: ${err.message}`);
        reject(err);
      }
    });
  }
  async setTemperature(address: number = 0x01, temp = 5): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.command(EMACHINE_COMMAND.SET_TEMP, {
          address,
          mode: this.COOLING_MODE,
          tempValue: temp
        }, Date.now());
        this.addLogMessage(`Default temperature set to ${temp}°C`);
        resolve(result);
      } catch (err: any) {
        this.addLogMessage(`Failed to set default temperature: ${err.message}`);
        reject(err);
      }
    });
  }



  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  async close(): Promise<void> {
    await this.serialService.close();
  }

  async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
  }

  getCurrentInterval(): number {
    return this.currentInterval;
  }
  checkSum(data?: any[]) {
    data[data.length - 1] = this.serialService.chk8xor(data);
    return data.join('');
  }
}