import { Component, OnInit } from '@angular/core';
import { ShowDevicesPage } from '../show-devices/show-devices.page';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';

@Component({
  selector: 'app-list-all-groups',
  templateUrl: './list-all-groups.page.html',
  styleUrls: ['./list-all-groups.page.scss'],
  standalone: false,
})
export class ListAllGroupsPage implements OnInit {
  all_gorup: any[] = [];

  constructor(public ApiVending: ApiVendingService, public m: LoadingService,
    public caching:PhotoProductService
  ) {}

  ngOnInit() {
    this.load_data();
  }

  load_data() {
    this.m.onLoading('');
    this.ApiVending.load_all_group().subscribe(
      async (r) => {
        console.log('====================================');
        console.log(r);
        console.log('====================================');
        this.m.onDismiss();
        this.all_gorup = r;
        if (this.all_gorup?.length ) {
          for (let i = 0; i < this.all_gorup.length; i++) {
            const e = this.all_gorup[i];
            for (let j = 0; j < e.description?.image.length; j++) {
              const v = e.description?.image[j];
              const aa = await this.caching.saveCachingPhoto(v, new Date(e.updatedAt), e.id + '');
              if (e?.pic?.length > 0) {
                e.pic.push(JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg'))
              }else{
                e['pic'] = [JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg')]
              }
            }
          }
        }
      },
      (error) => {
        this.m.onDismiss();
        this.m.alertError('load all gorup fail!!');
      }
    );
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  onClick(item) {
    this.m.showModal(ShowDevicesPage, { data: item }).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
          }
        });
      }
    });
  }
}
