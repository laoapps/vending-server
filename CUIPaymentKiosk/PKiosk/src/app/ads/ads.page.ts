import { Component, OnInit } from '@angular/core';
import { AnimationController } from '@ionic/angular';
import { ApiServiceService } from '../api-service.service';
import { PhonenumberPage } from '../phonenumber/phonenumber.page';
var host = window.location.protocol + "//" + window.location.host;
@Component({
  selector: 'app-ads',
  templateUrl: './ads.page.html',
  styleUrls: ['./ads.page.scss'],
})
export class AdsPage implements OnInit {
  mmLogo ='/assets/icon/d1080x1920.png';

  ads = [
    'd1080x1920.png',
    '10 10 1080x1920.png',
    'Award 1080x1920.png',
    'Data Browling 1080x1920.png',
    'FTTH 1080x1920.png',
    'Pay EAON & Kurngsi 1080x1920.png',
    // 'Thatluang Fest 1080x1920.png',
    // 'Thatluang Give a way.png'
  ]
  t: any;
  constructor(public api: ApiServiceService, private animationCtrl: AnimationController) {
  }

  ngOnInit() {
    const el = document.getElementById('ads') as HTMLImageElement;
    // const ani = this.animationCtrl.create();
    
    this.t = setInterval(() => {

      el.src = this.getAds();
      // ani.addElement(el)
      //   .duration(5000)
      //   .fromTo('opacity', '1', '0');

      console.log('change', el.src);

    }, 5000);
  }
  i = 0;
  getAds() {
    if (++this.i > this.ads.length - 1) this.i = 0;
    return '/assets/icon/' + this.ads[this.i];
  }
  close() {
    clearInterval(this.t);
    this.api.showModal(PhonenumberPage).then(v => {
      v.present();
      this.api.closeModal();
    })

  }
}
