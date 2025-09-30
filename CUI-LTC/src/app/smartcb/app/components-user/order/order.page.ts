import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { DetailHistoryPage } from '../history/detail-history/detail-history.page';
import { DetailOrderPage } from './detail-order/detail-order.page';
import { HistoryPage } from '../history/history.page';
import { ApiService } from '../../services/api.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
  standalone: false,
})
export class OrderPage implements OnInit {
 order_active: any[] = [];
  order_no_active: any[] = [];
  public sel = 'active';
  public choice = ['active', 'no active'];
    public image = '../../../../../assets/icon-smartcb/image.png'
  constructor(public apiService: ApiService, public m: LoadingService,
    public ApiVending: ApiVendingService

  ) {}


  ngOnInit() {
    this.load_data();
  }

  segmentChanged(e: any) {
    this.sel = e.target.value;
    this.order_active = []
    this.order_no_active = []
    this.load_data();
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  onClick_detail(item){
    this.m.showModal(DetailOrderPage,{data:item},'dialog-fullscreen').then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.order_active = []
            this.order_no_active = []
            this.load_data();
          }
        });
      }
    });
  }

  click_history(){
    this.m.showModal(HistoryPage,{},'dialog-fullscreen').then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            // this.order_active = []
            // this.order_no_active = []
            // this.load_data();
          }
        });
      }
    });
  }

  load_data(){
    this.m.onLoading('')
    this.ApiVending.load_order().subscribe(async (order) => {
      console.log('====================================');
      console.log('order',order);
      console.log('====================================');
      this.order_active = order;
      this.m.onDismiss();
    },error=>{
      this.m.onDismiss();
      this.m.alertError('load order fail!!')
    });
  }

  

  formatDate(value?: string | number) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    // ຈັດຮູບແບບວັນທີ ແລະ ເວລາ
    return d.toLocaleString();
  }

  onClick_restart(id){
    this.m.onLoading('')
    this.ApiVending.controlbyorder(id).subscribe(async (control) => {
      console.log('====================================');
      console.log('control',control);
      console.log('====================================');
      this.m.onDismiss();
      if (control.message == 'Command sent') {
        this.m.onAlert('Seccessful !!')
      }else{
        this.m.onDismiss();
        this.m.alertError('load control fail!!')
      }
      this.m.onDismiss();
    },error=>{
      this.m.onDismiss();
      this.m.alertError('load control fail!!')
    });
  }

}
