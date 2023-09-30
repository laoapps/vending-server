import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { IBillProcess } from '../services/syste.model';
import { RemainingbillsPage } from '../remainingbills/remainingbills.page';
import { IENMessage } from '../models/base.model';

@Component({
  selector: 'app-qrpay',
  templateUrl: './qrpay.page.html',
  styleUrls: ['./qrpay.page.scss'],
})
export class QrpayPage implements OnInit,OnDestroy {
  @Input() encodedData:string;
  @Input() amount:number;
  @Input() ref:string;
  contact = localStorage.getItem('contact') || '55516321';
  _T:any
  constructor(public apiService:ApiService,public modal:ModalController) { }
  ngOnDestroy(): void {
    if(this._T)clearTimeout(this._T)
    this._T=null;
  }

  ngOnInit() {
    const that = this;
    if(this._T)clearTimeout(this._T)
    this._T = setTimeout(() => {
      this.modal.dismiss();
    },1000*60*15);
   this.apiService.onStockDeduct((data)=>{
    console.log('onStockDeduct',data);
    that.modal.dismiss();
   })
  }
  refresh(){
    this.apiService.loadDeliveryingBills().subscribe(r => {
      if (r.status) {
        this.apiService.dismissModal();
        const pb = r.data as Array<IBillProcess>;
        if(pb.length)
        this.apiService.showModal(RemainingbillsPage, { r:pb }, false);
        this.modal.dismiss();
      }
      else {
        this.apiService.toast.create({ message: r.message, duration: 5000 }).then(r => {
          r.present();
        })
      }
    })
  }
  close(){
    this.modal.dismiss();
  }

}
