import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { DevicesPage } from '../../components-owner/devices/devices.page';
import { GenQrCodePage } from '../../components-owner/gen-qr-code/gen-qr-code.page';
import { GroupsPage } from '../../components-owner/groups/groups.page';
import { ListDevicesQrPage } from '../../components-owner/list-devices-qr/list-devices-qr.page';
import { PageketsPage } from '../../components-owner/pagekets/pagekets.page';
import { LoadingService } from '../../services/loading.service';
import { ControlOrderPage } from '../../components-owner/control-order/control-order.page';

@Component({
  selector: 'app-owner',
  templateUrl: './owner.page.html',
  styleUrls: ['./owner.page.scss'],
  standalone: false,
})
export class OwnerPage implements OnInit {
  menus = [
    { title: 'Pagekets', icon: 'layers-outline', path: PageketsPage },
    { title: 'Devices', icon: 'hardware-chip-outline', path: DevicesPage },
    { title: 'Groups', icon: 'people-outline', path: GroupsPage },
    { title: 'Control order', icon: 'time-outline', path: ControlOrderPage },
    { title: 'Gen Qr code owner', icon: 'qr-code-outline', path: GenQrCodePage },
    { title: 'Gen Qr code devices', icon: 'qr-code-outline', path: ListDevicesQrPage },
  ];
  constructor(public m: LoadingService,public router:Router,public alertController:AlertController) {}

  ngOnInit() {}

  dismiss(data: any = { dismiss: true }) {
    this.m.closeModal(data);
  }

  async logout(){
    this.m.logout();
  }

  onMenuSelect(menu: any) {
    console.log('Selected menu:', menu.title);
    // Navigate or do other actions here
    this.m.showModal(menu.path).then((r) => {
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
