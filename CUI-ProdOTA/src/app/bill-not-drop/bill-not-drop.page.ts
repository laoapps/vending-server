import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';


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
        if (response.data.data?.count <= 0) {
          this.dismiss();
        }
        this.apiService.ownerUuid = response.data.data.ownerUuid;
        const rows = response.data.data.rows ?? [];
        this.billNotPaid = rows.map((item: any) => ({ ...item, loading: false }));
        this.checkPayAndDrop(this.billNotPaid[0]);
      } else {
        this.dismiss();
      }
    } catch (error) {
      console.error('Error loading unpaid bills:', error);
    }
  }

  async checkPayAndDrop(item: any) {
    if (item.loading) return;
    item.loading = true;
    try {
      const response = await this.apiService.checkPaidAndDrop(item?.transactionID);
      // const response = await this.apiService.checkPaidAndDrop('205885355620260606122706');
      if (response.data.status === 1) {
        this.dismiss();
      } else {
        this.billNotPaid = this.billNotPaid.filter((i: any) => i.transactionID !== item.transactionID);
      }
      // console.log('-----> RESPONSE :', response.data);

    } catch (error) {
      console.error('Error opening payment modal:', error);
    } finally {
      item.loading = false;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

}
