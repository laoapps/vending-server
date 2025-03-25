import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-coin-transfer-bill',
  templateUrl: './coin-transfer-bill.page.html',
  styleUrls: ['./coin-transfer-bill.page.scss'],
})
export class CoinTransferBillPage implements OnInit {

  @Input() myBill: any;



  constructor(
    private apiService: ApiService,
    private modal: ModalController
  ) { }

  ngOnInit() {
    console.log(`my bill`, this.myBill);

    this.generateQR();
    // this.btnState();
  }

  loadLanguage(): void {
  }

  generateQR() {
    QRCode.toDataURL(this.myBill.qr).then(async r => {
      (document.querySelector('#qr-img') as HTMLImageElement).src = r;
    })
  }

  close() {
    this.modal.dismiss();
  }

}
