import { Component, OnInit } from '@angular/core';
import { ShowDevicesPage } from '../show-devices/show-devices.page';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ApiVendingService } from '../../services/api-for-vending/api-vending.service';

@Component({
  selector: 'app-list-all-groups',
  templateUrl: './list-all-groups.page.html',
  styleUrls: ['./list-all-groups.page.scss'],
  standalone: false,
})
export class ListAllGroupsPage implements OnInit {
  all_gorup: any[] = [];

  constructor(public ApiVending: ApiVendingService, public m: LoadingService) {}

  ngOnInit() {
    this.load_data();
  }

  load_data() {
    this.m.onLoading('');
    this.ApiVending.load_all_group().subscribe(
      (r) => {
        console.log('====================================');
        console.log(r);
        console.log('====================================');
        this.m.onDismiss();
        this.all_gorup = r;
      },
      (error) => {
        this.m.onDismiss();
        this.m.alertError('load all_gorup fail!!');
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
