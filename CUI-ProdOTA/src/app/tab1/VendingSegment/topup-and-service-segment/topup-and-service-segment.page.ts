import { Component, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ITopupServiceMenu } from 'src/app/models/vending.model';
import { ApiService } from 'src/app/services/api.service';
import { PhonePaymentPage } from '../../Vending/phone-payment/phone-payment.page';
import { topupServiceMenuJSON } from '../../Vending/topup-and-service/menu';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-topup-and-service-segment',
  templateUrl: './topup-and-service-segment.page.html',
  styleUrls: ['./topup-and-service-segment.page.scss'],
})
export class TopupAndServiceSegmentPage implements OnInit {

  lists: Array<any> = [];
    
  constructor(
    public apiService: ApiService,
    public modal: ModalController

  ) { 
    this.apiService.___TopupAndServiceSegmentPage = this.modal;

  }

  ngOnInit() {
    this.lists = topupServiceMenuJSON;
    this.apiService.soundOtherServices();
  }

  close() {
    this.apiService.modalCtrl.dismiss();
  }

  selectMenu(value: ITopupServiceMenu): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        if (!Object.keys(ITopupServiceMenu).includes(value)) throw new Error(IENMessage.invalidSelectionTopupServiceMenu);

        switch (value)
        {
          case ITopupServiceMenu.phone_payment:
            this.initPhonePayment();
            break;
          case ITopupServiceMenu.electricity_payment:
            break;
          case ITopupServiceMenu.water_payment:
            break;
          case ITopupServiceMenu.leasing_payment:
            break;
          case ITopupServiceMenu.bill_payment:
            break;
          case ITopupServiceMenu.insurance_payment:
            break;
          case ITopupServiceMenu.banking_insitute:
            break;
          case ITopupServiceMenu.road_tax:
            break;
          case ITopupServiceMenu.land_tax:
            break;
          case ITopupServiceMenu.loan:
            break;
          case ITopupServiceMenu.queue_booking:
            break;
          case ITopupServiceMenu.find_a_job:
            break;
          case ITopupServiceMenu.renting_service:
            break;
        }

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  initPhonePayment() {
    const props: any = {};
    this.apiService.modalCtrl.create({ component: PhonePaymentPage, componentProps: props }).then(r => {
      r.present();
    });

  }
}
