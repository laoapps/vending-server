import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-custom-number-pad',
  templateUrl: './custom-number-pad.page.html',
  styleUrls: ['./custom-number-pad.page.scss'],
})
export class CustomNumberPadPage implements OnInit {



  showPhonenumberPage: boolean = true;
  showEPINCashoutPage: boolean = false;

  numberList: Array<string> = [];
  placeholder: string = 'ປ້ອນເບີໂທລະສັບ 8 ໂຕເລກຂອງທ່ານ';
  phonenumber: string;

  constructor(
    public apiService: ApiService

  ) {
  }

  ngOnInit() {
    this.apiService.autopilot.auto = 0;
    this.loadNumberList();
    this.apiService.epinCashOutPageSound();

  }
  loadNumberList(): void {
    for (let i = 1; i < 10; i++) {
      this.numberList.push(i.toString());
    }
    this.phonenumber = this.placeholder;
  }
  processDigits(digit: string) {
    if (this.phonenumber == this.placeholder) {
      this.phonenumber = digit;
    } else {
      if (this.phonenumber.length < 30) {
        this.phonenumber += digit;
      }
    }
    if (this.phonenumber.length == 8) {
      this.apiService.dismissModal({ phonenumber: this.phonenumber });
    }
  }
  deleteDigits() {
    if (this.phonenumber != this.placeholder) {
      if (this.phonenumber != undefined && Object.entries(this.phonenumber).length == 1) {
        this.phonenumber = this.placeholder;
      } else {
        this.phonenumber = this.phonenumber.substring(0, this.phonenumber.length - 1);
      }
    }
  }

  next(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        if (this.phonenumber.length == 8) {
          this.apiService.dismissModal({ phonenumber: this.phonenumber });
        }

      } catch (error) {
      }
    });
  }

  close() {
    this.apiService.dismissModal();
  }

}
