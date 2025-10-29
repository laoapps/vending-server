import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { VendingIndexServiceService } from '../vending-index-service.service'
import { ISerialService, EMACHINE_COMMAND, ESerialPortType, IlogSerial, ICreditData, addLogMessage } from '../services/syste.model'
import { Toast } from '@capacitor/toast';
// import {SerialConnectionCapacitor} from 'SerialConnectionCapacitor';
import { SerialServiceService } from '../services/serialservice.service';
import * as moment  from 'moment-timezone';
import cryptojs, { mode } from 'crypto-js';

@Component({
  selector: 'app-testmotor',
  templateUrl: './testmotor.page.html',
  styleUrls: ['./testmotor.page.scss'],
})

export class TestmotorPage implements OnInit, OnDestroy {
  vlog = { log: { data: '', limit: 50 } as IlogSerial };
  @Input() serial: ISerialService;

  slot = 1;
  //val='011020010002040A010000';//011000010002040A010094F8'
  val = '0110200100020410010000'; //with checksum 0110200100020410010100ff32
  // val = 'fafb420000';//with checksum fafb420043
  sendingDate = { data: '' };
  datachecksum = ''
  machineId = '11111111';
  otp = '111111';
  // serial: ISerialService;
  open = false;
  devices = ['VMC', 'ZDM8', 'Tp77p', 'essp', 'cctalk', 'm102', 'adh815', 'adh814'];
  selectedDevice = 'VMC';

  portName = '/dev/ttyS3';
  baudRate = 9600;
  platforms: { label: string; value: ESerialPortType }[] = [];
  isSerial: ESerialPortType = ESerialPortType.Serial; // Default selected value
  constructor(private vendingIndex: VendingIndexServiceService, private serialService: SerialServiceService) {
  }

  ngOnInit() {
    this.platforms = Object.keys(ESerialPortType)
      .filter(key => isNaN(Number(key))) // Remove numeric keys
      .map(key => ({
        label: key,  // Display name
        value: ESerialPortType[key as keyof typeof ESerialPortType] // Enum value
      }));
  }
  ngOnDestroy(): void {
    if (this.serial) {
      this.serial.close();
      console.log('serial close');
    }
  }
  selectPlatform(event) {
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
    else if (this.selectedDevice == 'Tp77p') {
      await this.startPulseTP77p();
      Toast.show({ text: 'Start Tp77p3b' });
    }
    else if (this.selectedDevice == 'essp') {
      this.baudRate = 9600;
      await this.startEssp();
      Toast.show({ text: 'Start essp' });
    }
    else if (this.selectedDevice == 'cctalk') {
      await this.startCctalk();
      Toast.show({ text: 'Start cctalk' });
    }
    else if (this.selectedDevice == 'adh815') {
      await this.startAHD815();
      Toast.show({ text: 'Start adh815' });
    } else if (this.selectedDevice == 'adh814') {
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
  selectDevice(event) {
    console.log('selected device', event.detail.value);
    Toast.show({ text: 'selected device' + event.detail.value })
  }

  async startVMC() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initVMC(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
    this.serial.getSerialEvents().subscribe(event => {
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
        // const hash = cryptojs.SHA256(this.sock.machineId + value).toString(cryptojs.enc.Hex);
        // const credit: ICreditData = {
        //   id: -1,
        //   name: 'credit',
        //   data: { raw: hex, data: hash, t: moment.now(), transactionID: t.toString(), command: EMACHINE_COMMAND.CREDIT_NOTE },
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
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initZDM8(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  async startPulseTP77p() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initPulseTop77p(this.portName, this.baudRate, this.machineId, this.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  async startEssp() {
    console.log('startEssp');

    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initEssp(this.portName, this.baudRate, this.machineId, this.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  async startCctalk() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initCctalk(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }
  async startAHD815() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = await this.vendingIndex.initADH815(this.portName, Number(this.baudRate), this.machineId, this.otp, this.isSerial);
    if (!this.serial) {
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
  }

  async startAHD814() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
      Toast.show({ text: 'serial close' });
    }
    this.serial = await this.vendingIndex.initADH814(this.portName, Number(this.baudRate), this.machineId, this.machineId, this.isSerial);
    if (!this.serial) {
      addLogMessage(this.vlog.log, 'serial not init');
      Toast.show({ text: 'serial not init' });
    }
    this.vlog.log = this.serial.log;
    Toast.show({ text: 'vlog.log' + JSON.stringify(this.vlog.log) });
  }
  async startM102() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
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
  scanTestMotor() {
    try {
      const test = prompt('Scan Test motor every 5 seconds 1,2,3 or 1-60', '1-60');
      const arr = this.parseMotorInput(test);
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
      this.serial = null;
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


}
