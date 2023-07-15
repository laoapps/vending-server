import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';

@Component({
  selector: 'app-manage-subadmin-info',
  templateUrl: './manage-subadmin-info.page.html',
  styleUrls: ['./manage-subadmin-info.page.scss'],
})
export class ManageSubadminInfoPage implements OnInit {

  @Input() manageSubadminPage: any;
  @Input() list: any;

  constructor(
    private apiService: ApiService,
    private vendingAPIService: VendingAPIService
  ) { 

  }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }



}
