import { Component, OnInit } from '@angular/core';
import { SerialServiceService } from '../services/serialservice.service';

@Component({
  selector: 'app-testmotor',
  templateUrl: './testmotor.page.html',
  styleUrls: ['./testmotor.page.scss'],
})
export class TestmotorPage implements OnInit {
  log = { data: '' };
  readingData = { data: '',len:100 };
  slot = 1;
  val='011000010002040A010000';
  sendingDate={data:''};
  datachecksum=''
  constructor(private serialService: SerialServiceService) {
  }

  ngOnInit() {

  }


  scan() {
    this.serialService.initializeSerialPort('/dev/ttyS1', 9600, this.log,this.readingData).then(() => {
      console.log('Serial port initialized');
    })

  }
  testDrop() {
    this.serialService.shipOrder(this.slot, this.log);
  }
  checkSum(){
    this.datachecksum=this.val+this.serialService.checkSumCRC(this.serialService.hexStringToArray(this.val));
  }

}
