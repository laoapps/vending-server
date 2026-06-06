import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-get-coupon-promotion',
  templateUrl: './get-coupon-promotion.page.html',
  styleUrls: ['./get-coupon-promotion.page.scss'],
})
export class GetCouponPromotionPage implements OnInit, OnDestroy {

  constructor(
    private apiService: ApiService,
    private modalCtrl: ModalController
  ) { }

  qrCode: string = '';
  balanceValue: number = 0;
  private autoDismissTimer: any;


  ngOnInit() {
    this.loadCoupon();
    this.startAutoDismissTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  startAutoDismissTimer() {
    this.clearTimer();
    this.autoDismissTimer = setTimeout(() => {
      this.dismiss();
    }, 60000); // 1 minute
  }

  clearTimer() {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
    }
  }

  dismiss() {
    this.clearTimer();
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
      const qrData = {
        type: response.data.data?.type,
        uuid: response.data.data?.uuid,
        url: response.data.data?.url
      };
      this.balanceValue = response.data.data?.record?.value ?? 0;
      this.qrCode = JSON.stringify(qrData);
    } catch (error) {

    }
  }
}
