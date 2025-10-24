import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { addLogMessage, EMACHINE_COMMAND, ESerialPortType, IlogSerial, IResModel, ISerialService, PrintSucceeded } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';

@Injectable({
  providedIn: 'root'
})
export class CCTALKTb74Service implements ISerialService {
  private ccTalk!: CcTalkTB74; // Non-null assertion; initialized in initCctalk
  private totalValue = 0; // Total value in THB
  private machineId = '11111111';
  private portName = '/dev/ttyS0';
  private baudRate = 9600; // Standard ccTalk baud rate
  public log: IlogSerial = { data: '', limit: 50 };
  private otp = '111111';
  private parity: 'none' = 'none';
  private dataBits: 8 = 8;
  private stopBits: 1 = 1;
  machinestatus = { data: '' };

  constructor(private serialService: SerialServiceService) { }

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    console.log(message);
    addLogMessage(log, message, consoleMessage);
  }

  private initCctalk(): void {
    this.addLogMessage(this.log, 'Initializing ccTalk...');
    const sendData = (data: string) => {
      this.addLogMessage(this.log, `Sending data: ${data}`);
      this.serialService.write(data);
    };

    this.ccTalk = new CcTalkTB74(sendData);

    this.ccTalk.on('response', (data) => {
      const [command, response] = data.details!;
      this.addLogMessage(this.log, `Response to ${command}: ${response}`);
    });

    this.ccTalk.on('error', (data) => {
      this.addLogMessage(this.log, `ccTalk error: ${data.details?.join(', ')}`);
    });

    this.getSerialEvents().subscribe({
      next: (event) => {
        this.addLogMessage(this.log, `Event received: ${JSON.stringify(event)}`);
        if (event.event === 'dataReceived') {
          const hexData = event.data;
          this.addLogMessage(this.log, `Raw data: ${hexData}`);
          this.ccTalk.handleData(hexData);
        } else if (event.event === 'serialOpened') {
          this.addLogMessage(this.log, `Serial port opened: ${this.portName}`);
          this.addLogMessage(this.log, 'Starting setupDevice...');
          this.setupDevice().then(
            () => this.addLogMessage(this.log, 'setupDevice completed'),
            (err: Error) => this.addLogMessage(this.log, `Setup failed: ${err.message}`)
          );
        } else {
          this.addLogMessage(this.log, `Unhandled event: ${event.event}`);
        }
      },
      error: (err: Error) => this.addLogMessage(this.log, `Serial error: ${err.message}`)
    });

    // Manual test
    this.addLogMessage(this.log, 'Manual simplePoll test');
    this.ccTalk.simplePoll().then(
      (isAlive) => this.addLogMessage(this.log, `Device alive: ${isAlive}`),
      (err: Error) => this.addLogMessage(this.log, `Poll failed: ${err.message}`)
    );
  }

  private async setupDevice(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.addLogMessage(this.log, 'Starting device setup');
        this.ccTalk.simplePoll()
          .then((isAlive) => {
            this.addLogMessage(this.log, `Simple poll result: ${isAlive}`);
            if (!isAlive) throw new Error('Device not responding');
            return this.ccTalk.requestSerialNumber();
          })
          .then((serialNumber) => {
            this.addLogMessage(this.log, `TB74 setup complete. Serial: ${serialNumber}`);
            return Promise.all([
              this.ccTalk.modifyInhibitStatus(['ff', 'ff']), // Enable all channels
              this.ccTalk.enableAcceptance()
            ]);
          })
          .then(() => resolve())
          .catch((err: Error) => {
            this.addLogMessage(this.log, `Setup error: ${err.message}`);
            reject(err);
          });
      } catch (err) {
        this.addLogMessage(this.log, `Setup error: ${(err as Error).message}`);
        reject(err);
      }
    });
  }

  private parseBillValue(valueCode: string): number {
    const billMap: Record<string, number> = {
      '01': 20,   // 20 THB
      '02': 50,   // 50 THB
      '03': 100,  // 100 THB
      '04': 500,  // 500 THB
      '05': 1000  // 1000 THB
    };
    return billMap[valueCode] ?? 0;
  }

  initializeSerialPort(
    portName: string,
    baudRate: number,
    log: IlogSerial,
    machineId: string,
    otp: string,
    isNative: ESerialPortType
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        this.log = log;
        this.machineId = machineId;
        this.otp = otp;
        this.portName = portName || this.portName;
        this.baudRate = baudRate || this.baudRate;

        this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative)
          .then((init) => {
            if (init === this.portName) {
              this.serialService.startReading();
              this.addLogMessage(this.log, 'Started reading from serial port');
              this.initCctalk();
              resolve(init);
            } else {
              reject(new Error(`Failed to initialize port: ${init}`));
            }
          })
          .catch((err: Error) => reject(err));
      } catch (err) {
        reject(err as Error);
      }
    });
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>((resolve, reject) => {
      try {
        switch (command) {
          case EMACHINE_COMMAND.POLL:
            this.ccTalk.simplePoll()
              .then((isAlive) => {
                if (!isAlive) throw new Error('Device not responding');
                resolve(PrintSucceeded(command, { isAlive, totalValue: this.totalValue }, 'poll', transactionID));
              })
              .catch((err: Error) => reject(new Error(`Poll failed: ${err.message}`)));
            break;
          case EMACHINE_COMMAND.READ_EVENTS:
            this.ccTalk.readBillEvents()
              .then((events) => resolve(PrintSucceeded(command, { events, totalValue: this.totalValue }, 'read events', transactionID)))
              .catch((err: Error) => reject(new Error(`Read events failed: ${err.message}`)));
            break;
          case EMACHINE_COMMAND.RESET:
            this.ccTalk.resetDevice()
              .then(() => {
                this.totalValue = 0;
                resolve(PrintSucceeded(command, {}, 'reset', transactionID));
              })
              .catch((err: Error) => reject(new Error(`Reset failed: ${err.message}`)));
            break;
          case EMACHINE_COMMAND.ACCEPT:
            this.ccTalk.acceptBill()
              .then(() => resolve(PrintSucceeded(command, {}, 'accept bill', transactionID)))
              .catch((err: Error) => reject(new Error(`Accept bill failed: ${err.message}`)));
            break;
          case EMACHINE_COMMAND.REJECT:
            this.ccTalk.rejectBill()
              .then(() => resolve(PrintSucceeded(command, {}, 'reject bill', transactionID)))
              .catch((err: Error) => reject(new Error(`Reject bill failed: ${err.message}`)));
            break;
          default:
            reject(new Error(`Unsupported command: ${command}`));
        }
      } catch (err) {
        reject(err as Error);
      }
    });
  }

  checkSum(data?: any[]): string {
    return data?.join('') ?? '';
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  close(): Promise<void> {
    return this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
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
  private listeners = new Map<CctalkEvent, ListenerCallback[]>();
  private pendingCommands = new Map<string, { resolve: (response: string) => void; reject: (err: Error) => void }>();
  private readonly sendDataCallback: (data: string) => void;

  constructor(
    sendDataCallback: (data: string) => void,
    destAddr = "02", // Typical bill validator address
    srcAddr = "01"   // Host address
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

  private sendCommand(header: string, data: string[] = []): Promise<string> {
    const frame = this.buildFrame(header, data);
    return new Promise((resolve, reject) => {
      this.sendDataCallback(frame);
      this.pendingCommands.set(header, { resolve, reject });
      setTimeout(() => {
        if (this.pendingCommands.has(header)) {
          this.pendingCommands.delete(header);
          reject(new Error(`Command ${header} timed out`));
        }
      }, 2000);
    });
  }

  public handleData(hexData: string): void {
    console.log(`Processing raw data: ${hexData}`);
    this.emit('response', ['raw', hexData]);

    if (hexData.length < 10) {
      this.emit('error', ['Frame too short']);
      return;
    }

    const srcAddr = hexData.slice(0, 2);
    const dataLength = parseInt(hexData.slice(2, 4), 16);
    const destAddr = hexData.slice(4, 6);
    const header = hexData.slice(6, 8);
    const data = hexData.slice(8, -2);
    const checksumReceived = hexData.slice(-2);
    const calculatedChecksum = this.calculateChecksum(hexData.slice(0, -2));

    if (checksumReceived !== calculatedChecksum) {
      this.emit('error', ['Checksum mismatch']);
      const command = this.pendingCommands.get(header);
      if (command) {
        this.pendingCommands.delete(header);
        command.reject(new Error(`Checksum mismatch for command ${header}`));
      }
      return;
    }

    if (srcAddr === this.destAddr && destAddr === this.srcAddr) {
      const command = this.pendingCommands.get(header);
      if (command) {
        this.pendingCommands.delete(header);
        if (header === "00") { // ACK
          command.resolve(hexData);
        } else {
          command.reject(new Error(`Unexpected response header: ${header}`));
        }
        this.emit('response', [header, hexData]);
        return;
      }
    }

    if (header === "e5" && dataLength >= 1) {
      const events = this.parseBillEvents(data);
      events.forEach((event) => this.emit('billEvent', [event]));
    } else {
      this.emit('error', [`Unhandled response header: ${header}`]);
    }
  }

  private calculateChecksum(frame: string): string {
    const matches = frame.match(/.{2}/g);
    if (!matches) return "00";
    const sum = matches.reduce((acc: number, byte) => acc + parseInt(byte, 16), 0);
    return ((256 - (sum % 256)) % 256).toString(16).padStart(2, '0');
  }

  private parseBillEvents(data: string): BillEvent[] {
    const events: BillEvent[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const code = data.slice(i, i + 2);
      const valueCode = data.slice(i + 2, i + 4);
      if (code !== "00") { // Non-idle event
        events.push({ code, value: valueCode });
      }
    }
    return events;
  }

  public async simplePoll(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const response = await this.sendCommand("fe");
        resolve(response.slice(6, 8) === "00"); // ACK
      } catch (err) {
        reject(new Error(`Simple poll failed: ${(err as Error).message}`));
      }
    });

  }

  public async readBillEvents(): Promise<BillEvent[]> {
    return new Promise<BillEvent[]>(async (resolve, reject) => {
      try {
        const response = await this.sendCommand("e5");
        resolve(this.parseBillEvents(response.slice(8, -2)));
      } catch (err) {
        reject(new Error(`Read bill events failed: ${(err as Error).message}`));
      }
    });

  }

  public async resetDevice(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.sendCommand("e4");
        resolve();
      } catch (err) {
        reject(new Error(`Reset device failed: ${(err as Error).message}`));
      }
    });

  }

  public async acceptBill(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.sendCommand("aa");
        resolve();
      } catch (err) {
        reject(new Error(`Accept bill failed: ${(err as Error).message}`));
      }
    });

  }

  public async rejectBill(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.sendCommand("ab");
        resolve();
      } catch (err) {
        reject(new Error(`Reject bill failed: ${(err as Error).message}`));
      }
    });

  }

  public async requestSerialNumber(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const response = await this.sendCommand("f5");
        resolve(response.slice(8, -2));
      } catch (err) {
        reject(new Error(`Request serial number failed: ${(err as Error).message}`));
      }
    });

  }

  public async modifyInhibitStatus(inhibits: string[]): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.sendCommand("e7", inhibits);
        resolve();
      } catch (err) {
        reject(new Error(`Modify inhibit status failed: ${(err as Error).message}`));
      }
    });

  }

  public async enableAcceptance(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.sendCommand("e6");
        resolve();
      } catch (err) {
        reject(new Error(`Enable acceptance failed: ${(err as Error).message}`));
      }
    });

  }

  public async disableAcceptance(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.sendCommand("e8");
        resolve();
      } catch (err) {
        reject( new Error(`Disable acceptance failed: ${(err as Error).message}`));
      }
    });

  }

  public on(event: CctalkEvent, callback: ListenerCallback): void {
    const callbacks = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...callbacks, callback]);
  }

  private emit(event: CctalkEvent, details?: any[]): void {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.forEach(callback => callback({ event, details }));
  }
}