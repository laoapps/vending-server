import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { IResModel, IlogSerial, addLogMessage, ESerialPortType, ILockControlService, EMACHINE_COMMAND } from './services/syste.model';

enum EProtocol1Command {
  FirmwareVersion = 'firmwareVersion',
  Unlock = 'unlock',
  ReadAllStatus = 'readAllStatus',
  OneTouchUnlock = 'oneTouchUnlock',
  LightsOn = 'lightsOn',
  LightsOff = 'lightsOff'
}

@Injectable({
  providedIn: 'root'
})
export class Locker1Service implements ILockControlService {
  machineId: string = '11111111';
  otp = '111111';
  portName = '/dev/ttyS1';
  baudRate = 9600;
  log: IlogSerial;
  boardAddress = '01';

  machinestatus = { data: '' };
  constructor(private serialService: SerialServiceService) { }

  initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, machineId: string, otp: string, isNative = ESerialPortType.Serial): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      this.portName = portName || this.portName;
      this.baudRate = baudRate || this.baudRate;
      this.machineId = machineId || this.machineId;
      this.otp = otp || this.otp;
      this.log = log;
      const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      if (init == this.portName) {
        this.initLocker1();
        resolve(init);
      }
      else reject(init);
    })

  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  close(): Promise<void> {
    return this.serialService.close();
  }

  listPorts() {
    return this.serialService.listPorts();
  }

  public checkSum(data: string[]): string {
    const x = data.join('') + this.serialService.checkSumCRC(data);
    return x;
  }
  initLocker1() {
    return new Promise<IResModel>(async (resolve, reject) => {

      resolve(await this.getFirmwareVersion());
    });
  }
  private async commandLocker1(command: string[], commandType: EProtocol1Command, transactionID = -1): Promise<IResModel> {
    // const frame = command.join('');
    const bcc = this.checkSum(command);
    const fullCommand = command + bcc;
    this.addLogMessage(this.log, `Sending: ${fullCommand}`);

    try {
      await this.serialService.write(fullCommand);
      return { command: commandType, data: fullCommand, message: 'Command sent successfully', status: 1, transactionID };
    } catch (e) {
      throw { command: commandType, data: fullCommand, result: e.message };
    }
  }
  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      switch (command) {
        case EMACHINE_COMMAND.INIT:
          return this.initializeSerialPort(params.portName, params.baudRate, params.log, params.machineId, params.otp, params.isNative);
        case EMACHINE_COMMAND.CLOSE:
          return this.close();
        case EMACHINE_COMMAND.LISTPORTS:
          return this.listPorts();
        case EMACHINE_COMMAND.GETSERIALEVENTS:
          return this.getSerialEvents();
        case EMACHINE_COMMAND.GETFIRMWAREVERSION:
          return this.getFirmwareVersion();
        case EMACHINE_COMMAND.UNLOCK:
          return this.unlock(params.lockAddress);
        case EMACHINE_COMMAND.READALLLOCKSTATUS:
          return this.readAllLockStatus();
        case EMACHINE_COMMAND.ONETOUCHUNLOCK:
          return this.oneTouchUnlock();
        case EMACHINE_COMMAND.LIGHTS:
          return this.lightsOn();
        case EMACHINE_COMMAND.LIGHTSOFF:
          return this.lightsOff();
        default:
          return Promise.reject({ command, message: 'Command not found' });
      }
    });

  }

  async getFirmwareVersion(): Promise<IResModel> {
    const command = ['8A', this.boardAddress, '00', '22'];
    return this.commandLocker1(command, EProtocol1Command.FirmwareVersion);
  }

  async unlock(lockAddress: number): Promise<IResModel> {
    const lockAddrHex = lockAddress.toString(16).padStart(2, '0')?.toUpperCase();
    const command = ['8A', this.boardAddress, lockAddrHex, '11'];
    return this.commandLocker1(command, EProtocol1Command.Unlock);
  }

  async readAllLockStatus(): Promise<IResModel> {
    const command = ['80', this.boardAddress, '00', '33'];
    return this.commandLocker1(command, EProtocol1Command.ReadAllStatus);
  }

  async oneTouchUnlock(): Promise<IResModel> {
    const command = ['84', this.boardAddress, 'FF', '11'];
    return this.commandLocker1(command, EProtocol1Command.OneTouchUnlock);
  }

  async lightsOn(): Promise<IResModel> {
    const command = ['8A', this.boardAddress, 'AA', '11'];
    return this.commandLocker1(command, EProtocol1Command.LightsOn);
  }

  async lightsOff(): Promise<IResModel> {
    const command = ['8A', this.boardAddress, 'BB', '11'];
    return this.commandLocker1(command, EProtocol1Command.LightsOff);
  }

  private addLogMessage(log: IlogSerial, message: string): void {
    addLogMessage(log, message);
  }
}