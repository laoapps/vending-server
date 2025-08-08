import { Component, OnInit } from '@angular/core';
import { DevicesPage } from 'src/app/components-owner/devices/devices.page';
import { GroupsPage } from 'src/app/components-owner/groups/groups.page';
import { PageketsPage } from 'src/app/components-owner/pagekets/pagekets.page';
import { LoadingService } from 'src/app/services/loading.service';

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
  ];
  constructor(public m: LoadingService) {}

  ngOnInit() {}

  dismiss(data: any = { dismiss: true }) {
    this.m.closeModal(data);
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
