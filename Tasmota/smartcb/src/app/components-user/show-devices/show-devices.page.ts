import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadingService } from 'src/app/services/loading.service';
import { PayQrPage } from '../pay-qr/pay-qr.page';
import { ShowPageketPage } from '../show-pageket/show-pageket.page';

@Component({
  selector: 'app-show-devices',
  templateUrl: './show-devices.page.html',
  styleUrls: ['./show-devices.page.scss'],
  standalone: false,

})
export class ShowDevicesPage implements OnInit {
  @Input() data:any
  devices: any[] = [];

  constructor(public apiService: ApiService, public m: LoadingService) {}

  ngOnInit() {
    // alert(this.data?.ownerID)
    this.load_data();
  }

  dismiss(data: any = { dismiss: false }) {
    this.m.closeModal(data);
  }

  load_data(){
    this.m.onLoading('')
    let data = {
      ownerId:Number(this.data?.ownerID+''),
      id:this.data?.devince
    }
    this.apiService.getDevicesBy(data).subscribe((r)=>{
      console.log('====================================');
      console.log(r);
      console.log('====================================');
      this.m.onDismiss();
      this.devices = r
    },(error)=>{
      this.m.onDismiss();
      this.m.alertError('load devices fail!!')
    })
  }

  onClick_devices(item){
    console.log('====================================');
    console.log(item);
    console.log('====================================');
    this.m.showModal(ShowPageketPage,{data:this.data,deviceID:item.id,data_device:item}).then((r) => {
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
