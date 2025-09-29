import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning';
import { OrderPage } from '../../components-user/order/order.page';
import { MapPage } from '../../components-user/map/map.page';
import { ShowPageketPage } from '../../components-user/show-pageket/show-pageket.page';
import { ShowDevicesPage } from '../../components-user/show-devices/show-devices.page';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ListAllGroupsPage } from '../../components-user/list-all-groups/list-all-groups.page';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';
import { PhotoProductService } from '../../services/photo/photo-product.service';
import { HistoryPage } from '../../components-user/history/history.page';
import { WsapiService } from 'src/app/services/wsapi.service';
@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  standalone: false,

})
export class UserPage implements OnInit,OnDestroy {
  public menus = [
    {title:'Order',icon: 'time-outline',path:OrderPage},
    // {title:'Status',icon: 'information-circle-outline',path:StatusPage},
    // {title:'Scan QR Code',icon: 'qr-code-outline'},
    // {title:'Map',icon: 'map-outline',path:MapPage},
    {title:'All groups',icon: 'receipt-outline',path:ListAllGroupsPage},
    // {title:'Register owner',icon: 'albums-outline'},
  ]
  phonenumber:any
  all_gorup: any[] = [];
  devices: any[] = [];
  public image = '../../../../../assets/icon-smartcb/image.png'
  private wsalertSubscription: { unsubscribe: () => void };


  constructor(public m: LoadingService,public router:Router,public alertController:AlertController,private apiService: ApiService,public ApiVending: ApiVendingService,
    public caching:PhotoProductService,    public modalParent: ModalController,
        public wsapi: WsapiService
  ) {}
  ngOnDestroy(): void {
        console.log('unsubscribe wsalertSubscription');
    this.wsalertSubscription?.unsubscribe();
  }

  ngOnInit() {
        console.log('subscribe wsalertSubscription');
    this.wsalertSubscription = this.wsapi.onWsAlert(async (r) => {
      console.log('wsalert received:', r);
      if (r) {
        try {
          console.log('wsalert processing:', r);
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
    });
  }

  ionViewWillEnter() {
    // localStorage.setItem('machineId','66660007')
    // localStorage.setItem('otp','111111')
    // const a = localStorage.getItem("phonenumber");
    //   if (a) {
    //     this.phonenumber = a.replace("+85620", "").replace(/(\d[ .-]?){6}$/, x => x.replace(/\d/g, 'x').substring(2, a.length)) + a.replace("+85620", "").substring(6, a.length)
    //   } else {
    //     this.m.alertError('alert_error.message_something_wrong');
    //   }
    this.load_data();
  }

  logout(){
    this.m.logout();
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
        this.load_data_device();
        // if (this.all_gorup?.length ) {
        //   for (let i = 0; i < this.all_gorup.length; i++) {
        //     const e = this.all_gorup[i];
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
        if (this.all_gorup?.length) {
          for (let i = 0; i < this.all_gorup.length; i++) {
            const e = this.all_gorup[i];
        
            const imageTasks = e.description?.image.map(async (v: string) => {
              const aa = await this.caching.saveCachingPhoto(v, new Date(e.updatedAt), e.id + '');
              return JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg');
            });
        
            if (imageTasks?.length) {
              const pics = await Promise.all(imageTasks);
              e.pic = [...(e.pic || []), ...pics];
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

  // load_data_device(){
  //     this.m.onLoading('')
  //     let data = {
  //       ownerId:this.all_gorup[0]?.ownerId,
  //       id:''
  //     }
  //     this.ApiVending.getDevicesBy(data).subscribe(async (r)=>{
  //       console.log('====================================');
  //       console.log(r);
  //       console.log('====================================');
  //       this.m.onDismiss();
  //       this.devices = r
  //       for (let i = 0; i < this.all_gorup.length; i++) {
  //         const e = this.all_gorup[i];
  //         e['data_device'] = r
  //       }
  //       if (this.devices?.length ) {
  //         for (let i = 0; i < this.devices.length; i++) {
  //           const e = this.devices[i];
  //           for (let j = 0; j < e.description?.image.length; j++) {
  //             const v = e.description?.image[j];
  //             const aa = await this.caching.saveCachingPhoto(v, new Date(e.updatedAt), e.id + '');
  //             if (e?.pic?.length > 0) {
  //               e.pic.push(JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg'))
  //             }else{
  //               e['pic'] = [JSON.parse(aa).v.replace('data:application/octet-stream', 'data:image/jpeg')]
  //             }
  //           }
  //         }
  //       }
  //     },(error)=>{
  //       this.m.onDismiss();
  //       this.m.alertError('load devices fail!!')
  //     })
  // }

  async load_data_device() {
    this.m.onLoading('');
  
    for (let group of this.all_gorup) {
      let data = {
        ownerId: group.ownerId,
        id: ''
      };
  
      try {
        const devices: any = await this.ApiVending.getDevicesBy(data).toPromise();
  
        // Attach devices to this group
        group['data_device'] = devices;
  
        // Process images
        if (devices?.length) {
          for (let device of devices) {
            device.pic = device.pic || [];
            for (let img of device.description?.image || []) {
              const cached = await this.caching.saveCachingPhoto(img, new Date(device.updatedAt), device.id + '');
              device.pic.push(JSON.parse(cached).v.replace('data:application/octet-stream', 'data:image/jpeg'));
            }
          }
        }
  
      } catch (error) {
        this.m.alertError(`Load devices failed for group ${group.ownerId}!`);
        console.error(error);
      }
    }
  
    this.m.onDismiss();
  }
  

  onClick(item){
    if (item.title == 'Scan QR Code') {
      BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] })
      .then(async (barcodeData) => {
        if (barcodeData.barcodes) {
          this.getResultscan(barcodeData.barcodes[0].rawValue);
        } else {
          this.m.alertError('Error Qr not found!!')
        }
      })
      .catch((err) => {
        this.m.alertError('Error Qr not found!!')
      });
    }else if(item.title == 'Register owner'){
      const a = localStorage.getItem('token')
      this.apiService.registerOwner(a).subscribe(
        async (response) => {
          console.log('====================================');
          console.log(response);
          console.log('====================================');
          if (response) {
            this.m.onAlert('Register owner success!!')
          }
        },(error) => {
          if (error?.error?.error == 'Owner already registered') {
            this.m.onAlert('Already registered!!')
          }else{
            this.m.alertError('Register failed')
          }
        }
      );
    }else{
      this.m.showModal(item.path).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }
  //   let data = {
  //     ownerId:1
  //   }
  //   this.m.showModal(ShowDevicesPage,{data}).then((r) => {
  //     if (r) {
  //       r.present();
  //       r.onDidDismiss().then((res) => {
  //         if (res.data.dismiss) {
  //         }
  //       });
  //     }
  //   });
  }

  async getResultscan(data){
    const new_data = JSON.parse(data)
    if (new_data?.ownerId && new_data?.deviceId) {
      this.m.showModal(ShowPageketPage,{data:new_data,deviceId:new_data?.deviceId}).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }else if(new_data?.ownerId && !new_data?.deviceId || new_data?.deviceId == null){
      this.m.showModal(ShowDevicesPage,{data:JSON.parse(data)}).then((r) => {
        if (r) {
          r.present();
          r.onDidDismiss().then((res) => {
            if (res.data.dismiss) {
            }
          });
        }
      });
    }else{
      this.m.alertError('Error Qr not found!!')
    }
  }

  return_pic(item){
    if (item.pic?.length) {
      return item?.pic[0]
    }else{
      return this.image
    }
  }

  onClick_menu_sub(item,data){
    console.log('====================================');
    console.log(data);
    console.log(item);
    console.log('====================================');
    this.m.showModal(ShowPageketPage,{data,deviceId:item.id,data_device:item},'dialog-fullscreen').then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
          }
        });
      }
    });
  }

  openMenu_order(){
    this.m.showModal(OrderPage,{},'dialog-fullscreen').then((r) => {
      if (r) {
        r.present();
        r.onDidDismiss().then((res) => {
          if (res.data.dismiss) {
          }
        });
      }
    });
  }

  openMenu_History(){
    this.m.showModal(HistoryPage,{},'dialog-fullscreen').then((r) => {
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
