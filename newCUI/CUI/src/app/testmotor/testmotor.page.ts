import { Component, OnInit } from '@angular/core';
import { SerialServiceService } from '../services/serialservice.service';

@Component({
  selector: 'app-testmotor',
  templateUrl: './testmotor.page.html',
  styleUrls: ['./testmotor.page.scss'],
})
export class TestmotorPage implements OnInit {

  constructor(private serialService: SerialServiceService) {
  }

  ngOnInit() {
  }


  scan() {
   this.serialService.initializeSerialPort('/dev/ttyS0', 57600).then(()=>{
      console.log('Serial port initialized');
   })
  }

}
