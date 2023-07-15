import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';

@Component({
  selector: 'app-manage-subadmin-create',
  templateUrl: './manage-subadmin-create.page.html',
  styleUrls: ['./manage-subadmin-create.page.scss'],
})
export class ManageSubadminCreatePage implements OnInit {

  constructor(
        private apiService: ApiService,
    private vendingAPIServgice: VendingAPIService
  ) { }

  ngOnInit() {
  }

  close() {
    this.apiService.modal.dismiss();
  }

}
