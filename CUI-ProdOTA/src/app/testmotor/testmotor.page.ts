import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { VendingIndexServiceService } from '../vending-index-service.service'
import { ISerialService, EMACHINE_COMMAND, ESerialPortType, IlogSerial, ICreditData, addLogMessage, EVMC_COMMAND } from '../services/syste.model'
import { Toast } from '@capacitor/toast';
// import {SerialConnectionCapacitor} from 'SerialConnectionCapacitor';
import { SerialServiceService } from '../services/serialservice.service';
import moment from 'moment-timezone';
import CryptoJS from 'crypto-js';
import { BlockchainDbService } from '../blockchain-db';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-testmotor',
  templateUrl: './testmotor.page.html',
  styleUrls: ['./testmotor.page.scss'],
})

export class TestmotorPage implements OnInit, OnDestroy {
  t: any;
  vlog = { log: { data: '', limit: 50 } as IlogSerial };
  @Input() serial: ISerialService = undefined as unknown as ISerialService;

  slot = 1;
  //val='011020010002040A010000';//011000010002040A010094F8'
  val = '0110200100020410010000'; //with checksum 0110200100020410010100ff32
  // val = 'fafb420000';//with checksum fafb420043
  sendingDate = { data: '' };
  datachecksum = ''
  machineId = localStorage.getItem('machineId') || '11111111';
  otp = localStorage.getItem('otp') || '111111';
  // serial: ISerialService;
  open = false;
  devices = ['VMC', 'ZDM8', 'Tp77p', 'essp', 'cctalk', 'm102', 'adh815', 'adh814'];
  selectedDevice = 'VMC';

  portName = '/dev/ttyS1';
  baudRate = 9600;
  platforms: { label: string; value: ESerialPortType }[] = [];
  isSerial: ESerialPortType = ESerialPortType.Serial; // Default selected value
  temp: number = 5;
  LaabXWallet: string = '';
  constructor(private vendingIndex: VendingIndexServiceService, private serialService: SerialServiceService, public blockchainDbService: BlockchainDbService, public apiService: ApiService) {
  }

  ngOnInit() {
    this.platforms = Object.keys(ESerialPortType)
      .filter(key => isNaN(Number(key))) // Remove numeric keys
      .map(key => ({
        label: key,  // Display name
        value: ESerialPortType[key as keyof typeof ESerialPortType] // Enum value
      }));

    try {
      this.blockchainDbService.initialize(this.machineId).then(() => {
        console.log('Blockchain DB initialized successfully');
        console.log('SQLite initialized for machine:', this.machineId);
        this.loadBalance();
      }).catch(e => {
        console.error('SQLite init failed at app start:', e);
      })

    } catch (err) {
      console.error('SQLite init failed at app start:', err);
      // Optional: show toast or fallback to in-memory mode
    }





  }
  private async loadBalance() {
    try {
      this.currentBalance.value = await this.blockchainDbService.getLocalBalance(this.machineId);
      this.currentBalance.currency = localStorage.getItem('currency') || 'LAK';

      console.log('Current local balance:', this.currentBalance.value);
    } catch (e) {
      console.error('Failed to load balance:', e);
      this.currentBalance.value = 0;
    }
  }
  ngOnDestroy(): void {
    if (this.serial) {
      this.serial.close();
      console.log('serial close');
    }
    if (this.t) clearInterval(this.t);
  }
  selectPlatform(event: any) {
    this.isSerial = event.detail.value;
    console.log('Selected platform:', this.isSerial);

    // Show toast message
    Toast.show({ text: `Selected platform: ${this.isSerial}` });
  }
  connecting = false;
  async connect() {

    if (this.connecting) {
      return Toast.show({ text: 'Connecting' });
    }
    if (this.selectedDevice == 'VMC') {
      this.baudRate = 57600;
      await this.startVMC();
      Toast.show({ text: 'Start VMC' });
    }
    else if (this.selectedDevice == 'ZDM8') {
      await this.startZDM8();
      Toast.show({ text: 'Start ZDM8' });
    }
    // else if (this.selectedDevice == 'Tp77p') {
    //   await this.startPulseTP77p();
    //   Toast.show({ text: 'Start Tp77p3b' });
    // }
    // else if (this.selectedDevice == 'essp') {
    //   this.baudRate = 9600;
    //   await this.startEssp();
    //   Toast.show({ text: 'Start essp' });
    // }
    // else if (this.selectedDevice == 'cctalk') {
    //   await this.startCctalk();
    //   Toast.show({ text: 'Start cctalk' });
    // }
    // else if (this.selectedDevice == 'adh815') {
    //   await this.startAHD815();
    //   Toast.show({ text: 'Start adh815' });
    // } 
    else if (this.selectedDevice == 'adh814') {
      Toast.show({ text: 'select adh814' });
      await this.startAHD814();
      Toast.show({ text: 'Start adh814' });
    }
    else if (this.selectedDevice == 'm102') {
      await this.startM102();
      Toast.show({ text: 'Start m102' });
    }
    else {
      Toast.show({ text: 'Please select device' })
    }
    this.connecting = false;
    this.t = setInterval(() => {
      this.syncLogsToServer();
    }, 60000);

  }
  disableCashin() {
    if (this.serial && this.selectedDevice == 'VMC') {
      this.serial.command(EMACHINE_COMMAND.DISABLE, { enable: false }, 1).then(async (r) => {
        console.log('disablecashin', r);
        this.val = r?.data?.x;
        await Toast.show({ text: 'disablecashin' + JSON.stringify(r) })
      });
    } else {
      console.log('serial not init');
      Toast.show({ text: 'serial not init' })
    }
  }
  enableCashin() {
    if (this.serial && this.selectedDevice == 'VMC') {
      this.serial.command(EMACHINE_COMMAND.ENABLE, { enable: true }, 1).then(async (r) => {
        console.log('disablecashin', r);
        this.val = r?.data?.x;
        await Toast.show({ text: 'disablecashin' + JSON.stringify(r) })
      });
    } else {
      console.log('serial not init');
      Toast.show({ text: 'serial not init' })
    }
  }
  enableCash() {
    this.serial.nv9Command(EMACHINE_COMMAND.NV9_ENABLE, { enable: true }, 1).then(async (r) => {
      console.log('enableCash', r);
      this.val = r?.data?.x;
      await Toast.show({ text: 'enableCash' + JSON.stringify(r) })
    }).catch(e => {
      console.error('enableCash error', e);
      Toast.show({ text: 'enableCash error' + JSON.stringify(e) })
    });
  }
  disableCash() {
    this.serial.nv9Command(EMACHINE_COMMAND.NV9_DISABLE, { enable: false }, 1).then(async (r) => {
      console.log('disableCash', r);
    }).catch(e => {
      console.error('disableCash error', e);
    });
  }
  selectDevice(event: any) {
    console.log('selected device', event.detail.value);
    Toast.show({ text: 'selected device' + event.detail.value })
  }
  async reinitializeNV9(): Promise<boolean> {
    try {
      console.log('🔄 Sending NV9 reinit command...');

      const result = await this.serial.nv9Command(EMACHINE_COMMAND.NV9_REINIT, {}, 1);

      if (result.status) {
        console.log('✅ NV9 reinit successful:', result.message);
        return true;
      } else {
        console.error('❌ NV9 reinit failed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error sending reinit command:', error);
      return false;
    }
  }

  async startVMC() {
    if (this.serial) {
      await this.serial.close();
      this.serial = undefined as unknown as ISerialService;
    }
    this.serial = await this.vendingIndex.initVMC(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
    this.serial.getSerialEvents().subscribe((event: any) => {
      try {
        console.log('vmc service event received: ' + JSON.stringify(event));
        if (event.event === 'dataReceived') {
          // this.addLogMessage(`Received: ${event.data}`);
          this.processVMCResponse(event.data);
        } else if (event.event === 'commandAcknowledged') {
          console.log('Command acknowledged by VMC:', event.data);
        } else if (event.event === 'error') {
          console.error('Serial error:', event);
          // this.addLogMessage(`Serial error: ${JSON.stringify(event)}`);
        }
        else {
          console.error('Serial event:', event);

        }
        if (event?.event === 'nv9Event') {
          this.handleNV9Event(event?.data);
        }
      } catch (error: any) {
        console.error('Error processing event:', error);
        // this.addLogMessage(`Error processing event: ${error.message}`);
      }
    });
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  private processVMCResponse(hex: string): void {
    if (hex.startsWith('fafb04')) {

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
        // const hash = cryptojs.SHA256(this.sock.machineId + value).toString(cryptojs.enc.Hex);
        // const credit: ICreditData = {
        //   id: -1,
        //   name: 'credit',
        //   data: { raw: hex, data: hash, t: Date.now(), transactionID: t.toString(), command: EMACHINE_COMMAND.CREDIT_NOTE },
        //   transactionID: t.toString(),
        //   description: ''
        // };
        // this.creditPending.push(credit);
        // this.addOrUpdateCredit(credit);
        // this.sock.send(hash, t, EMACHINE_COMMAND.CREDIT_NOTE);
      } else if (mode == '08') {//fafb21068308000186a08a
        //bank note swollen
      }
    } else if (hex.startsWith('fafb23')) {
      console.log('receive banknotes 23-----------------------------------------------------------------------------', hex);
      // const now = Date.now();
      // if (this.lastReported23 && hex === this.lastReported23.hex && (now - this.lastReported23.timestamp < 1000)) {
      //   console.log('Ignoring duplicate 0x23:', hex);
      //   return;
      // }
      // this.lastReported23 = { hex, timestamp: now };

      // const amountHex = hex.substring(8, 16);
      // const amountDecimal = parseInt(amountHex.match(/.{2}/g).reverse().join(''), 16) / 100;
      // this.balance = amountDecimal; // Track balance in your app
      // console.log('Updated credit balance:', this.balance);
      // this.sock.send(hex, -23, EMACHINE_COMMAND.CREDIT_NOTE);

      // // Deduct credit immediately with mode 1 (bill)
      // this.serialService.writeVMC(EVMC_COMMAND._27, { mode: 1, amount: amountHex });
    } else if (hex.startsWith('fafb52')) {// status to server and update and local
      //fafb5221b5000000000000000000000000000030303030303030303030aaaaaaaaaaaaaaaac7
      // this.machinestatus.data = hex; 

    } else {


      console.log('Unhandled response:', hex);
    }

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

  async startZDM8() {
    if (this.serial) {
      await this.serial.close();
      this.serial = undefined as unknown as ISerialService;
    }
    this.serial = await this.vendingIndex.initZDM8(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
    this.serial.getSerialEvents().subscribe((event: any) => {
      console.log('zdm8 service event received: ' + JSON.stringify(event));
      if (event?.event === 'nv9Event') {
        this.handleNV9Event(event?.data);
      }
    });
  }
  // async startPulseTP77p() {
  //   if (this.serial) {
  //     await this.serial.close();
  //     this.serial = null;
  //   }
  //   this.serial = await this.vendingIndex.initPulseTop77p(this.portName, this.baudRate, this.machineId, this.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }
  // async startEssp() {
  //   console.log('startEssp');

  //   if (this.serial) {
  //     await this.serial.close();
  //     this.serial = null;
  //   }
  //   this.serial = await this.vendingIndex.initEssp(this.portName, this.baudRate, this.machineId, this.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }
  // async startCctalk() {
  //   if (this.serial) {
  //     await this.serial.close();
  //     this.serial = null;
  //   }
  //   this.serial = await this.vendingIndex.initCctalk(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }
  // async startAHD815() {
  //   if (this.serial) {
  //     await this.serial.close();
  //     this.serial = null;
  //   }
  //   this.serial = await this.vendingIndex.initADH815(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
  //   if (!this.serial) {
  //     Toast.show({ text: 'serial not init' });
  //   }
  //   this.vlog.log = this.serial.log;
  // }

  async startAHD814() {
    if (this.serial) {
      await this.serial.close();
      this.serial = undefined as unknown as ISerialService;
      Toast.show({ text: 'serial close' });
    }
    this.serial = await this.vendingIndex.initADH814(this.portName, Number(this.baudRate), this.machineId, this.machineId, this.isSerial);
    if (!this.serial) {
      addLogMessage(this.vlog.log, 'serial not init');
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
    Toast.show({ text: 'vlog.log' + JSON.stringify(this.vlog.log) });
    this.serial.getSerialEvents().subscribe((event: any) => {
      console.log('📱 Serial Event Received:', JSON.stringify(event));

      // Handle NV9 specific events
      if (event?.event === 'nv9Event') {
        this.handleNV9Event(event?.data);
      }
    });
  }
  async startM102() {
    if (this.serial) {
      await this.serial.close();
      this.serial = undefined as unknown as ISerialService;
    }
    this.serial = await this.vendingIndex.initM102(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }

  scanPorts() {
    if (this.serial) {
      this.serial.listPorts().then(async (r) => {
        console.log('listPorts', r);
        await Toast.show({ text: 'listPorts' + JSON.stringify(r), duration: 'long' })
      });
    } else {
      console.log('serial not init');
      Toast.show({ text: 'serial not init' })
    }

  }
  clearLog() {
    this.vlog.log.data = '';
  }
  testDrop() {
    if (this.serial) {
      const param = { slot: this.slot };
      this.serial.command(EMACHINE_COMMAND.shippingcontrol, param, 1).then(async (r) => {
        console.log('shippingcontrol', r);
        this.val = r?.data?.x;
        await Toast.show({ text: 'shippingcontrol' + JSON.stringify(r) })
      });
    } else {
      console.log('serial not init');
      Toast.show({ text: 'serial not init' })
    }
  }
  setTemp() {
    if (this.serial) {
      if (this.selectedDevice == 'adh814') {
        const param = {
          address: 0x01,
          mode: 0x01,
          lowTemp: this.temp
        };
        this.serial.command(EMACHINE_COMMAND.SET_TEMP, param, 1).then(async (r) => {
          console.log('setTemp', r);
          this.val = r?.data?.x;
          await Toast.show({ text: 'setTemp' + JSON.stringify(r) })
        });
      }
      if (this.selectedDevice == 'VMC') {
        const param = {
          lowTemp: this.temp,
          highTemp: this.temp + 5
        };
        this.serial.command(EMACHINE_COMMAND.SET_TEMP, param, 1).then(async (r) => {
          console.log('setTemp', r);
          this.val = r?.data?.x;
          await Toast.show({ text: 'setTemp' + JSON.stringify(r) })
        }).catch(async e => {
          console.error('setTemp error', e);
          await Toast.show({ text: 'setTemp error' + JSON.stringify(e) })
        });
      }

    } else {
      console.log('serial not init');
      Toast.show({ text: 'serial not init' })
    }
  }
  scanTestMotor() {
    try {
      const test = prompt('Scan Test motor every 5 seconds 1,2,3 or 1-60', '1-60');
      const arr = this.parseMotorInput(test || '1');
      const t = 10; // ******** too fast it would have an error
      Toast.show({ text: 'scanTestMotor ' + JSON.stringify(arr) });
      arr.forEach(async (slot, i) => {
        setTimeout(() => {
          Toast.show({ text: 'scanTestMotor ' + slot });
          const param = { slot };
          this.serial.command(EMACHINE_COMMAND.shippingcontrol, param, 1).then(async (r) => {
            console.log('scanTestMotor', r);
            this.val = r?.data?.x;
            await Toast.show({ text: 'scanTestMotor ' + JSON.stringify(r) })
          });

        }, 1000 * t * i);

      });
    } catch (error) {
      Toast.show({ text: 'scanTestMotor Error' + error, duration: 'long' })
    }

  }





  initDirectSerial() {
    this.serialService.initializeSerialPort(this.portName, Number(this.baudRate), this.vlog.log, this.isSerial).then(() => {
      console.log('Serial port initialized');
      Toast.show({ text: 'Serial port initialized' });
    });
  }
  directCommand() {
    this.serialService.write(this.datachecksum).then((v) => {
      console.log('Command succeeded:', v);
      Toast.show({ text: 'Direct Command succeeded:' + v, duration: 'long' })
    }).catch(e => {
      console.error('Command failed:', e);
      Toast.show({ text: 'Command failed:' + e })
    });
  }
  close() {
    if (this.serial) {
      this.serial.close();
      this.serial = undefined as unknown as ISerialService;
      // this.log={data:''};
      // this.readingData={data:'',len:100};
      Toast.show({ text: 'serial close' });
    }
    else {
      console.log('serial not init');
      Toast.show({ text: 'serial not init' })
    }
  }
  checkSum() {
    const buff = this.hexStringToArray(this.val);
    if (this.serialService && this.selectedDevice == 'ZDM8') {
      this.datachecksum = this.val + this.serialService.checkSumCRC(buff);
      console.log('checkSum', this.datachecksum);
      Toast.show({ text: 'checkSum' + this.datachecksum })
    } else if (this.serialService && this.selectedDevice == 'VMC') {
      this.datachecksum = this.serialService.chk8xor(buff);
      console.log('checkSum', this.datachecksum);
      Toast.show({ text: 'checkSum' + this.datachecksum })
    } else {
      console.log('serial not init');
      Toast.show({ text: 'serial not init' })
    }
  }
  closeDirectCommand() {
    this.serialService.close().then(() => {
      console.log('Direct Command Serial port closed');
      Toast.show({ text: 'Direct Command  Serial port closed' })
    });
  }
  hexStringToArray(hex: string): string[] {
    // Ensure even-length hex string
    if (hex.length % 2 !== 0) {
      throw new Error("Hex string length must be even.");
    }

    // Split into pairs of two characters
    const hexArray: string[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      hexArray.push(hex.substring(i, i + 2).toUpperCase()); // Ensure uppercase
    }

    return hexArray;
  }
  parseMotorInput(input: string) {
    if (!input || typeof input !== 'string') {
      throw new Error('Input must be a non-empty string');
    }

    // Trim whitespace
    input = input.trim();

    // Regex for the two formats
    const commaFormat = /^(\d+,)*\d+$/; // e.g., "1,2,3" or "1"
    const rangeFormat = /^\d+-\d+$/;    // e.g., "1-10"

    // Case 1: Comma-separated values (e.g., "1,2,3")
    if (commaFormat.test(input)) {
      const numbers = input.split(',').map(num => parseInt(num.trim(), 10));
      // Validate numbers are finite and positive
      if (numbers.some(num => !Number.isFinite(num) || num <= 0)) {
        throw new Error('All values must be positive integers');
      }
      return numbers;
    }

    // Case 2: Range format (e.g., "1-10")
    if (rangeFormat.test(input)) {
      const [start, end] = input.split('-').map(num => parseInt(num.trim(), 10));
      // Validate start and end
      if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end <= 0) {
        throw new Error('Range values must be positive integers');
      }
      if (start >= end) {
        throw new Error('Start must be less than end in range');
      }
      // Generate range array
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    throw new Error('Invalid format. Use "1,2,3" or "1-10"');
  }






  /**
 * Handle all NV9 events
 */
  private handleNV9Event(nv9Event: any) {
    console.log('🎯 NV9 Event Type:', nv9Event.event);
    console.log('📦 NV9 Event Data:', nv9Event);

    switch (nv9Event.event) {

      // ============ NOTE ACCEPTANCE EVENTS ============
      case 'READ_NOTE':
        // Note is being read/validated
        const readData = JSON.parse(nv9Event.data);
        console.log(`📖 Note being read on channel ${readData.channel}`);

        // Update UI to show note detection
        this.showToast(`Reading note on channel ${readData.channel}`, 'primary');

        // You might want to show a loading indicator
        this.isReadingNote = true;
        this.currentReadingChannel = readData.channel;
        break;

      case 'CREDIT_NOTE':
        // Note accepted - CREDIT ISSUED!
        const creditData = JSON.parse(nv9Event.data);
        console.log(`💰 CREDIT ISSUED on channel ${creditData.channel}`);

        // Map channel to actual money value
        const channelValues: { [key: number]: number } = {
          0: 500,
          1: 1000,   // 1000 LAK
          2: 2000,   // 2000 LAK
          3: 5000,   // 5000 LAK
          4: 10000,  // 10000 LAK
          5: 20000,  // 20000 LAK
          6: 50000,  // 50000 LAK
          7: 100000, // 100000 LAK
          8: 200000  // 200000 LAK (if available)
        };

        const amount = channelValues[creditData.channel] || 0;

        // Show success message
        this.showToast(`💰 +${amount} LAK credited!`, 'success');

        // Update your app's balance
        this.updateBalance(amount);

        // Track transaction
        this.addTransaction({
          type: 'CASH_IN',
          amount: amount,
          channel: creditData.channel,
          timestamp: new Date()
        });

        // Reset reading flag
        this.isReadingNote = false;
        break;

      case 'NOTE_STACKED':
        // Note moved to cashbox
        console.log('📦 Note stacked in cashbox');
        this.showToast('Note stored in cashbox', 'secondary');
        break;

      // ============ REJECTION EVENTS ============
      case 'NOTE_REJECTING':
        console.log('⚠️ Note is being rejected');
        this.showToast('Note rejected - please remove', 'warning');
        break;

      case 'NOTE_REJECTED':
        const rejectData = JSON.parse(nv9Event.data);
        console.log('❌ Note rejected:', rejectData);

        // Map reject codes to messages
        const rejectMessages: { [key: number]: string } = {
          0x01: 'Note length incorrect',
          0x06: 'Channel inhibited',
          0x07: 'Second note inserted',
          0x0B: 'Note too long',
          0x0D: 'Mechanism slow/stalled',
          0x0F: 'Fraud channel reject',
          0x11: 'Peak detect fail',
          0x12: 'Twisted note detected',
          0x13: 'Escrow timeout',
          0x14: 'Bar code scan fail'
        };

        const rejectMessage = rejectMessages[rejectData.code] || 'Unknown reject reason';
        this.showToast(`❌ Note rejected: ${rejectMessage}`, 'danger');

        this.isReadingNote = false;
        break;

      // ============ STATUS EVENTS ============
      case 'ENABLED':
        console.log('🟢 NV9 Enabled');
        this.isNV9Enabled = true;
        this.showToast('Cash acceptor ready', 'success');
        break;

      case 'DISABLED':
        console.log('🔴 NV9 Disabled');
        this.isNV9Enabled = false;
        // this.showToast('Cash acceptor disabled', 'warning');
        break;

      case 'STACKER_FULL':
        console.log('📊 Cashbox is full');
        this.showToast('⚠️ Cashbox full - please empty', 'danger');

        // You might want to disable cash-in when full
        // this.disableCashIn();
        break;

      // ============ CASHBOX EVENTS ============
      case 'CASHBOX_REMOVED':
        console.log('📭 Cashbox removed');
        this.isCashboxPresent = false;
        this.showToast('Cashbox removed', 'warning');

        // Automatically disable when cashbox removed
        // this.disableCashIn();
        break;

      case 'CASHBOX_REPLACED':
        console.log('📬 Cashbox replaced');
        this.isCashboxPresent = true;
        this.showToast('Cashbox replaced', 'success');

        // Re-enable if appropriate
        if (this.shouldAutoEnable) {
          // this.enableCashIn();
        }
        break;

      // ============ JAM/FRAUD EVENTS ============
      case 'FRAUD_ATTEMPT':
        console.log('🚫 Fraud attempt detected');
        this.showToast('🚫 Fraud attempt detected', 'danger');

        // Log for security
        // this.logSecurityEvent('FRAUD_ATTEMPT', nv9Event.data);
        break;

      case 'SAFE_NOTE_JAM':
        console.log('🔧 Safe note jam');
        this.showToast('Paper jam - please clear', 'danger');
        break;

      case 'UNSAFE_NOTE_JAM':
        console.log('🔧 Unsafe note jam');
        this.showToast('Critical jam - service required', 'danger');
        break;

      // ============ NOTE HANDLING EVENTS ============
      case 'NOTE_HELD_IN_BEZEL':
        const bezelData = JSON.parse(nv9Event.data);
        console.log(`🔄 Note held in bezel: ${bezelData.value} ${bezelData.country_code}`);

        // Show take note prompt
        this.showTakeNotePrompt(bezelData.value);
        break;

      case 'NOTE_CLEARED_FROM_FRONT':
        console.log('⬅️ User took note back');
        this.showToast('Note returned to user', 'secondary');
        break;

      case 'NOTE_CLEARED_TO_CASHBOX':
        console.log('➡️ Note cleared to cashbox');
        break;

      // ============ CHANNEL EVENTS ============
      case 'CHANNEL_DISABLE':
        const channelData = JSON.parse(nv9Event.data);
        console.log(`🚫 Channel ${channelData.channel} disabled`);
        break;

      // ============ NV9 READY EVENT ============
      case 'nv9Ready':
        console.log('✅ NV9 initialized and ready:', nv9Event.message);
        this.isNV9Ready = true;
        this.showToast('NV9 cash acceptor ready', 'success');

        // Get device info
        this.getNV9DeviceInfo();
        break;

      case 'nv9Error':
        console.error('❌ NV9 Error:', nv9Event.error);
        this.showToast(`NV9 Error: ${nv9Event.error}`, 'danger');

        // Try to reinitialize after error
        if (nv9Event.error.includes('timed out') || nv9Event.error.includes('communication')) {
          setTimeout(() => {
            console.log('Attempting to reinitialize NV9...');
            // this.reinitializeNV9();
          }, 5000);
        }
        break;

      case 'nv9Retrying':
        console.log(`🔄 NV9 retrying (${nv9Event.retryCount}/${nv9Event.maxRetries})`);
        this.showToast(`Connecting to NV9... (${nv9Event.retryCount}/${nv9Event.maxRetries})`, 'secondary');
        break;

      // ============ USB DEVICE EVENTS ============
      case 'usbDeviceEvent':
        this.handleUSBEvent(nv9Event.data);
        break;

      default:
        console.log('Unknown NV9 event:', nv9Event);
    }
  }

  /**
   * Handle USB device events
   */
  private handleUSBEvent(usbEvent: any) {
    console.log('🔌 USB Event:', usbEvent);

    switch (usbEvent.event) {
      case 'usbAttached':
        console.log(`USB device attached: ${usbEvent.deviceName}`);
        this.showToast('USB device detected', 'secondary');
        break;

      case 'usbDetached':
        console.log(`USB device detached: ${usbEvent.deviceName}`);
        this.isNV9Ready = false;
        this.showToast('USB device disconnected', 'warning');
        break;

      case 'usbPermissionGranted':
        console.log(`USB permission granted for ${usbEvent.deviceName}`);
        break;

      case 'usbScanComplete':
        if (usbEvent.found) {
          console.log(`Found ${usbEvent.count} USB devices`);
        } else {
          console.log('No USB devices found');
        }
        break;

      case 'usbAutoConnected':
        console.log('✅ USB NV9 auto-connected successfully');
        break;

      case 'usbAutoConnectFailed':
        console.log('❌ USB NV9 auto-connect failed:', usbEvent.reason);
        break;
    }
  }

  // ============ HELPER METHODS ============

  private showToast(message: string, color: string = 'primary') {
    // Use your preferred toast service
    Toast.show({ text: message, duration: 'long' });
    this.saveLogs(message);
    // Or if using Ionic
    // const toast = await this.toastController.create({
    //   message: message,
    //   duration: 2000,
    //   color: color
    // });
    // toast.present();
  }
  // 1. Save log (safe JSON handling)
  saveLogs(message: string) {
    try {
      let logs: Array<{ message: string; timestamp: string }> = [];
      const stored = localStorage.getItem('nv9Logs');

      if (stored) {
        logs = JSON.parse(stored);
      }

      logs.push({
        message,
        timestamp: new Date().toISOString(),
      });

      localStorage.setItem('nv9Logs', JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to save log:', err);
      // Fallback: don't lose the message
      console.log('Lost log:', message);
    }
  }

  /**
  * Updates balance and logs the transaction to blockchain
  * @param amount Positive = cash inserted, Negative = cash removed/reset/transferred out
  */
  private async updateBalance(amount: number) {
    if (amount === 0) return;

    try {
      const isInsert = amount > 0;
      const absAmount = Math.abs(amount);

      // 1. Get previous block
      const latest = await this.blockchainDbService.getLatestBlock(this.machineId);
      const prevHash = latest?.hash || '0000000000000000000000000000000000000000000000000000000000000000';
      const nextIndex = (latest?.block_index ?? 0) + 1;

      // 2. Create transaction data
      const txData = {
        type: isInsert ? 'insert' : 'withdrawal',  // or 'reset' if it's a full clear
        amount: absAmount,                         // always positive number
        timestamp: new Date().toISOString(),
        // Optional: add note or reason
        note: isInsert ? 'Banknote accepted' : 'Cash reset / transferred to e-wallet',
      };

      // 3. Compute block hash (consistent with client)
      const blockString = JSON.stringify({
        prevHash,
        index: nextIndex,
        data: txData,
        timestamp: txData.timestamp,
      });
      const newHash = CryptoJS.SHA256(blockString).toString();

      // 4. Log to blockchain
      await this.blockchainDbService.addBlock({
        machineId: this.machineId,
        prevHash,
        hash: newHash,
        data: txData,
        isReset: !isInsert,               // flag reset/withdrawal
        signature: '',                    // add later if needed
        needsSync: true,
      });

      // 5. Update UI balance (optimistic)
      this.currentBalance.value += amount;  // + for insert, - for withdrawal

      // 6. Trigger sync
      this.syncToServer();

      console.log(
        `${isInsert ? 'Inserted' : 'Withdrew'} ${absAmount} → New balance: ${this.currentBalance.value}`
      );
    } catch (err) {
      console.error('Failed to update balance / log transaction:', err);
      // Optional: revert UI balance if critical
    }
  }
  private async syncToServer(LaabXWallet: string = '') {
    try {
      // Get only unsynced blocks — max 200 at a time to avoid huge payloads
      const unsynced = await this.blockchainDbService.getUnsyncedBlocks(this.machineId, 200);

      if (!unsynced.length) {
        console.log('No blocks need syncing');
        return;
      }

      console.log(`Syncing ${unsynced.length} blocks to server...`);

      const res = await this.apiService.blockChainSync(unsynced, LaabXWallet);

      if (res?.status === 1) {  // be explicit about what "success" means
        const blockIds = unsynced.map(b => b.id);
        await this.blockchainDbService.markAsSynced(blockIds);
        console.log(`Successfully synced ${blockIds.length} blocks`);

        // If there are still more, trigger again soon
        if (unsynced.length === 200) {
          setTimeout(() => this.syncToServer(LaabXWallet), 2000); // continue in 2 seconds
        }
      } else {
        console.warn('Server rejected sync:', res);
      }
    } catch (err) {
      console.error('Sync failed:', err);
      // Optional: retry after delay
      setTimeout(() => this.syncToServer(LaabXWallet), 30000); // try again in 30s
    }
  }
  // 2. Sync with retry & error handling
  private async syncLogsToServer() {
    console.log('Syncing logs to server...');

    let logs: Array<{ message: string; timestamp: string }> = [];
    const stored = localStorage.getItem('nv9Logs');

    if (!stored || stored === '[]') {
      console.log('No logs to sync');
      return;
    }

    try {
      logs = JSON.parse(stored);
      if (!Array.isArray(logs) || logs.length === 0) return;
    } catch (err) {
      console.error('Invalid logs in storage:', err);
      localStorage.setItem('nv9Logs', '[]'); // clear corrupt data
      return;
    }

    try {
      // Send to server (your existing API call)
      await this.apiService.blockChainSyncLog(logs);

      // Success → clear logs
      localStorage.setItem('nv9Logs', '[]');
      console.log(`Synced ${logs.length} logs successfully`);

      // Optional: show success toast
      this.showToast(`Synced ${logs.length} logs`, 'success');
    } catch (err) {
      console.error('Log sync failed:', err);

      // Do NOT clear logs on failure → retry next interval
      // Optional: limit retries or add exponential backoff
      this.showToast('Log sync failed – will retry', 'warning');
    }
  }


  private addTransaction(transaction: any) {
    // Store transaction in your database
    this.transactions.unshift(transaction);

    // Keep only last 50 transactions
    if (this.transactions.length > 50) {
      this.transactions.pop();
    }
  }

  private showTakeNotePrompt(value: number) {
    // Show a prompt asking user to take the note
    console.log(`Please take your ${value} LAK note`);

    // You might want to show a modal or alert
    // this.alertController.create({
    //   header: 'Take Your Note',
    //   message: `Please take your ${value} LAK note from the bezel`,
    //   buttons: ['OK']
    // }).then(alert => alert.present());
  }

  private async getNV9DeviceInfo() {
    try {
      // Get serial number
      const serialResult = await this.serial.nv9Command(
        EMACHINE_COMMAND.NV9_GET_SERIAL,
        {},
        Date.now()
      );

      if (serialResult.data?.serial_number) {
        console.log('NV9 Serial Number:', serialResult.data.serial_number);
        this.nv9SerialNumber = serialResult.data.serial_number;
      }

      // Get setup info (channel values)
      const setupResult = await this.serial.nv9Command(
        EMACHINE_COMMAND.NV9_SETUP_REQUEST,
        {},
        Date.now()
      );

      if (setupResult.data) {
        console.log('NV9 Setup Info:', setupResult.data);
        this.nv9ChannelValues = setupResult.data.channel_values;
      }

    } catch (error) {
      console.error('Failed to get NV9 device info:', error);
    }
  }
  public async resetCashAcceptor() {
    try {
      // Reset NV9 hardware
      const serialResult = await this.serial.nv9Command(
        EMACHINE_COMMAND.NV9_RESET,
        {},
        Date.now()
      );

      // Log full cash removal (negative = withdraw all)
      await this.updateBalance(-this.currentBalance.value);

      console.log('Cash acceptor reset and balance cleared');
    } catch (error) {
      console.error('Failed to reset NV9:', error);
    }
  }

  public async topUpEwallet() {
    try {
      // Optional: reset hardware first
      await this.serial.nv9Command(EMACHINE_COMMAND.NV9_RESET, {}, Date.now());

      // Get real balance from DB (authoritative source)
      const currentDbBalance = await this.blockchainDbService.getLocalBalance(this.machineId);

      if (currentDbBalance <= 0) {
        console.log('No balance to transfer');
        return;
      }

      const transferAmount = -currentDbBalance; // negative = withdrawal

      // Log the transfer/withdrawal to blockchain
      await this.updateBalance(transferAmount);

      // Sync with destination wallet info
      const LaabXWallet = this.LaabXWallet + '';
      await this.syncToServer(LaabXWallet);

      // After successful log → safely reset UI
      this.currentBalance.value = 0;

      console.log(`Transferred ${currentDbBalance} LAK to e-wallet: ${LaabXWallet}`);

      // Optional: show success toast
    } catch (error) {
      console.error('Failed to top up e-wallet:', error);
      // Optional: revert UI or show error message
    }
  }
  // ============ UI State Variables ============
  isNV9Ready: boolean = false;
  isNV9Enabled: boolean = false;
  isCashboxPresent: boolean = true;
  isReadingNote: boolean = false;
  currentReadingChannel: number = -1;
  currentBalance = { value: 0, currency: 'LAK' };
  nv9SerialNumber: string = '';
  nv9ChannelValues: number[] = [];
  transactions: any[] = [];
  shouldAutoEnable: boolean = true;




}
