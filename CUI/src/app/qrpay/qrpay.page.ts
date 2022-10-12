import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-qrpay',
  templateUrl: './qrpay.page.html',
  styleUrls: ['./qrpay.page.scss'],
})
export class QrpayPage implements OnInit {
  @Input() encodedData:string;
  @Input() amount:number;
  @Input() ref:string;
  constructor(public modal:ModalController) { }

  ngOnInit() {
  }
  close(){
    this.modal.dismiss();
  }
}
