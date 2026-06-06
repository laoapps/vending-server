import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import * as QRCode from 'qrcode';
import { QrpayPage } from '../qrpay/qrpay.page';

@Component({
  selector: 'app-bill-not-drop',
  templateUrl: './bill-not-drop.page.html',
  styleUrls: ['./bill-not-drop.page.scss'],
})
export class BillNotDropPage implements OnInit {

  billNotPaid: any = [];

  constructor(
    private apiService: ApiService,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.loadBillNotPaid();
  }

  async loadBillNotPaid() {
    try {
      const response = await this.apiService.loadBillNotPaid();
      if (response.data.status === 1) {
        this.apiService.ownerUuid = response.data.data.ownerUuid;
        this.billNotPaid = response.data.data.rows ?? [];
      } else {
        this.dismiss();
      }
    } catch (error) {
      console.error('Error loading unpaid bills:', error);
    }
  }

  async pay(item: any) {
    try {
      console.log('-----> ITEM :', item);
      // const response = await this.apiService.checkPaidAndDrop('');
    } catch (error) {
      console.error('Error opening payment modal:', error);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

}
