import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-get-coupon-promotion',
  templateUrl: './get-coupon-promotion.page.html',
  styleUrls: ['./get-coupon-promotion.page.scss'],
})
export class GetCouponPromotionPage implements OnInit {

  constructor(
    private apiService: ApiService,
    private modalCtrl: ModalController
  ) { }

  qrCode: string = '';
  balanceValue: number = 0;


  ngOnInit() {
    this.loadCoupon();
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
  async loadCoupon() {
    try {
      const response = await this.apiService.loaCouponPromotion();
      if (response.data.status !== 1) {
        this.dismiss();
        this.apiService.simpleMessage('ບໍ່ສາມາດຮັບລາວວັນໄດ້');
        return;
      }
      // console.log('-----> RESPONSE :', response.data);
      const qrData = {
        type: response.data.data?.type,
        uuid: response.data.data?.uuid,
        url: response.data.data?.url
      };
      this.balanceValue = response.data.data?.record?.value ?? 0;
      this.qrCode = JSON.stringify(qrData);
      console.log('-----> QR :', this.qrCode);
      console.log('-----> BALANCE  :', this.balanceValue);

    } catch (error) {

    }
  }
}
