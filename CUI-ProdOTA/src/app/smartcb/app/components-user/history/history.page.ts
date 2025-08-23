import { Component, OnInit } from '@angular/core';
import { DetailHistoryPage } from './detail-history/detail-history.page';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';
@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: false,

})
export class HistoryPage implements OnInit {
  list_order: any[] = [];
  constructor(public apiService: ApiService, public m: LoadingService,
        public ApiVending: ApiVendingService
  ) {}


  ngOnInit() {
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
            this.load_data();
          }
        });
      }
    });
  }

  load_data(){
    this.m.onLoading('')
    this.ApiVending.load_history().subscribe(async (order) => {
      console.log('====================================');
      console.log('history',order);
      console.log('====================================');
      this.list_order = order;
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
      this.m.alertError('load history fail!!')
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
