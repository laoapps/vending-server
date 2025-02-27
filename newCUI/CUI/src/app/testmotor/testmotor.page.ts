import { Component, OnInit ,OnDestroy} from '@angular/core';
import {VendingIndexServiceService} from '../vending-index-service.service'
import {ISerialService,EMACHINE_COMMAND,ESerialPortType} from '../services/syste.model'
import { Toast } from '@capacitor/toast';
@Component({
  selector: 'app-testmotor',
  templateUrl: './testmotor.page.html',
  styleUrls: ['./testmotor.page.scss'],
})
export class TestmotorPage implements OnInit,OnDestroy {
  log = { data: '' };
  readingData = { data: '',len:100 };
  slot = 1;
  //val='0110200100020410010100'; //with checksum 0110200100020410010100ff32
  val = 'fafb4200'
  sendingDate={data:''};
  datachecksum=''
  machineId='11111111';
  otp='111111';
  serial:ISerialService;
  open =false;
  devices=['VMC','ZDM8'];
  selectedDevice='VMC';
 
  portName = '/dev/ttyS0';
  baudRate = 57600;
  platforms: { label: string; value: ESerialPortType }[] = [];
  isSerial: ESerialPortType = ESerialPortType.Serial; // Default selected value
  constructor(private vendingIndex :VendingIndexServiceService) {
  }

  ngOnInit() {
    this.platforms=Object.keys(ESerialPortType)
    .filter(key => isNaN(Number(key))) // Remove numeric keys
    .map(key => ({
      label: key,  // Display name
      value: ESerialPortType[key as keyof typeof ESerialPortType] // Enum value
    }));
  }
  ngOnDestroy(): void {
    if(this.serial){
      this.serial.close();
      console.log('serial close');
    }
  }
  selectPlatform(event){
    this.isSerial = event.detail.value;
    console.log('Selected platform:', this.isSerial);
    
    // Show toast message
    Toast.show({ text: `Selected platform: ${this.isSerial}` });
  }
  connect(){

    if(this.selectedDevice=='VMC'){
      this.startVMC();
      Toast.show({text:'Start VMC'});
    }
    if(this.selectedDevice=='ZDM8'){
      this.startZDM8();
      Toast.show({text:'Start ZDM8'});
    }else{
      Toast.show({text:'Please select device'})
    }
    
  }
  selectDevice(event){
    console.log('selected device',event.detail.value);
    Toast.show({text:'selected device'+event.detail.value})
  }
  
  async startVMC(){
    if(this.serial){
      await this.serial.close();
      this.serial=null;
    }
    this.serial= this.vendingIndex.initVMC(this.portName, this.baudRate,this.machineId,this.otp,this.isSerial);
  }
  async startZDM8(){
    if(this.serial){
      await this.serial.close();
      this.serial=null;
    }
    this.serial= this.vendingIndex.initZDM8(this.portName, this.baudRate,this.machineId,this.otp,this.isSerial);
  }

  scan() {
    if(this.serial){
      this.serial.listPorts().then(async (r)=>{
        console.log('listPorts',r);
        await Toast.show({text:'listPorts'+JSON.stringify(r),duration:'long'})
      });
    }else{
      console.log('serial not init');
      Toast.show({text:'serial not init'})
    }

  }
  testDrop() {
    if(this.serial){
      const param = {slot:this.slot};
      this.serial.command(EMACHINE_COMMAND.shippingcontrol,param,1).then(async (r)=>{
        console.log('shippingcontrol',r);
        await Toast.show({text:'shippingcontrol'+JSON.stringify(r)})
      });
    }else{
      console.log('serial not init');
      Toast.show({text:'serial not init'})
    }
  }
  close(){
    if(this.serial){
      this.serial.close();
      Toast.show({text:'serial close'});
    }
    else{
      console.log('serial not init');
      Toast.show({text:'serial not init'})
    }
  }
  checkSum(){
    const buff = this.hexStringToArray(this.val);
    if(this.serial){
      this.datachecksum = this.serial.checkSum(buff);
      console.log('checkSum',this.datachecksum);
      Toast.show({text:'checkSum'+this.datachecksum})
    }else{
      console.log('serial not init');
      Toast.show({text:'serial not init'})
    }
   

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



}
