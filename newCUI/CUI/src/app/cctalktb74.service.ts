import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import * as moment from 'moment'; // Add moment import

@Injectable({
  providedIn: 'root'
})
export class CCTALKTb74Service implements ISerialService {
  private ccTalk: CcTalkTB74;
  private T: NodeJS.Timeout;

  pulseCount = 0;
  lastPulseTime = Date.now();
  pulsesPerBill = 15;
  totalValue = 0;
  pulseTimeout = 1000;
  machineId = '11111111';
  portName = '/dev/ttyS0';
  baudRate = 9600;
  log: IlogSerial = { data: '', limit: 50 };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;

  constructor(private serialService: SerialServiceService) {}

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }

  private initCctalk(): void {
    const sendData = (data: string) => {
      this.addLogMessage(this.log, `Sending data: ${data}`);
      this.serialService.write(data);
    };

    this.ccTalk = new CcTalkTB74(sendData);

    this.ccTalk.on('billEvent', (data) => {
      const event = data.details![0] as BillEvent;
      this.addLogMessage(this.log, `Bill Event - Code: ${event.code}, Value: ${event.value}`);
      this.totalValue += this.parseBillValue(event.value);
      console.log(`Bill accepted: ${event.value}, Total: ${this.totalValue}`);
    });

    this.ccTalk.on('response', (data) => {
      const [command, response] = data.details!;
      this.addLogMessage(this.log, `Response to ${command}: ${response}`);
      console.log(`Response to ${command}: ${response}`);
    });

    this.ccTalk.on('error', (data) => {
      this.addLogMessage(this.log, `Error: ${data.details![0]}`);
      console.error('ccTalk Error:', data.details![0]);
    });

    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = event.data;
        this.addLogMessage(this.log, `Raw data: ${hexData}`);
        this.ccTalk.handleData(hexData);
      }
    });
  }

  private parseBillValue(value: string): number {
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
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
      if (this.T) clearInterval(this.T);
      this.log = log;
      this.machineId = machineId;
      this.otp = otp;
      this.portName = portName || this.portName;
      this.baudRate = baudRate || this.baudRate;

      const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      if (init === this.portName) {
        this.initCctalk();
        resolve(init);
      } else {
        reject(init);
      }
    });
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      try {
        switch (command) {
          case EMACHINE_COMMAND.POLL:
            const isAlive = await this.ccTalk.simplePoll();
            resolve(PrintSucceeded(command, { isAlive }, 'poll'));
            break;
          case EMACHINE_COMMAND.READ_EVENTS:
            const events = await this.ccTalk.readBillEvents();
            resolve(PrintSucceeded(command, { events }, 'read events'));
            break;
          case EMACHINE_COMMAND.RESET:
            await this.ccTalk.resetDevice();
            resolve(PrintSucceeded(command, {}, 'reset'));
            break;
          case EMACHINE_COMMAND.ACCEPT:
            await this.ccTalk.acceptBill();
            resolve(PrintSucceeded(command, {}, 'accept bill'));
            break;
          default:
            resolve(PrintSucceeded(command, params, 'unknown command'));
        }
      } catch (err) {
        reject(err);
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
    if (this.T) clearInterval(this.T);
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return await this.serialService.listPorts();
  }
}

interface BillEvent {
  code: string;
  value: string;
}

type CctalkEvent = 'billEvent' | 'response' | 'error';

type ListenerCallback = (data: { event: CctalkEvent; details?: any[] }) => void;

class CcTalkTB74 {
  private readonly destAddr: string;
  private readonly srcAddr: string;
  private listeners: Map<CctalkEvent, ListenerCallback[]> = new Map();
  private pendingCommands: Map<string, (response: string) => void> = new Map();
  private sendDataCallback: (data: string) => void;

  constructor(
    sendDataCallback: (data: string) => void,
    destAddr: string = "02",
    srcAddr: string = "01"
  ) {
    this.sendDataCallback = sendDataCallback;
    this.destAddr = destAddr.padStart(2, '0');
    this.srcAddr = srcAddr.padStart(2, '0');
  }

  private buildFrame(header: string, data: string[] = []): string {
    const dataLength = data.length.toString(16).padStart(2, '0');
    const frame = [this.destAddr, dataLength, this.srcAddr, header.padStart(2, '0'), ...data];
    const sum = frame.reduce((acc, byte) => acc + parseInt(byte, 16), 0);
    const checksum = ((256 - (sum % 256)) % 256).toString(16).padStart(2, '0');
    return frame.join('') + checksum;
  }

  private async sendCommand(header: string, data: string[] = []): Promise<string> {
    const frame = this.buildFrame(header, data);
    return new Promise((resolve, reject) => {
      this.sendDataCallback(frame);
      console.log(`Sent: ${frame}`);

      this.pendingCommands.set(header, resolve);
      setTimeout(() => {
        this.pendingCommands.delete(header);
        reject(new Error(`Command ${header} timeout`));
      }, 2000);
    });
  }

  public handleData(hexData: string): void {
    const srcAddr = hexData.slice(0, 2);
    const dataLength = parseInt(hexData.slice(2, 4), 16);
    const destAddr = hexData.slice(4, 6);
    const header = hexData.slice(6, 8);

    if (srcAddr === this.destAddr && destAddr === this.srcAddr) {
      const resolver = this.pendingCommands.get(header);
      if (resolver) {
        this.pendingCommands.delete(header);
        resolver(hexData);
        this.emit('response', [header, hexData]);
        return;
      }
    }

    if (header === "e5" && dataLength >= 1) {
      const events = this.parseBillEvents(hexData);
      events.forEach((event) => this.emit('billEvent', [event]));
    }
  }

  private parseBillEvents(response: string): BillEvent[] {
    const events: BillEvent[] = [];
    if (response.length >= 10) {
      for (let i = 8; i < response.length - 2; i += 4) {
        const code = response.slice(i, i + 2);
        const valueCode = response.slice(i + 2, i + 4);
        if (code !== "00") {
          events.push({ code, value: this.decodeBillValue(valueCode) });
        }
      }
    }
    return events;
  }

  public async simplePoll(): Promise<boolean> {
    const response = await this.sendCommand("fe");
    return response.slice(6, 8) === "00";
  }

  public async readBillEvents(): Promise<BillEvent[]> {
    const response = await this.sendCommand("e5");
    return this.parseBillEvents(response);
  }

  public async resetDevice(): Promise<void> {
    await this.sendCommand("e4");
  }

  public async acceptBill(): Promise<void> {
    await this.sendCommand("aa");
  }

  public async requestBillId(): Promise<string> {
    const response = await this.sendCommand("e3");
    if (response.length > 10) {
      return response.slice(8, -2);
    }
    return "Unknown";
  }

  private decodeBillValue(code: string): string {
    const billMap: { [key: string]: string } = {
      "01": "1000 LAK",
      "02": "2000 LAK",
      "03": "5000 LAK",
      "0a": "10000 LAK",
      "14": "20000 LAK",
    };
    return billMap[code] || `Unknown (${code})`;
  }

  public on(event: CctalkEvent, callback: ListenerCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: CctalkEvent, details?: any[]): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      callback({ event, details });
    }
  }
}