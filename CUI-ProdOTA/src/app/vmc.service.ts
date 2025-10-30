
import { Injectable } from '@angular/core';
import { SerialServiceService } from './services/serialservice.service';
import { IResModel, ESerialPortType, ISerialService, EMACHINE_COMMAND, ICreditData, PrintSucceeded, PrintError, EMessage, IlogSerial, machineVMCStatus } from './services/syste.model';
import { SerialPortListResult } from 'SerialConnectionCapacitor';
import * as moment from 'moment-timezone';
import { LoggingService } from './logging-service.service';
import { DatabaseService } from './database.service';
import cryptojs, { mode } from 'crypto-js';
import { ApiService } from './services/api.service';
import { App } from '@capacitor/app';
// import { setTimeout } from 'timers';

export enum EVMC_COMMAND {
  POLL = '41',
  ACK = '42',
  SLOT_TEST = '01',
  VEND = '03',
  RESET = '04',
  SHIPPING_CONTROL = '06',
  SLOT_STATUS = '11',
  SET_POLL_INTERVAL = '16',
  MONEY_RECEIVED = '21',
  REPORT_CURRENT_AMOUNT = '23',
  COIN_REPORT = '25',
  REPORT_MONEY = '27',
  ENABLE_BILL_ACCEPTOR = '28',
  MACHINE_STATUS = '51',
  READ_COUNTERS = '61',
  TEMP_CONTROLLER = '7037',
  SYNC = '31',
  ENABLE = '7018',
  DISABLE = '7018',
  SET_POLL = '16',
  COIN_SYSTEM_READ = '7001',
  UNIONPAY_POS = '7017',
  BILL_ACCEPT_MODE = '7019',
  BILL_LOW_CHANGE = '7020',    // Bill low-change settings = '7020',
  CREDIT_MODE = '7023',
  TEMP_MODE = "7028",
  ENABLE_SELECTION = "12",
  LIGHT_CONTROL = "7016"
}


@Injectable({
  providedIn: 'root'
})
export class VmcService implements ISerialService {
  private lastReported23: { hex: string, timestamp: number } | null = null;
  log: IlogSerial = { data: '', limit: 50 };
  machineId: string = '11111111';
  otp = '111111';
  notes = new Array<IBankNote>();
  retryCmd = 5;
  private enable = true;
  private limiter = 100000;
  private balance = 0;
  private lastUpdate = Date.now();
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
    send: (b: string, t: number, c: EMACHINE_COMMAND = EMACHINE_COMMAND.MACHINE_STATUS) => {
      console.log('vmc service send', b, t, c);
      // API TO SEND TO SERVER 
      // create API TO ACCEPT THIS 
      try {

        this.apiservice.updateStatus({ data: b, transactionID: t, command: c }).then(rx => {
          const r = rx.data;

          console.log('vmc service send response', r);
          if (r.command === EMACHINE_COMMAND.CREDIT_NOTE) {
            if (r.transactionID) {
              const x = this.creditPending.find(v => v.transactionID === r.transactionID);
              if (x) {
                this.deleteCredit(x.id);
                this.creditPending = this.creditPending.filter(v => v.transactionID !== r.transactionID);
              }
            } else {
              console.log('vmc service send response falied and retry', r);
              setTimeout(() => {
                this.sock.send(b, t
                  , c);
              }, 5000);
            }
          } else {
            console.log('update machine Status', r);
          }
        })
      } catch (error) {
        console.log('vmc service send error', error);
      }

    },
    machineId: '',
    otp: ''
  };
  offlineMode = true;
  constructor(
    private serialService: SerialServiceService,
    private loggingService: LoggingService,
    private dbService: DatabaseService,
    private apiservice: ApiService
  ) { }

  private addLogMessage(message: string, consoleMessage?: string): void {
    this.log.data += `${message}\n`;
    if (consoleMessage) console.log(consoleMessage);
  }

  command(command: EMACHINE_COMMAND, params: any, transactionID: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      try {
        if(this.serialService.initialized==false){App.exitApp(); return;}
        switch (command) {
          case EMACHINE_COMMAND.shippingcontrol:
            await this.serialService.writeVMC(EVMC_COMMAND.SHIPPING_CONTROL, { slot: params?.slot || 1, dropSensor: params.dropSensor || 1 });
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
          case EMACHINE_COMMAND.SET_TEMP:
            const result = await this.serialService.writeVMC(EVMC_COMMAND.TEMP_CONTROLLER, { lowTemp: params.lowTemp, highTemp: params.highTemp });
            console.log('set temp result', result);
            resolve({ command, data: params, message: 'Command queued', status: 1, transactionID });
            break;
          case EMACHINE_COMMAND.LIGHTS:
            await this.serialService.writeVMC(EVMC_COMMAND.LIGHT_CONTROL, { start: params.start || 3, end: params.end || 2 });
            break;

          case EMACHINE_COMMAND.balance:
            this.balance = params?.balance || 0;
            this.limiter = params?.limiter || 100000;
            this.lastUpdate = Date.now();

            // remove this because we will handle the send function
            // if (params?.confirmCredit) {
            //   const credit = this.creditPending.find(v => v.transactionID === params.transactionID);
            //   if (credit) {
            //     this.deleteCredit(credit.id);
            //     this.creditPending = this.creditPending.filter(v => v.transactionID !== params.transactionID);
            //   }
            // }

            // if (Array.isArray(params?.setting)) {
            //   const setting = params.setting.find(v => v.settingName === 'setting');
            //   if (setting) {
            //     if (setting.lowTemp !== this.setting.lowTemp || setting.highTemp !== this.setting.highTemp) {
            //       this.setting.lowTemp = setting.lowTemp;
            //       this.setting.highTemp = setting.highTemp;
            //       await this.serialService.writeVMC(EVMC_COMMAND.TEMP_CONTROLLER, { lowTemp: setting.lowTemp, highTemp: setting.highTemp });
            //     }
            //     this.setting.allowCashIn = setting.allowCashIn;

            //     const shouldEnable = this.balance < this.limiter && this.setting.allowCashIn;
            //     if (shouldEnable !== this.enable) {
            //       this.enable = shouldEnable;
            //       if (this.enable) {
            //         this.enableCashIn();
            //       } else {
            //         this.disableCashIn();
            //       }
            //       // await this.serialService.writeVMC(shouldEnable ? EVMC_COMMAND.ENABLE : EVMC_COMMAND.DISABLE, { read: !shouldEnable, value: !shouldEnable ? 200 : 0 });
            //     }
            //   }
            // }
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
      try {
        this.machineId = machineId;
        this.otp = otp;
        this.log = log;
        this.portName = portName;
        this.baudRate = baudRate;
        this.sock.machineId = machineId;
        this.sock.otp = otp;
        this.offlineMode = Boolean(localStorage.getItem('offlineMode') ?? 'true');
        const init = await this.serialService.initializeSerialPort(this.portName, this.baudRate, this.log, isNative);
        await this.serialService.startReadingVMC();

        if (init == this.portName) {
          this.vmcInitilize();
          resolve(init);
        }
        else reject(init);
      } catch (error) {
        reject(error);
      }

    });

  }

  getSerialEvents() {
    return this.serialService.getSerialEvents();
  }

  async close(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.T) clearInterval(this.T);
        this.T = null;
        await this.serialService.close();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }



  public async listPorts(): Promise<SerialPortListResult> {
    return this.serialService.listPorts();
  }

  private async vmcInitilize(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.loggingService.initializeLogging();
        this.addLogMessage(`Initializing VMC on ${this.portName} at ${this.baudRate}`);
        this.setupSerialListeners();
        await this.sycnVMC();
        // await this.setPoll(10);
        await this.initializeVMCCommands();
        await this.loadCreditPending();
        this.initBankNotes();
        // check connection and update new status setting from server
        if (!this.offlineMode) {
          this.startPeriodicTasks();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }



  private async initializeVMCCommands(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const commands = [
          { cmd: EVMC_COMMAND.MACHINE_STATUS, params: {} },           // Machine status
          // { cmd: EVMC_COMMAND._7001, params: {} },         // Coin system setting (read)
          // { cmd: EVMC_COMMAND._7017, params: { read: true, enable: 0 } }, // Unionpay/POS (read)
          // { cmd: EVMC_COMMAND._7018, params: { read: true } },     // Bill value accepted (read)
          { cmd: EVMC_COMMAND.BILL_ACCEPT_MODE, params: { read: false, value: 1 } },     // Bill accepting mode (read)
          // { cmd: EVMC_COMMAND._7020, params: { read: true } },     // Bill low-change (read)
          // { cmd: EVMC_COMMAND._7018, params: { read: false, value: 200 } }, // Enable bills
          // { cmd: EVMC_COMMAND._7023, params: { read: true } },     // Credit mode (read)
          // { cmd: EVMC_COMMAND._7023, params: { mode: 0 } }, // Set credit mode to return change
          { cmd: EVMC_COMMAND.TEMP_CONTROLLER, params: { lowTemp: this.setting.lowTemp, highTemp: this.setting.highTemp } }, // Temp controller
          { cmd: EVMC_COMMAND.TEMP_MODE, params: { lowTemp: this.setting.lowTemp } }, // Temp mode
          // { cmd: EVMC_COMMAND._28, params: { mode: 0,value:'ffff' } }     // Enable bills
          { cmd: EVMC_COMMAND.ENABLE_SELECTION, params: { selectionNumber: 0, price: 1 } }
        ];
        // set value slection , but the cash acceptor is flashing need to solve later
        // TODO: check if remove ENABLE_SELECTION will work for old VMC
        // commands.push(
        //   { cmd: EVMC_COMMAND.ENABLE_SELECTION, params: { selectionNumber: 0, price: 1 }} as any
        // )
        for (const x of commands) {
          if (!x) continue
          await this.serialService.writeVMC(x.cmd, x.params);
          this.addLogMessage(`INIT ${JSON.stringify(x)}`);
        }
        resolve();
      } catch (error) {
        this.addLogMessage(`VMC Initialization failed: ${error}`, `VMC Initialization failed: ${error}`);
        reject(error);
      }
    });
  }


  public setTemperature(lowTemp: number = 5, highTemp: number = 10) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.setting.lowTemp = lowTemp;
        this.setting.highTemp = highTemp;
        await this.serialService.writeVMC(EVMC_COMMAND.TEMP_CONTROLLER, { lowTemp, highTemp });
        resolve();
      } catch (error) {
        reject(error);
      }

    });
  }
  public setLights(start: number = 3, end: number = 2) {
    return new Promise<void>(async (resolve, reject) => {
      try {

        await this.serialService.writeVMC(EVMC_COMMAND.LIGHT_CONTROL, { start, end });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  public shipItem(slot = 1, dropSensor = 1) {
    return new Promise<void>(async (resolve, reject) => {
      this.setting.allowCashIn = false;
      this.enable = false;
      await this.serialService.writeVMC(EVMC_COMMAND.SHIPPING_CONTROL, { slot, dropSensor });
      // this.serialService.writeVMC(EVMC_COMMAND.ENABLE, { read:false,value: '0000' });

      resolve();
    });
  }
  public disableCashIn() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.setting.allowCashIn = false;
        this.enable = false;
        await this.serialService.writeVMC(EVMC_COMMAND.DISABLE, { read: false, value: 0 });
        // this.serialService.writeVMC(EVMC_COMMAND.ENABLE, { read:false,value: '0000' });

        resolve();
      } catch (error) {
        reject(error);
      }

    });
  }
  public enableCashIn() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.setting.allowCashIn = true;
        this.enable = true;
        await this.serialService.writeVMC(EVMC_COMMAND.ENABLE, { read: false, value: 200 });
        // this.serialService.writeVMC(EVMC_COMMAND.ENABLE, { read:false,value: 'ffff' });
        resolve();
      } catch (error) {
        reject(error);
      }

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
  private async loadCreditPending(): Promise<ICreditData[]> {
    return new Promise<ICreditData[]>(async (resolve, reject) => {
      try {
        this.creditPending = (await this.loadCredits()) as ICreditData[];
        this.addLogMessage(`Loaded ${this.creditPending.length} pending credits`);
        resolve(this.creditPending);
      } catch (error: any) {
        this.creditPending = [];
        this.addLogMessage(`Error loading credits: ${error.message}`);
        reject(error);
      }
    });
  }


  private startPeriodicTasks(): void {
    this.T = setInterval(() => {
      console.log('check last update ', Date.now(), this.lastUpdate, moment().diff(this.lastUpdate), this.setting?.allowCashIn);

      if (moment().diff(this.lastUpdate) >= 7000 || !this.setting.allowCashIn) {
        if (!this.enable) return;
        this.enable = false;
        // this.serialService.writeVMC(EVMC_COMMAND.DISABLE, { enable: false });
        this.disableCashIn();
      }
      // remove this as we will handle at the send function 
      // if (this.creditPending.length > 0) {
      //   if (this.pendingRetry <= 0) {
      //     const credit = this.creditPending[0];
      //     this.sock.send(credit.data.data, Number(credit.transactionID), EMACHINE_COMMAND.CREDIT_NOTE);
      //     this.pendingRetry = 10;
      //   } else {
      //     this.pendingRetry -= 2;
      //   }
      // }
    }, 2000);
  }

  private setupSerialListeners(): void {
    this.getSerialEvents().subscribe(event => {
      try {
        console.log('vmc service event received: ' + JSON.stringify(event));
        if (event.event === 'dataReceived') {
          //   this.addLogMessage(`Received: ${event.data}`);
          //   this.processVMCResponse(event.data);
        } else if (event.event === 'commandAcknowledged') {
          console.log('Command acknowledged by VMC:', event.data);
        } else if (event.event === 'error') {
          //  this.addLogMessage(`Serial error: ${JSON.stringify(event)}`);
        }
      } catch (error: any) {
        // this.addLogMessage(`Error processing event: ${error.message}`);
      }
    });
  }

  private processVMCResponse(hex: string): void {
    const t = Number('-21' + Date.now());
    if (hex.startsWith('fafb04')) {
      console.log('Dispensing status:', hex);
      const t = Number('-21' + Date.now());
      //FA FB 06 05 A6 01 00 00 3C 99 ==> 3C is 60 slot sent command
      if (hex.substring(10, 12) == '01') {
        console.log('Dispensing');
        // this.sock.send(hex, t, EMACHINE_COMMAND.VMC_DISPENSE)
      };
      if (hex.substring(10, 12) == '02') {
        console.log('Dispensed');
        //  this.sock.send(hex, t, EMACHINE_COMMAND.VMC_DISPENSED) 
      };
      if (hex.substring(10, 12) == '03') {
        console.log('Dispensed failed');
        //  this.sock.send(hex, t, EMACHINE_COMMAND.VMC_DISPENSEFAILED)
      };

      // FA FB 04 04 A3 01 00 3C 9F ==> 3C is 60 slot sent command, 01 = status processing
      // FA FB 04 04 A4 02 00 3C 9B ==> 3C is 60 slot sent command, 02 = status dispensed
      // fa fb 04 04 9e 03 00 3c a0 ==> 3C is 60 slot sent command, 03 = status drop failed

    } else if (hex.startsWith('fafb21')) { // process credit note with bank note value
      const mode = hex.substring(10, 12);
      if (mode === '01') { //fafb21069101 ==> 01 receive
        // banknote receive
        const value = this.getNoteValue(hex);
        const t = Number('-21' + Date.now());
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
          data: { raw: hex, data: hash, t: Date.now(), transactionID: t.toString(), command: EMACHINE_COMMAND.VMC_CREDIT_NOTE },
          transactionID: t.toString(),
          description: ''
        };
        this.creditPending.push(credit);
        this.addOrUpdateCredit(credit);

        // check Hashing 
        const bn = this.initHashBankNotes(this.machineId);
        const note = bn.find(v => v.hash === hash);
        if (!note) {
          console.log('Hash not found', hash);
          return;
        } else {
          /// send to server and need to confirm from server
          // this.sock.send(hash, t, EMACHINE_COMMAND.VMC_CREDIT_NOTE);
        }


      } else if (mode == '08') {//fafb21068308000186a08a
        //bank note swollen
      }
    } else if (hex.startsWith('fafb23')) {

      console.log('receive banknotes 23-----------------------------------------------------------------------------', hex);
    } else if (hex.startsWith('fafb52')) {// status to server and update and local
      //fafb5221b5000000000000000000000000000030303030303030303030aaaaaaaaaaaaaaaac7
      this.machinestatus.data = hex;
      const m = machineVMCStatus(hex);
      // this.sock.send(JSON.stringify(m), t, EMACHINE_COMMAND.VMC_MACHINE_STATUS);
    } else {
      // this.sock.send(hex, t, EMACHINE_COMMAND.VMC_UNKNOWN);
      console.log('Unhandled response:', hex);
    }
  }
  initHashBankNotes(machineId: string) {
    const hashNotes = Array<IHashBankNote>();
    for (let i = 0; i < this.notes.length; i++) {
      const x = JSON.parse(JSON.stringify(this.notes[i])) as IHashBankNote;
      x.hash = cryptojs
        .SHA256(machineId + this.notes[i].value * 100)
        .toString(cryptojs.enc.Hex);
      hashNotes.push(x);
    }
    return hashNotes;
  }
  initBankNotes() {
    this.notes.push({ value: 1000, amount: 0, currency: 'LAK', channel: 1, image: 'lak1000.jpg' });
    this.notes.push({ value: 2000, amount: 0, currency: 'LAK', channel: 2, image: 'lak2000.jpg' });
    this.notes.push({ value: 5000, amount: 0, currency: 'LAK', channel: 3, image: 'lak5000.jpg' });
    this.notes.push({ value: 10000, amount: 0, currency: 'LAK', channel: 4, image: 'lak10000.jpg' });
    this.notes.push({ value: 20000, amount: 0, currency: 'LAK', channel: 5, image: 'lak20000.jpg' });
    this.notes.push({ value: 50000, amount: 0, currency: 'LAK', channel: 6, image: 'lak50000.jpg' });
    this.notes.push({ value: 100000, amount: 0, currency: 'LAK', channel: 7, image: 'lak100000.jpg' });
  }

  private async sycnVMC(): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      try {
        const res = await this.serialService.writeVMC(EVMC_COMMAND.SYNC, {});
        resolve({ command: EMACHINE_COMMAND.SYNC, data: res, message: 'Sync queued', status: 1, transactionID: -31 });
      } catch (error) {
        reject(PrintError(EMACHINE_COMMAND.SYNC, {}, 'Sync failed'));
      }
    });

  }

  private async setPoll(ms: number): Promise<IResModel> {
    return new Promise<IResModel>(async (resolve, reject) => {
      try {
        await this.serialService.writeVMC(EVMC_COMMAND.SET_POLL, { ms: ms || 10 });
        resolve({ command: EMACHINE_COMMAND.SET_POLL, data: { ms }, message: 'Poll set queued', status: 1, transactionID: -16 });
      } catch (error) {
        reject(PrintError(EMACHINE_COMMAND.SET_POLL, { ms }, 'Set poll failed'));
      }
    });
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
export interface IBankNote {
  value: number;
  amount: number;
  currency: string;
  channel: number;
  image: string;
}
export interface IHashBankNote extends IBankNote {
  hash: string;
}


