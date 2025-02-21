import { Component, OnInit } from '@angular/core';
import { SerialserviceService } from '../services/serialservice.service';

@Component({
  selector: 'app-testmotor',
  templateUrl: './testmotor.page.html',
  styleUrls: ['./testmotor.page.scss'],
})
export class TestmotorPage implements OnInit {

  constructor(private serialService: SerialserviceService) {
  }

  ngOnInit() {
  }


  scan() {
    this.serialService.useSerialPort();
  }

}
