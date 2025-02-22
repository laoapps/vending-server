import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-paymentmethod',
  templateUrl: './paymentmethod.page.html',
  styleUrls: ['./paymentmethod.page.scss'],
})
export class PaymentmethodPage implements OnInit {

  constructor(public modal: ModalController,public apiService: ApiService) { }

  ngOnInit() {
  }
  selectP(i: number){

  }

}
