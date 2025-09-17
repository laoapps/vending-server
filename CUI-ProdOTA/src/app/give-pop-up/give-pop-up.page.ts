import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-give-pop-up',
  templateUrl: './give-pop-up.page.html',
  styleUrls: ['./give-pop-up.page.scss'],
})
export class GivePopUpPage implements OnInit {

  phoneNumbers: string[] = Array(8).fill('');
  numberRows: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9']
  ];

  constructor(public apiService: ApiService) {

  }

  ngOnInit() { }

  onNumberClick(num: string) {
    const firstEmptyIndex = this.phoneNumbers.findIndex(n => n === '');
    if (firstEmptyIndex !== -1) {
      this.phoneNumbers[firstEmptyIndex] = num;
    }
  }

  onDelete() {
    for (let i = this.phoneNumbers.length - 1; i >= 0; i--) {
      if (this.phoneNumbers[i] !== '') {
        this.phoneNumbers[i] = '';
        break;
      }
    }
  }

  isPhoneComplete() {
    return this.phoneNumbers.every(n => n !== '');
  }

  submitPhone() {
    try {
      const phone = this.phoneNumbers.join('');
      const body = {
        name: "+85620" + phone,
        phoneNumber: "+85620" + phone,
        username: "+85620" + phone,
        password: 1234567890,
        googleToken: { phoneNumber: "+85620" + phone, otp: 111111 }
      }
      this.apiService.giveTopupOrRegisterLaabx(body).then(r => {
        console.log(`-----> submitPhone :${r.data}`);

      }).catch(err => {
        console.log('err submitPhone :', err);
      });
    } catch (error) {
      console.log('error submitPhone :', error);

    }
  }
}
