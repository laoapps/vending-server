import { Injectable } from '@angular/core';

import { SerialPortListResult } from 'SerialConnectionCapacitor';
import {SerialConnectionCapacitor}  from 'SerialConnectionCapacitor';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded, PrintError, EMessage } from './services/syste.model';
import { SerialServiceService } from './services/serialservice.service';
import { LoggingService } from './logging-service.service';
import { Toast } from '@capacitor/toast';



@Injectable({
  providedIn: 'root'
})
export class ADH814Service implements ISerialService {
  machineId: string = '11111111';
  otp = '111111';
  portName = '/dev/ttyS1';
  baudRate = 9600;
  log: IlogSerial = { data: '', limit: 50 };
  machinestatus = { data: '' };

  constructor(
    private serialService: SerialServiceService,
    private loggingService: LoggingService
  ) {}

  private addLogMessage(message: string, consoleMessage?: string): void {
    addLogMessage(this.log, message, consoleMessage);
    Toast.show({ text: message });
  }

  private initADH814() {
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'adh814Response') {
        const response = event.data;
        this.addLogMessage(`ADH814 response: ${JSON.stringify(response)}`);
        console.log('ADH814 response:', response);

        const result: IResModel = {
          command: this.mapCommand(response.command),
          data: response,
          status: response.error ? 0 : 1,
          message: response.message || `Command 0x${response.command.toString(16).padStart(2, '0')} executed`,
          transactionID: Date.now()
        };

        this.machinestatus.data = JSON.stringify(result);
        if (response.command === 0xA3 && response.status === 0x02) {
          this.addLogMessage(`Delivery ended: Drop ${response.dropSuccess ? 'successful' : 'failed'}${response.faultCode ? `, Fault code: ${response.faultCode}` : ''}`);
          this.commandADH814('A6', { address: response.address }).catch(err => {
            this.addLogMessage(`ACK failed: ${err.message}`);
          });
        }
      } else if (event.event === 'dataReceived') {
        this.addLogMessage(`Raw data: ${event.data}`);
      }
    });
  }

  private mapCommand(command: number): EMACHINE_COMMAND {
    switch (command) {
      case 0xA1: return EMACHINE_COMMAND.RESET;
      case 0xA2: return EMACHINE_COMMAND.SCAN_DOOR;
      case 0xA3: return EMACHINE_COMMAND.READ_EVENTS;
      case 0xA4: return EMACHINE_COMMAND.SET_TEMP;
      case 0xA5: return EMACHINE_COMMAND.shippingcontrol;
      case 0xA6: return EMACHINE_COMMAND.CLEAR_RESULT;
      case 0xB5: return EMACHINE_COMMAND.shippingcontrol;
      case 0x34: return EMACHINE_COMMAND.SET_SWAP;
      case 0x35: return EMACHINE_COMMAND.SET_SWAP;
      case 0x21: return EMACHINE_COMMAND.SET_TWO_WIRE_MODE;
      default: return EMACHINE_COMMAND.RESET;
    }
  }

  async commandADH814(command: string, params: any): Promise<IResModel> {
    return new Promise<IResModel>((resolve, reject) => {
      try {
        const address = params.address || 0x01;
        let response;

        switch (command) {
          case 'A1':
            response = SerialConnectionCapacitor.requestID({ address });
            break;
          case 'A2':
            response = SerialConnectionCapacitor.scanDoorFeedback({ address });
            break;
          case 'A3':
            response = SerialConnectionCapacitor.pollStatus({ address });
            break;
          case 'A4':
            const mode = params.mode || 0x01;
            const tempValue = params.lowTemp || 7;
            if (![0x00, 0x01, 0x02].includes(mode)) throw new Error('Mode must be 0x00-0x02');
            if (tempValue < -127 || tempValue > 127) throw new Error('Temp value must be -127 to 127');
            response = SerialConnectionCapacitor.setTemperature({ address, mode, tempValue });
            break;
          case 'A5':
            const motorNumber = params.slot ? parseInt((params.slot - 1).toString(16), 16) : 0x00;
            if (motorNumber < 0 || motorNumber > 0xFE) throw new Error('Motor number must be 0x00-0xFE');
            response = SerialConnectionCapacitor.startMotor({ address, motorNumber });
            break;
          case 'A6':
            response = SerialConnectionCapacitor.acknowledgeResult({ address });
            break;
          case 'B5':
            const motorNumber1 = params.slot ? parseInt((params.slot - 1).toString(16), 16) : 0x00;
            const motorNumber2 = params.motorNumber2 !== undefined ? params.motorNumber2 : motorNumber1;
            if (motorNumber1 < 0 || motorNumber1 > 0xFE || motorNumber2 < 0 || motorNumber2 > 0xFE) {
              throw new Error('Motor numbers must be 0x00-0xFE');
            }
            response = SerialConnectionCapacitor.startMotorCombined({ address, motorNumber1, motorNumber2 });
            break;
          case '34':
            response = SerialConnectionCapacitor.querySwap({ address });
            break;
          case '35':
            const swapEnabled = params.swapEnabled !== undefined ? params.swapEnabled : 1;
            if (swapEnabled < 0 || swapEnabled > 1) throw new Error('swapEnabled must be 0x00 or 0x01');
            response = SerialConnectionCapacitor.setSwap({ address, swapEnabled });
            break;
          case '21':
            response = SerialConnectionCapacitor.switchToTwoWireMode({ address });
            break;
          default:
            reject(PrintError(EMACHINE_COMMAND.RESET, params, 'Unknown command'));
            return;
        }

        response.then((res: any) => {
          console.log('ADH814 command succeeded:', command, res);
          resolve({
            command: this.mapCommand(parseInt(command, 16)),
            data: res,
            status: 1,
            message: 'Command sent successfully',
            transactionID: Date.now()
          });
        }).catch((e: any) => {
          console.log('ADH814 command failed:', command, e);
          reject(PrintError(this.mapCommand(parseInt(command, 16)), params, e.message));
        });
      } catch (error: any) {
        reject(PrintError(this.mapCommand(parseInt(command, 16)), params, error.message));
      }
    });
  }

  async command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>((resolve, reject) => {
      switch (command) {
        case EMACHINE_COMMAND.RESET:
          this.commandADH814('A1', params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.SCAN_DOOR:
          this.commandADH814('A2', params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.READ_EVENTS:
          this.commandADH814('A3', params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.SET_TEMP:
          this.commandADH814('A4', params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.shippingcontrol:
          this.commandADH814(params.motorNumber2 !== undefined ? 'B5' : 'A5', params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.CLEAR_RESULT:
          this.commandADH814('A6', params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.SET_SWAP:
          this.commandADH814(params.swapEnabled !== undefined ? '35' : '34', params).then(resolve).catch(reject);
          break;
        case EMACHINE_COMMAND.SET_TWO_WIRE_MODE:
          this.commandADH814('21', params).then(resolve).catch(reject);
          break;
        default:
          reject(PrintError(command, params, EMessage.commandnotfound));
      }
    });
  }

  public shipItem(slot = 1, dropSensor = 1): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.command(EMACHINE_COMMAND.shippingcontrol, { slot, dropSensor }, -1);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  checkSum(buff: string[]): string {
    return buff.join('');
  }

  async initializeSerialPort(
    portName: string,
    baudRate: number,
    log: IlogSerial,
    machineId: string,
    otp: string,
    isNative: ESerialPortType = ESerialPortType.Serial
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
        this.loggingService.initializeLogging();
        this.initADH814();

        // Verify device ID
        await this.commandADH814('A1', { address: 0x01 });
        this.addLogMessage('Device ID queried successfully');

        // Set default temperature
        await this.commandADH814('A4', { address: 0x01, mode: 0x01, lowTemp: 7 });
        this.addLogMessage('Default temperature set successfully');

        if (init === this.portName) {
          resolve(init);
        } else {
          reject(new Error(`Serial port initialization failed: Expected ${this.portName}, got ${init}`));
        }
      } catch (err) {
        this.addLogMessage(`Initialization failed: ${err.message}`);
        reject(err);
      }
    });
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  async close(): Promise<void> {
    await this.serialService.close();
    this.addLogMessage('Serial connection closed');
  }

  async listPorts(): Promise<SerialPortListResult> {
    return await this.serialService.listPorts();
  }
}