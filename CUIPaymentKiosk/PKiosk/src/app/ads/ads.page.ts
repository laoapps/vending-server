import { Component, OnInit } from '@angular/core';
import { ApiServiceService } from '../api-service.service';
import { PhonenumberPage } from '../phonenumber/phonenumber.page';
var host = window.location.protocol + "//" + window.location.host;
@Component({
  selector: 'app-ads',
  templateUrl: './ads.page.html',
  styleUrls: ['./ads.page.scss'],
})
export class AdsPage implements OnInit {
  mmLogo = host + '/assets/icon/ເກີນປຸ່ຍມຸຍ 1080x1920.png';
  constructor(public api: ApiServiceService) { }

  ngOnInit() {
  }
  close() {
    this.api.showModal(PhonenumberPage).then(v => {
      v.present();
      this.api.closeModal();
    })

  }
}
