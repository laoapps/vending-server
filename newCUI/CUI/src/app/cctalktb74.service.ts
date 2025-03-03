import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import { Buffer } from 'buffer';

@Injectable({
  providedIn: 'root'
})
export class CCTALKTb74Service implements ISerialService {
  private ccTalk: CcTalkTB74;
  private T: NodeJS.Timeout;

  // Configuration properties
  pulseCount = 0; // Legacy from pulse mode, unused in ccTalk
  lastPulseTime = Date.now();
  pulsesPerBill = 15; // Unused in ccTalk mode
  totalValue = 0; // Total value in your currency
  pulseTimeout = 1000; // Unused in ccTalk
  machineId = '11111111';
  portName = '/dev/ttyS0';
  baudRate = 9600;
  log: IlogSerial = { data: '' };
  otp = '111111';
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;

  constructor(private serialService: SerialServiceService) {}

  // Initialize ccTalk and set up event listeners
  private initCctalk(): void {
    // Callback to send data via SerialServiceService
    const sendData = (data: string) => {
      if(this.log)
      this.log.data += `Sending data: ${data}\n`;
      this.serialService.write(data); // Assuming writeSerial accepts Buffer
    };

    this.ccTalk = new CcTalkTB74(sendData);

    // Listen for ccTalk events
    this.ccTalk.on('billEvent', (data) => {
      const event = data.details![0] as BillEvent;
      this.log.data += `Bill Event - Code: ${event.code}, Value: ${event.value}\n`;
      this.totalValue += this.parseBillValue(event.value); // Update total value
      console.log(`Bill accepted: ${event.value}, Total: ${this.totalValue}`);
    });

    this.ccTalk.on('response', (data) => {
      const [command, response] = data.details!;
      this.log.data += `Response to ${command}: ${response}\n`;
      console.log(`Response to ${command}: ${response}`);
    });

    this.ccTalk.on('error', (data) => {
      this.log.data += `Error: ${data.details![0]}\n`;
      console.error('ccTalk Error:', data.details![0]);
    });

    // Subscribe to serial events from SerialServiceService
    this.getSerialEvents().subscribe((event) => {
      if (event.event === 'dataReceived') {
        const hexData = Buffer.from(event.data as any).toString('hex'); // Convert data to hex string
        this.log.data += `Raw data: ${hexData}\n`;
        this.ccTalk.handleData(hexData); // Process incoming data
      }
    });
  }

  // Parse bill value to number (for totalValue)
  private parseBillValue(value: string): number {
    const match = value.match(/(\d+)/); // Extract number from "10 PHP", etc.
    return match ? parseInt(match[0], 10) : 0;
  }

  // Initialize serial port and ccTalk
  initializeSerialPort(
    portName: string,
    baudRate: number,
    log: IlogSerial,
    machineId: string,
    otp: string,
    isNative: ESerialPortType
  ): Promise<void> {
    this.machineId = machineId;
    this.otp = otp;
    this.portName = portName || this.portName;
    this.baudRate = baudRate || this.baudRate;
    this.log = log ;

    return this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative)
      .then(() => {
        this.initCctalk();
      });
  }

  // Execute machine commands
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
    return data ? data.join('') : ''; // Simple concatenation, adjust if needed
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
// Interface for bill event data
interface BillEvent {
  code: string; // Hex event code (e.g., "01")
  value: string; // Decoded bill value (e.g., "10 PHP")
}

// Events emitted by the class
type CctalkEvent = 'billEvent' | 'response' | 'error';

type ListenerCallback = (data: { event: CctalkEvent; details?: any[] }) => void;

class CcTalkTB74 {
  private readonly destAddr: string; // Hex string (e.g., "02")
  private readonly srcAddr: string; // Hex string (e.g., "01")
  private listeners: Map<CctalkEvent, ListenerCallback[]> = new Map();
  private pendingCommands: Map<string, (response: string) => void> = new Map();
  private sendDataCallback: (data: string) => void;

  constructor(
    sendDataCallback: (data: string) => void, // Callback to send data via service
    destAddr: string = "02",
    srcAddr: string = "01"
  ) {
    this.sendDataCallback = sendDataCallback;
    this.destAddr = destAddr.padStart(2, '0');
    this.srcAddr = srcAddr.padStart(2, '0');
  }

  // Build ccTalk frame as hex string
  private buildFrame(header: string, data: string[] = []): string {
    const dataLength = data.length.toString(16).padStart(2, '0');
    const frame = [this.destAddr, dataLength, this.srcAddr, header.padStart(2, '0'), ...data];
    const sum = frame.reduce((acc, byte) => acc + parseInt(byte, 16), 0);
    const checksum = ((256 - (sum % 256)) % 256).toString(16).padStart(2, '0');
    return frame.join('') + checksum;
  }

  // Send command and wait for response
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

  // Process incoming data (called by service)
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

  // ccTalk Commands
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
      return Buffer.from(response.slice(8, -2), 'hex').toString('ascii');
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

  // Event listener methods
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
// Usage example in Angular component
/*
import { Component, OnInit } from '@angular/core';
import { CCTALKTb74Service } from './cctalk-tb74.service';

@Component({
  selector: 'app-root',
  template: `<div>{{ log }}</div>`,
})
export class AppComponent implements OnInit {
  log: string = '';

  constructor(private cctalkService: CCTALKTb74Service) {}

  ngOnInit() {
    this.cctalkService.initializeSerialPort('/dev/ttyS0', 9600, { data: '' }, '11111111', '111111', ESerialPortType.NATIVE)
      .then(() => {
        this.cctalkService.getSerialEvents().subscribe((event) => {
          this.log = this.cctalkService.log.data;
        });
        // Example command
        this.cctalkService.command(EMACHINE_COMMAND.POLL, {}, 1)
          .then((res) => console.log('Poll result:', res));
      })
      .catch((err) => console.error('Init error:', err));
  }
}
*/