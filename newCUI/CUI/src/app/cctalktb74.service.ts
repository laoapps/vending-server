import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';

@Injectable({
  providedIn: 'root'
})
export class CCTALKTb74Service implements ISerialService {
  private ccTalk: CcTalkTB74;
  private totalValue = 0; // Total value in THB
  private machineId = '11111111';
  private portName = '/dev/ttyS0';
  private baudRate = 9600; // Standard ccTalk baud rate
  public log: IlogSerial = { data: '', limit: 50 };
  private otp = '111111';
  private parity: 'none' = 'none';
  private dataBits: 8 = 8;
  private stopBits: 1 = 1;
  machinestatus = {data:''};
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

    // Event listeners
    this.ccTalk.on('billEvent', (data) => {
      const event = data.details![0] as BillEvent;
      if (event.code === '01') { // Assuming '01' is bill accepted event
        const value = this.parseBillValue(event.value);
        this.totalValue += value;
        this.addLogMessage(this.log, `Bill accepted: ${value} THB. Total: ${this.totalValue} THB`);
      } else {
        this.addLogMessage(this.log, `Bill Event - Code: ${event.code}, Value: ${event.value}`);
      }
    });

    this.ccTalk.on('response', (data) => {
      const [command, response] = data.details!;
      this.addLogMessage(this.log, `Response to command ${command}: ${response}`);
    });

    this.ccTalk.on('error', (data) => {
      this.addLogMessage(this.log, `Error: ${data.details![0]}`);
    });

    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = event.data;
        this.addLogMessage(this.log, `Raw data: ${hexData}`);
        this.ccTalk.handleData(hexData);
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
      await this.ccTalk.simplePoll(); // Check if device is alive
      await this.ccTalk.requestSerialNumber(); // Get serial number for logging
      await this.ccTalk.modifyInhibitStatus(['ff', 'ff']); // Enable all channels (adjust as needed)
      await this.ccTalk.enableAcceptance(); // Enable bill acceptance
      this.addLogMessage(this.log, 'TB74 setup complete');
      return new Promise((resolve) => resolve());
    } catch (err) {
      this.addLogMessage(this.log, `Setup error: ${err.message}`);
      return new Promise((resolve, reject) => reject(err));
    }
  }

  private parseBillValue(valueCode: string): number {
    // Example mapping for THB; adjust based on actual TB74 configuration
    const billMap: { [key: string]: number } = {
      '01': 20,   // 20 THB
      '02': 50,   // 50 THB
      '03': 100,  // 100 THB
      '04': 500,  // 500 THB
      '05': 1000  // 1000 THB
    };
    return billMap[valueCode] || 0;
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
      this.log = log;
      this.machineId = machineId;
      this.otp = otp;
      this.portName = portName || this.portName;
      this.baudRate = baudRate || this.baudRate;

      const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      this.serialService.startReading();

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
            resolve(PrintSucceeded(command, { isAlive, totalValue: this.totalValue }, 'poll'));
            break;
          case EMACHINE_COMMAND.READ_EVENTS:
            const events = await this.ccTalk.readBillEvents();
            resolve(PrintSucceeded(command, { events, totalValue: this.totalValue }, 'read events'));
            break;
          case EMACHINE_COMMAND.RESET:
            await this.ccTalk.resetDevice();
            this.totalValue = 0;
            resolve(PrintSucceeded(command, {}, 'reset'));
            break;
          case EMACHINE_COMMAND.ACCEPT:
            await this.ccTalk.acceptBill();
            resolve(PrintSucceeded(command, {}, 'accept bill'));
            break;
          case EMACHINE_COMMAND.REJECT:
            await this.ccTalk.rejectBill();
            resolve(PrintSucceeded(command, {}, 'reject bill'));
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
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return  this.serialService.listPorts();
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
    destAddr: string = "02", // Typical bill validator address
    srcAddr: string = "01"  // Host address
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
      this.pendingCommands.set(header, resolve);
      setTimeout(() => {
        if (this.pendingCommands.has(header)) {
          this.pendingCommands.delete(header);
          reject(new Error(`Command ${header} timeout`));
        }
      }, 2000); // 2-second timeout
    });
  }

  public handleData(hexData: string): void {
    if (hexData.length < 10) return; // Minimum ccTalk frame length

    const srcAddr = hexData.slice(0, 2);
    const dataLength = parseInt(hexData.slice(2, 4), 16);
    const destAddr = hexData.slice(4, 6);
    const header = hexData.slice(6, 8);
    const data = hexData.slice(8, -2);
    const checksumReceived = hexData.slice(-2);
    const calculatedChecksum = this.calculateChecksum(hexData.slice(0, -2));

    if (checksumReceived !== calculatedChecksum) {
      this.emit('error', ['Checksum mismatch']);
      return;
    }

    if (srcAddr === this.destAddr && destAddr === this.srcAddr) {
      const resolver = this.pendingCommands.get(header);
      if (resolver) {
        this.pendingCommands.delete(header);
        resolver(hexData);
        this.emit('response', [header, hexData]);
        return;
      }
    }

    if (header === "e5" && dataLength >= 1) { // Read buffered bill events
      const events = this.parseBillEvents(hexData);
      events.forEach((event) => this.emit('billEvent', [event]));
    }
  }

  private calculateChecksum(frame: string): string {
    const sum = frame.match(/.{2}/g)!.reduce((acc, byte) => acc + parseInt(byte, 16), 0);
    return ((256 - (sum % 256)) % 256).toString(16).padStart(2, '0');
  }

  private parseBillEvents(response: string): BillEvent[] {
    const events: BillEvent[] = [];
    const data = response.slice(8, -2);
    for (let i = 0; i < data.length; i += 4) {
      const code = data.slice(i, i + 2);
      const valueCode = data.slice(i + 2, i + 4);
      if (code !== "00") { // Non-idle event
        events.push({ code, value: valueCode });
      }
    }
    return events;
  }

  // ccTalk Commands
  public async simplePoll(): Promise<boolean> {
    const response = await this.sendCommand("fe"); // Simple poll
    return new Promise((resolve) => {
      resolve(response.slice(6, 8) === "00"); // ACK
    });
  } 

  public async readBillEvents(): Promise<BillEvent[]> {
    const response = await this.sendCommand("e5"); // Read buffered bill
    return this.parseBillEvents(response);
  }

  public async resetDevice(): Promise<string> {
    return  this.sendCommand("e4"); // Reset device
  }

  public async acceptBill(): Promise<string> {
    return this.sendCommand("aa"); // Accept bill (vendor-specific, verify with TB74 docs)
  }

  public async rejectBill(): Promise<string> {
    return  this.sendCommand("ab"); // Reject bill (vendor-specific, verify with TB74 docs)
  }

  public async requestSerialNumber(): Promise<string> {
    const response = await this.sendCommand("f5"); // Request serial number
    return new Promise((resolve) => {
      resolve(response.slice(8, -2)); // Return serial number as hex string
    });
  }

  public async modifyInhibitStatus(inhibits: string[]): Promise<string> {
    return  this.sendCommand("e7", inhibits); // Modify inhibit status (2 bytes for 16 channels)
  }

  public async enableAcceptance(): Promise<string> {
    return  this.sendCommand("e6"); // Enable acceptance
  }

  public async disableAcceptance(): Promise<string> {
    return this.sendCommand("e8"); // Disable acceptance
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