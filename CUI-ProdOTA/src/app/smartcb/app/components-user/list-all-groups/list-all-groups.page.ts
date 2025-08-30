import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShowDevicesPage } from '../show-devices/show-devices.page';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { ModalController } from '@ionic/angular';
import { WsapiService } from 'src/app/services/wsapi.service';

@Component({
  selector: 'app-list-all-groups',
  templateUrl: './list-all-groups.page.html',
  styleUrls: ['./list-all-groups.page.scss'],
  standalone: false,
})
export class ListAllGroupsPage implements OnInit, OnDestroy {
  all_gorup: any[] = [];

  constructor(public ApiVending: ApiVendingService, public m: LoadingService,
    public caching: PhotoProductService, public modalParent: ModalController, public wsapi: WsapiService
  ) { }
  ngOnDestroy(): void {
    this.wsapi.wsalertSubscription.unsubscribe();
  }
  ngOnInit() {
    this.load_data();
    this.wsapi.wsalertSubscription.subscribe(async r => {
      if (r) {
        try {

//             const data = {
//     machinetoken:token,data:{callback:'true',order}
// };
          console.log('wsalert here',r);
          let topModal = await this.modalParent.getTop();
          while (topModal) {
            await topModal.dismiss();
            topModal = await this.modalParent.getTop();
          }
          console.log('All modals dismissed');
        } catch (error) {
          console.error('Error dismissing modals:', error);
        }
      }
    })
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
        if (this.all_gorup?.length) {
          for (let i = 0; i < this.all_gorup.length; i++) {
            const e = this.all_gorup[i];
            for (let j = 0; j < e.description?.image.length; j++) {
              const v = e.description?.image[j];
              const aa = await this.caching.saveCachingPhoto(v, new Date(e.updatedAt), e.id + '');
              if (e?.pic?.length > 0) {
                e.pic.push(JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg'))
              } else {
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
