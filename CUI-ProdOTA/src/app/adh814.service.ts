import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { IResModel, ESerialPortType, ISerialService, EMACHINE_COMMAND, IlogSerial } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import { Toast } from '@capacitor/toast';
<<<<<<< HEAD
import { DebugService } from './debug.service';
=======
import * as moment from 'moment-timezone';

export enum EADH814_COMMAND {
  REQUEST_ID = 'A1',
  SCAN_DOOR = 'A2',
  POLL_STATUS = 'A3',
  SET_TEMP = 'A4',
  START_MOTOR = 'A5',
  ACKNOWLEDGE = 'A6',
  START_MOTOR_COMBINED = 'B5'
}
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf

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
  private readonly DEFAULT_TEMPERATURE = 7;
  private readonly COOLING_MODE = 0x01;
  private pendingCommand: { command: EMACHINE_COMMAND, transactionID: number, resolve: (value: IResModel) => void, reject: (reason: any) => void } | null = null;

<<<<<<< HEAD
  constructor(private serialService: SerialServiceService, private debugService: DebugService) { }
=======
  constructor(private serialService: SerialServiceService) { }
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf

  private addLogMessage(message: string, consoleMessage?: string,showToast=false): void {
    this.log.data += `${message}\n`;
    if(showToast)Toast.show({ text: message, duration: 'long' });
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
<<<<<<< HEAD
      const hexData = rawData.replace(/\s/g, '').toLowerCase();
      if (hexData.length < 8) {
        this.addLogMessage(this.log, 'Invalid response: Too short');
        return null;
=======
      const hexData = rawData?.replace(/\s/g, '').toLowerCase();
      console.log(`Raw response: ${hexData}`);
      this.addLogMessage(`Raw data: ${hexData}`);

      if (hexData.length < 8) {
        this.addLogMessage(`Invalid response: Too short (${hexData.length / 2} bytes)`);
        return { command: '', status: 0, data: {}, message: 'Invalid response: Too short', transactionID: 0 };
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
      }

      const address = parseInt(hexData.slice(0, 2), 16);
      const command = parseInt(hexData.slice(2, 4), 16);
      const crcReceived = hexData.slice(-4);
      const data = hexData.slice(4, -4).match(/.{2}/g) || [];

      const frameWithoutCrc = hexData.slice(0, -4);
      const calculatedCrc = this.calculateCrc16(frameWithoutCrc.match(/.{2}/g) || []);
      if (crcReceived !== calculatedCrc) {
<<<<<<< HEAD
        this.addLogMessage(this.log, `CRC mismatch: Expected ${calculatedCrc}, Received ${crcReceived}`);
        return null;
      }

      if (command !== 0x34 && command !== 0x35 && command !== 0x21 && address !== 0x00 && address !== 0x01) {
        this.addLogMessage(this.log, `Invalid address: Expected 0x00 or 0x01, got 0x${address.toString(16)}`);
        return null;
      }

      let result: any = { command, data: data.map(byte => parseInt(byte, 16)) };
=======
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
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
      switch (command) {
        case 0xA1:
          if (data.length !== 16) {
<<<<<<< HEAD
            this.addLogMessage(this.log, `Invalid ID response: Expected 16 data bytes, got ${data.length}`);
            return null;
          }
          result = {
            command: EMACHINE_COMMAND.READ_ID,
            firmwareVersion: data.map(byte => String.fromCharCode(parseInt(byte, 16))).join('').trim()
          };
          this.setPolling(); // Start polling with default address 0x01
          new Promise(resolve => setTimeout(resolve, 2000)).then(() => {
            this.setDefaultTemperature();

          }); // Wait for stabilization
          break;
        case 0xA2: // Scan Door
          result = {
            command: EMACHINE_COMMAND.SCAN_DOOR,
            doorStatus: data.map(byte => parseInt(byte, 16))
=======
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
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
          };
          this.addLogMessage(`Door feedback: ${JSON.stringify(result.data.doorFeedback)}`);
          break;
        case 0xA3: // Poll Status
<<<<<<< HEAD
=======
          if (data.length !== 9) {
            this.addLogMessage(`Invalid POLL status data length: ${data.length}`);
            result = { command: EMACHINE_COMMAND.READ_EVENTS, status: 0, data: {}, message: 'Invalid POLL status data length', transactionID: 0 };
            break;
          }
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
          const statusData = data.map(byte => parseInt(byte, 16));
          if (statusData.length < 9) {
            this.addLogMessage(this.log, 'Invalid poll status data length');
            return null;
          }
          result = {
            command: EMACHINE_COMMAND.READ_EVENTS,
<<<<<<< HEAD
            status: statusData[0],
            motorNumber: statusData[1] || 0,
            executionResult: statusData[2] || 0,
            dropSuccess: !(statusData[2] & 0x04),
            faultCode: statusData[2] & 0x03,
            maxCurrent: (statusData[3] << 8) | statusData[4],
            avgCurrent: (statusData[5] << 8) | statusData[6],
            runTime: statusData[7] || 0,
            temperature: statusData[8] || 0
=======
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
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
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
<<<<<<< HEAD
          this.machinestatus.data = JSON.stringify(result);
          break;
        case 0xA4:
          if (data.length !== 3) return null;
          result = {
            command: EMACHINE_COMMAND.SET_TEMP,
            mode: parseInt(data[0], 16),
            tempValue: (parseInt(data[1], 16) << 8) | parseInt(data[2], 16) // Single signed temperature value
=======
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
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
          };
          this.addLogMessage(`Temperature set: Mode ${result.data.mode}, Value ${result.data.tempValue}°C`);
          break;
        case 0xA5: // Start Motor
<<<<<<< HEAD
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
=======
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
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
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
<<<<<<< HEAD
    } catch (error) {
      this.addLogMessage(this.log, `Error processing response: ${error.message}`);
      if (this.pendingCommand) {
        this.pendingCommand.reject(error);
        this.pendingCommand = null;
      }
      return null;
=======
    } catch (error: any) {
      this.addLogMessage(`Error processing response: ${error.message}`);
      return { command: '', status: 0, data: {}, message: `Error processing response: ${error.message}`, transactionID: 0 };
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
    }
  }

  private initADH814(): void {
<<<<<<< HEAD
    this.getSerialEvents().subscribe((event) => {
      // Toast.show({ text: `Event: ${event}`, duration: 'long' });

      if (event.event === 'dataReceived') {
        const rawData = event.data;
        this.addLogMessage(this.log, `Raw data: ${rawData}`);
        console.log('ADH814 Received from device:', rawData);

        const r = this.processResponse(rawData);
        this.addLogMessage(this.log, `Processed response: ${JSON.stringify(r)}`, `Response: ${JSON.stringify(r)}`);
=======
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
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
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
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
<<<<<<< HEAD
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
            this.addLogMessage(this.log, 'Shipping control command sent ' + ` for address 0x01 and slot 0`);
          }, 20000);
          resolve(init);
        } else {
          this.addLogMessage(this.log, `Serial port mismatch: Expected ${this.portName}, got ${init}`);
          reject(new Error(`Serial port mismatch: Expected ${this.portName}, got ${init}`));
        }
      } catch (err) {
        this.addLogMessage(this.log, `Initialization failed: ${err.message}`);
=======
        this.addLogMessage(`Setting up device at address 0x${address.toString(16)}`);

        const result = await this.command(EMACHINE_COMMAND.READ_ID, { address }, Date.now());
        this.addLogMessage(`Device ID: ${result?.data?.firmwareVersion}`);

        


        await this.setDefaultTemperature(address);
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
>>>>>>> a071587d288344127b7776a91d5af598c471dcbf
        reject(err);
      }
    });
  }

<<<<<<< HEAD
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
=======

>>>>>>> a071587d288344127b7776a91d5af598c471dcbf

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