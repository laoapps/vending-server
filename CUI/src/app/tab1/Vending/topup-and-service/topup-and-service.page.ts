import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { topupServiceMenuJSON } from './menu';
import { ITopupServiceMenu } from 'src/app/models/vending.model';
import { IENMessage } from 'src/app/models/base.model';
import { PhonePaymentPage } from '../phone-payment/phone-payment.page';

@Component({
  selector: 'app-topup-and-service',
  templateUrl: './topup-and-service.page.html',
  styleUrls: ['./topup-and-service.page.scss'],
})
export class TopupAndServicePage implements OnInit {

  lists: Array<any> = [];
    
  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.lists = topupServiceMenuJSON;
  }

  close() {
    this.apiService.modal.dismiss();
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
    this.apiService.modal.create({ component: PhonePaymentPage, componentProps: props }).then(r => {
      r.present();
    });

  }
     
}
