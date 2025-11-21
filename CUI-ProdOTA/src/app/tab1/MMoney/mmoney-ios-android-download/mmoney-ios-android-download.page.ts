import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import * as QRCode from 'qrcode';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-mmoney-ios-android-download',
  templateUrl: './mmoney-ios-android-download.page.html',
  styleUrls: ['./mmoney-ios-android-download.page.scss'],
})
export class MmoneyIosAndroidDownloadPage implements OnInit {

  @Input() links: Array<string>;
  
  linksource: Array<string> = [];
  
  constructor(
    public apiService: ApiService,
    public modal: ModalController
  ) { 
    this.apiService.___MmoneyIosAndroidDownloadPage = this.modal;

  }

  ngOnInit() {
    this.loadQR();
  }

  loadQR() {
    const elements = (document.querySelectorAll('.mmoney-qr-img') as NodeListOf<HTMLImageElement>);
    for(let i = 0; i < 2; i++) {
      QRCode.toDataURL(this.links[i]).then(async r => {
        elements[i].src = r;
      });
    }
  }

  close() {
    this.apiService.modalCtrl.dismiss();
  }

}
