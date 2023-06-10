import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { IBillProcess } from '../services/syste.model';
import { RemainingbillsPage } from '../remainingbills/remainingbills.page';

@Component({
  selector: 'app-qrpay',
  templateUrl: './qrpay.page.html',
  styleUrls: ['./qrpay.page.scss'],
})
export class QrpayPage implements OnInit {
  @Input() encodedData:string;
  @Input() amount:number;
  @Input() ref:string;
  contact = localStorage.getItem('contact') || '55516321';
  constructor(public apiService:ApiService,public modal:ModalController) { }

  ngOnInit() {
    
  }
  refresh(){
    this.apiService.loadDeliveryingBills().subscribe(r => {
      if (r.status) {
        this.apiService.dismissModal();
        const pb = r.data as Array<IBillProcess>;
        if(pb.length)
        this.apiService.showModal(RemainingbillsPage, { r:pb });
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
