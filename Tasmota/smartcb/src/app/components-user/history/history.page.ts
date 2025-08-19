import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import { DetailHistoryPage } from './detail-history/detail-history.page';
@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: false,

})
export class HistoryPage implements OnInit {
  order_active: any[] = [];
  order_no_active: any[] = [];
  public sel = 'active';
  public choice = ['active', 'no active'];
  constructor(public apiService: ApiService, public m: LoadingService) {}


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
    this.m.showModal(DetailHistoryPage,{data:item}).then((r) => {
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

  load_data(){
    this.m.onLoading('')
    this.apiService.load_order().subscribe(async (order) => {
      console.log('====================================');
      console.log('order',order);
      console.log('====================================');
      const list_order = order;
      for (let i = 0; i < list_order.length; i++) {
        const e = list_order[i];
        if (!e.startedTime || e.startedTime != null) {
          this.order_no_active.push(e)
        }else{
          this.order_active.push(e)
        }
      }
      // if (this.schedulePackages?.length ) {
      //   for (let i = 0; i < this.schedulePackages.length; i++) {
      //     const e = this.schedulePackages[i];
      //     for (let j = 0; j < e.description?.image.length; j++) {
      //       const v = e.description?.image[j];
      //       const aa = await this.caching.saveCachingPhoto(v, new Date(e.updatedAt), e.id + '');
      //       if (e?.pic?.length > 0) {
      //         e.pic.push(JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg'))
      //       }else{
      //         e['pic'] = [JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg')]
      //       }
      //     }
      //   }
      // }
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







}
