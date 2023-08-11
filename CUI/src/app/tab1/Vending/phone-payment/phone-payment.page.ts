import { Component, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-phone-payment',
  templateUrl: './phone-payment.page.html',
  styleUrls: ['./phone-payment.page.scss'],
})
export class PhonePaymentPage implements OnInit {

  showPhonenumberPage: boolean = true;
  showPaymentPage: boolean = false;
  showCustomAmountPage: boolean = false;

  numberList: Array<string> = [];
  placeholder: string = 'ENTER PHONE NUMBER';
  phonenumber: string;
  digit: string;
  digitModel: Array<any> = [
    { digit: 2, img: '../../../../assets/topup/ETL.png' },
    { digit: 5, img: '../../../../assets/topup/LTC.png' },
    { digit: 7, img: '../../../../assets/topup/T-Plus.png' },
    { digit: 8, img: '../../../../assets/topup/Best.png' },
    { digit: 9, img: '../../../../assets/topup/Unitel.png' },
  ];
  currentImage: string;
  amount: number = 0;
  moneyList: Array<number> = [5000, 10000, 20000, 25000, 50000, 100000];

  customAmountNumberList: Array<string> = [];
  customAmountPlaceholder: string = 'ENTER CUSTOM AMOUNT';
  customAmount: string;
  

  subtitle: string = 'LTC, Best, Unitel, ETL, T-Plus';

  constructor(
    public apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadNumberList();
    this.loadCustomAmountNumberList();

  }
  back() {
    this.showPhonenumberPage = true;
    this.showPaymentPage = false;
    this.showCustomAmountPage = false;
  }
  loadNumberList(): void {
    for(let i = 1; i < 10; i++) {
      this.numberList.push(i.toString());
    }
    this.phonenumber = this.placeholder;
  }
  processDigits(digit: string) {
    if (this.phonenumber == this.placeholder) {
      if (digit != '0') {
        this.phonenumber = digit;
      }
    } else {
      if (this.phonenumber.length < 10) {
        this.phonenumber += digit;
      }
    }
    this.validateSubtitle();
  }
  deleteDigits() {
    if (this.phonenumber != this.placeholder) {
      if (this.phonenumber != undefined && Object.entries(this.phonenumber).length == 1) {
        this.phonenumber = this.placeholder;
      } else {
        this.phonenumber = this.phonenumber.substring(0, this.phonenumber.length - 1);
      }
    }
    this.validateSubtitle();
  }
  validateSubtitle() {
    this.digit = String(this.phonenumber.substring(0,3));
    if (this.digit != undefined && this.digit.length > 2) {
      if (this.digit == '202' || this.digit == '302') {
        this.subtitle = 'You are using ETL';
      }
      else if (this.digit == '205' || this.digit == '305') {
        this.subtitle = 'You are using Lao Telecom';
      }
      else if (this.digit == '207' || this.digit == '307') {
        this.subtitle = 'You are using T-Plus';
      }
      else if (this.digit == '208' || this.digit == '308') {
        this.subtitle = 'You are using Best Telcome';
      }
      else if (this.digit == '209' || this.digit == '309') {
        this.subtitle = 'You are using ETL';
      }
      else if (this.digit == this.placeholder || this.digit == 'ENT') {
        this.subtitle = 'LTC, Best, Unitel, ETL, T-Plus';
      }
      else {
        this.subtitle = 'Invalid phone number';
      }
    } else {
      this.subtitle = 'LTC, Best, Unitel, ETL, T-Plus';
    }
  }
  next(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        if (this.phonenumber == this.placeholder) throw new Error(IENMessage.invalidPhonenumber);

        const validate = this.digitModel.find(item => item.digit==this.digit.substring(0, 3)[2]);
        if (validate == undefined) throw new Error(IENMessage.invalidPhonenumber);
        this.currentImage = validate.img;
        // this.phonenumber = `+85620${this.phonenumber}`;

        this.showPhonenumberPage = false;
        this.showPaymentPage = true;
        this.showCustomAmountPage = false;

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  selectAmount(amount: number) {
    this.amount = amount;
  }
  openCustomAmountPage() {
    this.amount = 0;
    this.showPhonenumberPage = false;
    this.showPaymentPage = false;
    this.showCustomAmountPage = true;
  }
  loadCustomAmountNumberList(): void {
    for(let i = 1; i < 10; i++) {
      this.customAmountNumberList.push(i.toString());
    }
    this.customAmount = this.customAmountPlaceholder;
  }
  processCustomAmountDigits(digit: string) {
    if (this.customAmount == this.customAmountPlaceholder) {
      this.customAmount = digit;
    } else {
      if (this.customAmount.length < 8) {
        this.customAmount += digit;
      }
    }
  }
  deleteCustomDigits() {
    if (this.customAmount != this.customAmountPlaceholder) {
      if (this.customAmount != undefined && Object.entries(this.customAmount).length == 1) {
        this.customAmount = this.customAmountPlaceholder;
      } else {
        this.customAmount = this.customAmount.substring(0, this.customAmount.length - 1);
      }
    }
  }
  confirmCustomAmount(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        if (this.customAmount == this.customAmountPlaceholder) throw new Error(IENMessage.invalidCustomAmount);
        if (this.customAmount != this.customAmountPlaceholder && this.customAmount.length > 8) throw new Error(IENMessage.invalidCustomAmount);
        const amount = Number(this.customAmount);
        if (amount < 1000)throw new Error(IENMessage.minimumOfAmountIs1000);

        if (amount > Number(this.apiService.cash.amount)) throw new Error(IENMessage.balanceIsNotEnought);
        this.showCustomAmountPage = false;
        this.showPaymentPage = true;
        this.amount = Number(this.customAmount);
        this.customAmount = this.customAmountPlaceholder;

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  closeCustomAmountPage() {
    this.showCustomAmountPage = false;
    this.showPaymentPage = true;
    this.customAmount = this.customAmountPlaceholder;
  }
  confirm(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        this.apiService.simpleMessage(IENMessage.phonePaymentSuccess);
        this.apiService.modal.dismiss();

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  close() {
    this.apiService.modal.dismiss();
  }
}
