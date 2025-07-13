import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { IResModel, ESerialPortType, ISerialService, EMACHINE_COMMAND, ICreditData, PrintSucceeded, PrintError, EMessage, IlogSerial } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import * as moment from 'moment-timezone';
import { LoggingService } from './logging-service.service';
import { DatabaseService } from './database.service';
import cryptojs from 'crypto-js';
import { machineVMCStatus, IVMCMachineStatus } from './services/syste.model'
@Injectable({
  providedIn: 'root'
})
export class Vmc2Service implements ISerialService {

  log: IlogSerial = { data: '', limit: 50 };
  machineId: string = '11111111';
  otp = '111111';
  retryCmd = 5;
  private enable = true;
  private limiter = 100000;
  private balance = 0;
  private lastUpdate = moment.now();
  private setting = { settingName: 'setting', allowCashIn: true, allowVending: true, lowTemp: 5, highTemp: 10, light: true };
  private creditPending: ICreditData[] = [];
  private pendingRetry = 10;
  private T: NodeJS.Timeout | null = null;
  portName = '/dev/ttyS0';
  baudRate = 57600;
  parity: 'none' = 'none';
  dataBits: 8 = 8;
  stopBits: 1 = 1;
  machinestatus = { data: '' };
  sock = {
    send: (b: string, t: number, c: EMACHINE_COMMAND = EMACHINE_COMMAND.status) => { console.log('vmc service send', b, t, c); },
    machineId: '',
    otp: ''
  };
  vmcPacketBuilder = new PacketBuilder();
  constructor(private serialService: SerialServiceService,
    private loggingService: LoggingService,
    private dbService: DatabaseService
  ) { }
  private addLogMessage(message: string, consoleMessage?: string): void {
    this.log.data += `${message}\n`;
    if (consoleMessage) console.log(consoleMessage);
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      try {
        switch (command) {
          case EMACHINE_COMMAND.shippingcontrol:
            const p = createParams({ slot: params.slot, elevator: params.elevator ? params.elevator : 0, dropSensor: params.dropSensor ? params.dropSensor : 1 });
            const x = this.vmcPacketBuilder.buildPacketHex(EVMC_COMMAND.SHIPPING_CONTROL, p);
            await this.serialService.write(x);
            resolve({ command, data: params, message: 'Command queued', status: 1, transactionID });
            break;
          case EMACHINE_COMMAND.SYNC:
            await this.sycnVMC();
            resolve({ command, data: params, message: 'Command queued', status: 1, transactionID });
            break;
          case EMACHINE_COMMAND.ENABLE:
            await this.enableCashIn();
            resolve({ command, data: params, message: 'Command queued', status: 1, transactionID });
            break;
          case EMACHINE_COMMAND.DISABLE:
            await this.disableCashIn();
            resolve({ command, data: params, message: 'Command queued', status: 1, transactionID });
            break;
          case EMACHINE_COMMAND.balance:
            this.balance = params?.balance || 0;
            this.limiter = params?.limiter || 100000;
            this.lastUpdate = moment.now();

            if (params?.confirmCredit) {
              const credit = this.creditPending.find(v => v.transactionID === params.transactionID);
              if (credit) {
                this.deleteCredit(credit.id);
                this.creditPending = this.creditPending.filter(v => v.transactionID !== params.transactionID);
              }
            }

            if (Array.isArray(params?.setting)) {
              const setting = params.setting.find(v => v.settingName === 'setting');
              if (setting) {
                if (setting.lowTemp !== this.setting.lowTemp || setting.highTemp !== this.setting.highTemp) {
                  this.setting.lowTemp = setting.lowTemp;
                  this.setting.highTemp = setting.highTemp;
                  const p = createParams({ lowTemp: setting.lowTemp, highTemp: setting.highTemp });
                  const x = this.vmcPacketBuilder.buildPacketHex(EVMC_COMMAND.SHIPPING_CONTROL, p);
                  await this.serialService.write(x);

                }
                this.setting.allowCashIn = setting.allowCashIn;

                const shouldEnable = this.balance < this.limiter && this.setting.allowCashIn;
                if (shouldEnable !== this.enable) {
                  this.enable = shouldEnable;
                  shouldEnable ? this.enableCashIn() : this.disableCashIn();

                }
              }
            }
            resolve(PrintSucceeded(command, params, EMessage.commandsucceeded));
            break;
          case EMACHINE_COMMAND.restart:
            setTimeout(() => this.initializeVMCCommands(), 2000);
            resolve(PrintSucceeded(command, params, 'Restart initiated'));
            break;
          default:
            reject(PrintError(command, params, EMessage.commandnotfound));
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  async initializeSerialPort(portName: string, baudRate: number, log: IlogSerial, machineId: string, otp: string, isNative = ESerialPortType.Serial): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      this.machineId = machineId;
      this.otp = otp;
      this.log = log;
      this.portName = portName;
      this.baudRate = baudRate;
      this.sock.machineId = machineId;
      this.sock.otp = otp;

      const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
      await this.serialService.startReadingVMC();

      if (init == this.portName) {
        this.vmcInitilize();
        resolve(init);
      }
      else reject(init);
    });
  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  async close(): Promise<void> {
    if (this.T) clearInterval(this.T);
    this.T = null;
    await this.serialService.close();
  }

  public async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
  }

  private async vmcInitilize(): Promise<void> {
    this.loggingService.initializeLogging();
    this.addLogMessage(`Initializing VMC on ${this.portName} at ${this.baudRate}`);
    this.setupSerialListeners();
    await this.sycnVMC();
    await this.setPoll(10);
    await this.initializeVMCCommands();
    await this.loadCreditPending();
    this.startPeriodicTasks();
  }

  private async initializeVMCCommands(): Promise<void> {
    const commands = [
      { cmd: EVMC_COMMAND.MACHINE_STATUS, params: {} },           // Machine status
      // { cmd: EVMC_COMMAND._7001, params: {} },         // Coin system setting (read)
      // { cmd: EVMC_COMMAND._7017, params: { read: true, enable: 0 } }, // Unionpay/POS (read)
      // { cmd: EVMC_COMMAND._7018, params: { read: true } },     // Bill value accepted (read)
      { cmd: EVMC_COMMAND.BILL_ACCEPT_MODE, params: { read: false, value: 1 } },     // Bill accepting mode (read)
      // { cmd: EVMC_COMMAND._7020, params: { read: true } },     // Bill low-change (read)
      // { cmd: EVMC_COMMAND._7018, params: { read: false, value: 100 } }, // Enable bills
      // { cmd: EVMC_COMMAND._7023, params: { read: true } },     // Credit mode (read)
      // { cmd: EVMC_COMMAND._7023, params: { mode: 0 } }, // Set credit mode to return change
      { cmd: EVMC_COMMAND.TEMP_CONTROLLER, params: { lowTemp: this.setting.lowTemp, highTemp: this.setting.highTemp } }, // Temp controller
      { cmd: EVMC_COMMAND.TEMP_MODE, params: { lowTemp: this.setting.lowTemp } } // Temp mode
      // { cmd: EVMC_COMMAND._28, params: { mode: 0,value:'ffff' } }     // Enable bills
    ];

    for (let i = 0; i < commands.length; i++) {
      const y = commands[i];
      if (!y) continue;
      const params = createParams(y.params);
      const x = this.vmcPacketBuilder.buildPacketHex(y.cmd, params);
      await this.serialService.write(x);
      this.addLogMessage(`INIT ${JSON.stringify(x)}`);
    }

  }
  public disableCashIn() {
    return new Promise<void>(async (resolve, reject) => {
      this.setting.allowCashIn = false;
      this.enable = false;
      const params = createParams({ read: false, value: 0 });
      const x = this.vmcPacketBuilder.buildPacketHex(EVMC_COMMAND.BILL_VALUE, params);
      await this.serialService.write(x);


      resolve();
    });
  }
  public enableCashIn() {
    return new Promise<void>(async (resolve, reject) => {
      this.setting.allowCashIn = true;
      this.enable = true;
      const params = createParams({ read: false, value: 200 });
      const x = this.vmcPacketBuilder.buildPacketHex(EVMC_COMMAND.BILL_VALUE, params);
      await this.serialService.write(x);
      resolve();
    });

  }
  private getNoteValue(b: string) {
    try {
      return this.hex2dec(b?.substring(12, 20));
    } catch (error) {
      return -1;
    }
  }
  private hex2dec(hex: string) {
    try {
      return parseInt(hex, 16);
    } catch (error) {
      return -1;
    }

  }
  checkSum(data?: any[]) {
    data[data.length - 1] = this.serialService.chk8xor(data);
    return data.join('');
  }
  private async loadCreditPending(): Promise<void> {
    try {
      this.creditPending = (await this.loadCredits()) as ICreditData[];
      this.addLogMessage(`Loaded ${this.creditPending.length} pending credits`);
    } catch (error: any) {
      this.creditPending = [];
      this.addLogMessage(`Error loading credits: ${error.message}`);
    }
  }

  private startPeriodicTasks(): void {
    this.T = setInterval(() => {
      console.log('check last update ', moment.now(), this.lastUpdate, moment().diff(this.lastUpdate), this.setting?.allowCashIn);

      if (moment().diff(this.lastUpdate) >= 7000 || !this.setting.allowCashIn) {
        if (!this.enable) return;
        this.enable = false;
        this.disableCashIn();

      }
      if (this.creditPending.length > 0) {
        if (this.pendingRetry <= 0) {
          const credit = this.creditPending[0];
          this.sock.send(credit.data.data, Number(credit.transactionID), EMACHINE_COMMAND.VMC_CREDIT_NOTE);
          this.pendingRetry = 10;
        } else {
          this.pendingRetry -= 2;
        }
      }
    }, 2000);
  }

  private setupSerialListeners(): void {
    this.getSerialEvents().subscribe(event => {
      try {
        console.log('vmc service event received: ' + JSON.stringify(event));
        if (event.event === 'dataReceived') {
          this.addLogMessage(`Received: ${event.data}`);
          this.processVMCResponse(event.data);
        } else if (event.event === 'commandAcknowledged') {
          console.log('Command acknowledged by VMC:', event.data);
        } else if (event.event === 'error') {
          this.addLogMessage(`Serial error: ${JSON.stringify(event)}`);
        }
      } catch (error: any) {
        this.addLogMessage(`Error processing event: ${error.message}`);
      }
    });
  }

  private processVMCResponse(hex: string): void {
    if (hex.startsWith('fafb04')) {
      this.sock.send(hex, -9);
      console.log('Dispensing status:', hex);
      //FA FB 06 05 A6 01 00 00 3C 99 ==> 3C is 60 slot sent command
      if (hex.substring(10, 12) == '01') console.log('Dispensing');
      if (hex.substring(10, 12) == '02') console.log('Dispensed');
      if (hex.substring(10, 12) == '03') console.log('Drop failed');

      // FA FB 04 04 A3 01 00 3C 9F ==> 3C is 60 slot sent command, 01 = status processing
      // FA FB 04 04 A4 02 00 3C 9B ==> 3C is 60 slot sent command, 02 = status dispensed
      // fa fb 04 04 9e 03 00 3c a0 ==> 3C is 60 slot sent command, 03 = status drop failed

    } else if (hex.startsWith('fafb21')) { // process credit note with bank note value
      console.log('receive banknotes 21', hex);
      const mode = hex.substring(10, 12);
      if (mode === '01') { //fafb21069101 ==> 01 receive
        // banknote receive
        const value = this.getNoteValue(hex);
        const t = Number('-21' + moment.now());
        // fafb2106d501 000186a0 d5 == 100000 == 1000,00
        //               // fafb21069101 000186a0 91 == 100000 == 1000,00
        //               // fafb2106c301 00030d40 aa == 200000 == 2000,00
        //               // fafb21065401 0007a120 f5 == 500000 == 5000,00
        //               // fafb21065701 000f4240 7d == 1000000 == 10000,00
        //               // fafb21064a01 000f4240 60
        //               // fafb21060701 001e8480 3a == 2000000 == 20000,00
        //               // fafb2106bf01 001e8480 82
        //               // fafb21066001 004c4b40 00 == 5000000 == 50000,00
        //               // new 50k not working
        //               // fafb21067c01 00989680 d5 == 10000000 == 100000,00
        //               // new 100k not working
        const hash = cryptojs.SHA256(this.sock.machineId + value).toString(cryptojs.enc.Hex);
        const credit: ICreditData = {
          id: -1,
          name: 'credit',
          data: { raw: hex, data: hash, t: moment.now(), transactionID: t.toString(), command: EMACHINE_COMMAND.VMC_CREDIT_NOTE },
          transactionID: t.toString(),
          description: ''
        };
        this.creditPending.push(credit);
        this.addOrUpdateCredit(credit);
        this.sock.send(hash, t, EMACHINE_COMMAND.VMC_CREDIT_NOTE);

      } else if (mode == '08') {//fafb21068308000186a08a
        //bank note swollen
      }
    } else if (hex.startsWith('fafb23')) {

      console.log('receive banknotes 23-----------------------------------------------------------------------------', hex);
    } else if (hex.startsWith('fafb52')) {// status to server and update and local
      //fafb5221b5000000000000000000000000000030303030303030303030aaaaaaaaaaaaaaaac7
      this.machinestatus.data = hex;
      const m = machineVMCStatus(hex);
      this.sock.send(hex, -52);
    } else {
      this.sock?.send(hex, -3);
      console.log('Unhandled response:', hex);
    }
  }

  private async sycnVMC(): Promise<IResModel> {

    const params = createParams({});
    const x = this.vmcPacketBuilder.buildPacketHex(EVMC_COMMAND.SYNC, params);
    await this.serialService.write(x);
    return { command: EMACHINE_COMMAND.SYNC, data: {}, message: 'Sync queued', status: 1, transactionID: -31 };
  }

  private async setPoll(ms: number): Promise<IResModel> {
    const params = createParams({ ms });
    const x = this.vmcPacketBuilder.buildPacketHex(EVMC_COMMAND.SYNC, params);
    await this.serialService.write(x);
    return { command: EMACHINE_COMMAND.SET_POLL, data: { ms }, message: 'Poll set queued', status: 1, transactionID: -16 };
  }

  async loadCredits() {
    return await this.dbService.getItems();
  }

  async addOrUpdateCredit(data: ICreditData) {
    if (data.id >= 0) {
      await this.dbService.updateItem(data.id, data.name, data.data, data.transactionID, data.description);
    } else {
      await this.dbService.createItem(data.name, data.data, data.transactionID, data.description);
    }
    return await this.loadCredits();
  }

  async deleteCredit(id: number) {
    await this.dbService.deleteItem(id);
    return await this.loadCredits();
  }

  private hexStringToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
  }

}
export enum EVMC_COMMAND {
  // Basic Commands
  POLL = '41',              // Polling command
  ACK = '42',               // Acknowledgment
  SLOT_TEST = '01',         // Slot test
  VEND = '03',              // Vend operation
  RESET = '04',             // Reset command
  SHIPPING_CONTROL = '06',  // Dispense/Shipping control
  SLOT_STATUS = '11',       // Slot status inquiry
  SET_POLL_INTERVAL = '16', // Set poll interval
  SYNC = '31',              // Synchronization
  MACHINE_STATUS = '51',    // Machine status inquiry
  READ_COUNTERS = '61',     // Read counters

  // Report Commands
  COIN_REPORT = '25',       // Coin report
  REPORT_MONEY = '27',      // Report money

  // Configuration Commands
  ENABLE_BILL_ACCEPTOR = '28', // Enable bill acceptor

  // Extended Commands (0x70 prefix)
  COIN_SYSTEM_READ = '7001',   // Coin system settings read
  UNIONPAY_POS = '7017',       // UnionPay/POS settings
  BILL_VALUE = '7018',         // Bill value accepted (enable/disable via params)
  BILL_ACCEPT_MODE = '7019',   // Bill accepting mode
  BILL_LOW_CHANGE = '7020',    // Bill low-change settings
  CREDIT_MODE = '7023',        // Credit mode settings
  TEMP_MODE = '7028',          // Temperature mode
  LIGHT_CONTROL = '7016',      // Light control settings
  TEMP_CONTROLLER = '7037',    // Temperature controller settings
  ENABLE_SELECTION = '12',
  // Placeholder/Unused (if needed)
  RESERVED_21 = '21',          // Unspecified in original
  RESERVED_23 = '23',          // Unspecified in original
}
interface Params {
  getInteger(key: string, defaultValue: number): number;
  getBoolean(key: string, defaultValue: boolean): boolean;
  getString(key: string, defaultValue: string): string;
}

function createParams(obj: Record<string, any>): Params {
  return {
    getInteger: (key: string, defaultValue: number) => Number(obj[key] ?? defaultValue),
    getBoolean: (key: string, defaultValue: boolean) => Boolean(obj[key] ?? defaultValue),
    getString: (key: string, defaultValue: string) => String(obj[key] ?? defaultValue),
  };
}

class PacketBuilder {
  private static readonly TAG = "PacketBuilder";
  private packNoCounter = 0;
  private commandQueue: any[] = []; // Adjust type if needed

  private getNextPackNo(): number {
    this.packNoCounter = (this.packNoCounter + 1) & 0xFF;
    return this.packNoCounter;
  }

  private clampToByte(value: number): number {
    return Math.max(-128, Math.min(127, value)) & 0xFF;
  }

  private hexStringToByteArray(hex: string): number[] {
    const result: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      result.push(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  }

  private calculateXOR(data: number[], length: number): number {
    let xor = 0;
    for (let i = 0; i < length; i++) {
      xor ^= data[i];
    }
    return xor;
  }

  private bytesToHex(bytes: number[], length: number): string {
    return Array.from(bytes.slice(0, length))
      .map(b => b.toString(16).padStart(2, "0")?.toUpperCase())
      .join(" ");
  }

  public buildPacket(command: EVMC_COMMAND, params: Params): number[] {
    const stx = [0xFA, 0xFB];
    let cmdByte = parseInt(command.length > 2 ? command.substring(2) : command, 16);
    const packNo = this.getNextPackNo();
    let text: number[];

    console.log(`${PacketBuilder.TAG}: Input command ${command}`);

    switch (command) {
      case EVMC_COMMAND.SLOT_TEST:
        text = [this.clampToByte(params.getInteger("slot", 1))];
        break;
      case EVMC_COMMAND.SYNC:
        cmdByte = 0x31;
        this.commandQueue.length = 0;
        this.packNoCounter = 0;
        console.log(`${PacketBuilder.TAG}: Queue cleared and PackNO reset on sync command`);
        text = [packNo];
        break;
      case EVMC_COMMAND.SHIPPING_CONTROL:
        cmdByte = 0x06;
        const slot = this.clampToByte(params.getInteger("slot", 1));
        const elevator = this.clampToByte(params.getInteger("elevator", 0));
        const dropSensor = this.clampToByte(params.getInteger("dropSensor", 1));
        text = [packNo, dropSensor, elevator, 0x00, slot];
        break;
      case EVMC_COMMAND.ENABLE_SELECTION:
        cmdByte = 0x12;
        const selectionNumber = this.clampToByte(params.getInteger("selectionNumber", 0));
        const price = this.clampToByte(params.getInteger("price", 1));
        text = [packNo,
          selectionNumber & 0xFF,
          (selectionNumber >> 8) & 0xFF,
          price & 0xFF,
          (price >> 8) & 0xFF,
          (price >> 16) & 0xFF,
          (price >> 24) & 0xFF];
        break;
      case EVMC_COMMAND.SLOT_STATUS:
        cmdByte = 0x11;
        text = [packNo, this.clampToByte(params.getInteger("slot", 1))];
        break;
      case EVMC_COMMAND.SET_POLL_INTERVAL:
        cmdByte = 0x16;
        text = [packNo, this.clampToByte(params.getInteger("ms", 10))];
        break;
      case EVMC_COMMAND.COIN_REPORT:
        cmdByte = 0x25;
        text = [packNo, 0, 0, 0, this.clampToByte(params.getInteger("amount", 0))];
        break;
      case EVMC_COMMAND.MACHINE_STATUS:
        cmdByte = 0x51;
        text = [packNo];
        break;
      case EVMC_COMMAND.READ_COUNTERS:
        cmdByte = 0x61;
        text = [packNo];
        break;
      case EVMC_COMMAND.COIN_SYSTEM_READ:
        cmdByte = 0x70;
        text = [packNo, 0x01, 0x00, 0x00];
        break;
      case EVMC_COMMAND.UNIONPAY_POS:
        cmdByte = 0x70;
        const read1 = params.getBoolean("read", true);
        text = read1
          ? [packNo, 0x17, 0x00]
          : [packNo, 0x17, 0x01, this.clampToByte(params.getInteger("enable", 0))];
        break;
      case EVMC_COMMAND.BILL_VALUE:
        cmdByte = 0x70;
        const read = params.getBoolean("read", true);
        text = read
          ? [packNo, 0x18, 0x00]
          : [packNo, 0x18, 0x01, this.clampToByte(params.getInteger("value", 200))];
        break;
      case EVMC_COMMAND.BILL_ACCEPT_MODE:
        cmdByte = 0x70;
        const read2 = params.getBoolean("read", true);
        text = read2
          ? [packNo, 0x19, 0x00]
          : [packNo, 0x19, 0x01, this.clampToByte(params.getInteger("value", 1))];
        break;
      case EVMC_COMMAND.BILL_LOW_CHANGE:
        cmdByte = 0x70;
        const read3 = params.getBoolean("read", true);
        text = read3
          ? [packNo, 0x20, 0x00]
          : [packNo, 0x20, 0x01, this.clampToByte(params.getInteger("enable", 100))];
        break;
      case EVMC_COMMAND.CREDIT_MODE:
        cmdByte = 0x70;
        const mode3 = this.clampToByte(params.getInteger("mode", 0));
        text = mode3 === 0x00
          ? [packNo, 0x23, mode3]
          : [packNo, 0x23, 0x01, mode3];
        break;
      case EVMC_COMMAND.TEMP_MODE:
        cmdByte = 0x70;
        text = [packNo, 0x28, 0x01, 0x00, 0x02, this.clampToByte(params.getInteger("lowTemp", 5))];
        break;
      case EVMC_COMMAND.LIGHT_CONTROL:
        cmdByte = 0x70;
        text = [
          packNo, 0x16, 0x01,
          this.clampToByte(params.getInteger("start", 15)),
          this.clampToByte(params.getInteger("end", 10)),
        ];
        break;
      case EVMC_COMMAND.TEMP_CONTROLLER:
        cmdByte = 0x70;
        text = [
          packNo, 0x37, 0x01, 0x00,
          this.clampToByte(params.getInteger("lowTemp", 5)),
          this.clampToByte(params.getInteger("highTemp", 10)),
          0x05, 0x00, 0x00, 0x01, 0x0A, 0x00,
        ];
        break;
      case EVMC_COMMAND.REPORT_MONEY:
        cmdByte = 0x27;
        const mode = this.clampToByte(params.getInteger("mode", 8));
        const amountHex = params.getString("amount", "00000000");
        const amount = this.hexStringToByteArray(amountHex);
        text = [packNo, mode, amount[0], amount[1], amount[2], amount[3]];
        break;
      case EVMC_COMMAND.ENABLE_BILL_ACCEPTOR:
        cmdByte = 0x28;
        const mode4 = this.clampToByte(params.getInteger("mode", 0));
        const value4 = parseInt(params.getString("value", "ffff"), 16);
        text = [packNo, mode4, value4];
        break;
      default:
        text = [];
        console.warn(`${PacketBuilder.TAG}: Unsupported command: ${command}, params: ${JSON.stringify(params)}`);
    }

    const length = text.length;
    const data = new Array<number>(stx.length + 2 + text.length + 1).fill(0);
    stx.forEach((val, idx) => data[idx] = val); // STX: 0xFA, 0xFB
    data[2] = cmdByte; // Command byte
    data[3] = length;  // Length of text
    data[4] = 0x00;    // Protocol-required byte
    text.forEach((val, idx) => data[4 + idx] = val); // Copy text
    data[data.length - 1] = this.calculateXOR(data, data.length - 1); // XOR checksum

    console.log(`${PacketBuilder.TAG}: Built packet: ${this.bytesToHex(data, data.length)}`);
    return data;
  }
  // Public method to get hex string from packet
  public buildPacketHex(command: EVMC_COMMAND, params: Params): string {
    const packet = this.buildPacket(command, params);
    return this.toHexString(packet, packet.length);
  }
  private toHexString(bytes: number[], length: number): string {
    return Array.from(bytes.slice(0, length))
      .map(b => b.toString(16).padStart(2, "0").toLowerCase())
      .join("");
  }
}
