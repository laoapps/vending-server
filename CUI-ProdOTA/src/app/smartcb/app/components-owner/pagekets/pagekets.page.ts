import { Component, OnInit } from '@angular/core';
import { AddPageketsPage } from './add-pagekets/add-pagekets.page';
import { AlertController } from '@ionic/angular';
import { LoadingService } from '../../services/loading.service';
import { ApiService } from '../../services/api.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';

@Component({
  selector: 'app-pagekets',
  templateUrl: './pagekets.page.html',
  styleUrls: ['./pagekets.page.scss'],
  standalone: false,
})
export class PageketsPage implements OnInit {
  schedulePackages: any[] = [];
  public image = '../../../assets/icon/image.png'

  constructor(public m: LoadingService, private apiService: ApiService,
    public alertController: AlertController,
    public caching:PhotoProductService
  ) {}

  ngOnInit() {
    this.load_data();
  }

  load_data(){
    this.m.onLoading('')
    this.apiService.getSchedulePackages().subscribe(async (packages) => {
      console.log('====================================');
      console.log('packages',packages);
      console.log('====================================');
      this.schedulePackages = packages;
      if (this.schedulePackages?.length ) {
        for (let i = 0; i < this.schedulePackages.length; i++) {
          const e = this.schedulePackages[i];
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
      this.m.onDismiss();
    },error=>{
      this.m.onDismiss();
      this.m.alertError('load pageket fail!!')
    });
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  async deleteSchedulePackage(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this schedule package?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          handler: () => {
            this.apiService.deleteSchedulePackage(id).subscribe(
              () => {
                this.schedulePackages = [];
                this.load_data();
              },
              (error) => {
                this.m.alertError('Delete pageket fail!!')
              }
            );
          },
        },
      ],
    });
    await alert.present();
  }

  openEditModal(item: any) {
    this.m.showModal(AddPageketsPage, { data: item,title:'edit' }).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.schedulePackages = [];
            this.load_data();
          }
        });
      }
    });

  }

  onClick_add() {
    this.m.showModal(AddPageketsPage,{title:'add'}).then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
            this.schedulePackages = [];
            this.load_data();
          }
        });
      }
    });
  }

  return_pic(item){
    if (item.pic?.length) {
      return item?.pic[0]
    }else{
      return this.image
    }
  }
}
