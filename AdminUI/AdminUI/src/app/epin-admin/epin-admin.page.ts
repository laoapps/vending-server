import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { FindEPINShortCodeListProcess } from './processes/findEPINShortCodeList.process';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import * as moment from 'moment';
import * as momenttimezone from 'moment-timezone';
import { ReCreateEPINProcess } from './processes/recreateEPIN.process';
import { CounterCashout_CashProcess } from './processes/counterCashout_cash.process';
import { ShowEPINShortCodeListProcess } from './processes/showEPINShortCodeList.process';
import { ManageEpinPage } from './manage-epin/manage-epin.page';
import { ManageSubadminPage } from './manage-subadmin/manage-subadmin.page';

@Component({
  selector: 'app-epin-admin',
  templateUrl: './epin-admin.page.html',
  styleUrls: ['./epin-admin.page.scss'],
})
export class EpinAdminPage implements OnInit {






  constructor(
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
      
  }

  close() {
    this.apiService.modal.dismiss();
  }

  openManageEPIN() {
    this.apiService.showModal(ManageEpinPage, { }).then(r => {
      r.present();
    });
  }
  openManageSubAdmin() {
    this.apiService.showModal(ManageSubadminPage, { }).then(r => {
      r.present();
    });
  }

}
