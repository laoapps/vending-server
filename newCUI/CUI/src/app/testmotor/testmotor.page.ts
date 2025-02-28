import { Component, OnInit, OnDestroy } from '@angular/core';
import { VendingIndexServiceService } from '../vending-index-service.service'
import { ISerialService, EMACHINE_COMMAND, ESerialPortType } from '../services/syste.model'
import { Toast } from '@capacitor/toast';
// import {SerialConnectionCapacitor} from 'SerialConnectionCapacitor';
import { SerialServiceService } from '../services/serialservice.service';
@Component({
  selector: 'app-testmotor',
  templateUrl: './testmotor.page.html',
  styleUrls: ['./testmotor.page.scss'],
})
export class TestmotorPage implements OnInit, OnDestroy {
  vlog = { log: { data: '' } };
  vreadingData = { readingData: { data: '', len: 100 } };
  slot = 1;
  //val='011020010002040A010000';//011000010002040A010094F8'
  val = '0110200100020410010000'; //with checksum 0110200100020410010100ff32
  // val = 'fafb420000';//with checksum fafb420043
  sendingDate = { data: '' };
  datachecksum = ''
  machineId = '11111111';
  otp = '111111';
  serial: ISerialService;
  open = false;
  devices = ['VMC', 'ZDM8'];
  selectedDevice = 'ZDM8';

  portName = '/dev/ttyS1';
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
  connect() {

    if (this.selectedDevice == 'VMC') {
      this.startVMC();
      Toast.show({ text: 'Start VMC' });
    }
    if (this.selectedDevice == 'ZDM8') {
      this.startZDM8();
      Toast.show({ text: 'Start ZDM8' });
    } else {
      Toast.show({ text: 'Please select device' })
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
    this.serial = this.vendingIndex.initVMC(this.portName, this.baudRate, this.machineId, this.otp, this.isSerial);
    this.vlog.log = this.serial.log;
    this.vreadingData.readingData = this.serial.readingData;
  }
  async startZDM8() {
    if (this.serial) {
      await this.serial.close();
      this.serial = null;
    }
    this.serial = this.vendingIndex.initZDM8(this.portName, this.baudRate, this.machineId, this.otp, this.isSerial);
    this.vlog.log = this.serial.log;
    this.vreadingData.readingData = this.serial.readingData;
  }
  startMultiplePorts() {

  };
  writeToPort() {

  }
  closeAllPorts() {

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
      const t = 5;
      Toast.show({ text: 'scanTestMotor ' + JSON.stringify(arr) });
      arr.forEach(async (slot,i) => {
        setTimeout(() => {
          Toast.show({ text: 'scanTestMotor ' + slot });
          const param = { slot };
          this.serial.command(EMACHINE_COMMAND.shippingcontrol, param, 1).then(async (r) => {
            console.log('scanTestMotor', r);
            this.val = r?.data?.x;
            await Toast.show({ text: 'scanTestMotor ' + JSON.stringify(r) })
          });

        }, 1000 * 5 * i);

      });
    } catch (error) {
      Toast.show({ text: 'scanTestMotor Error' + error, duration: 'long' })
    }

  }





  initDirectSerial() {
    this.serialService.initializeSerialPort(this.portName, this.baudRate, this.vlog.log, this.vreadingData.readingData, this.isSerial).then(() => {
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
