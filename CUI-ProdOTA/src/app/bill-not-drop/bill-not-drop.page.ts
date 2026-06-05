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
      // Generate QR Code data URL from the string in the bill item
      const dataUrl = await QRCode.toDataURL(item.qr);
      
      const m = await this.modalCtrl.create({
        component: QrpayPage,
        componentProps: {
          encodedData: dataUrl,
          amount: item.totalvalue,
          ref: item.paymentref
        },
        cssClass: 'dialog-fullscreen'
      });
      
      await m.present();
      
      // If payment is successful, we might want to refresh the list or close this modal
      const { data } = await m.onDidDismiss();
      if (data && data.success) {
        this.loadBillNotPaid();
      }
    } catch (error) {
      console.error('Error opening payment modal:', error);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

}
