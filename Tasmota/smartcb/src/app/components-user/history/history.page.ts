import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: false,

})
export class HistoryPage implements OnInit {
  order: any[] = [];

  constructor(public apiService: ApiService, public m: LoadingService) {}


  ngOnInit() {
    this.load_data();
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  load_data(){
    this.m.onLoading('')
    this.apiService.load_order().subscribe(async (order) => {
      console.log('====================================');
      console.log('order',order);
      console.log('====================================');
      this.order = order;
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

}
