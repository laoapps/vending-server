import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
    selector: 'app-topup-service',
    templateUrl: './topup-service.page.html',
    styleUrls: ['./topup-service.page.scss'],
    standalone: false
})
export class TopupServicePage implements OnInit {

  constructor(
    public apiService: ApiService,
    public modal: ModalController
  ) { 
    this.apiService.___TopupServicePage = this.modal;

  }

  ngOnInit() {
  }

}
